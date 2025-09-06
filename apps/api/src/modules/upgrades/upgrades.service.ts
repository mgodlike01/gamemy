// apps/api/src/modules/upgrades/upgrades.service.ts
// Сервис апгрейдов: список, покупка, пересчёт майна (ratePerHour/bufferCap)

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// --- базовые значения и алиасы id улучшений ---
const BASE_RATE_PER_HOUR = 1000;
const BASE_BUFFER_CAP = 1000;

const RATE_IDS = new Set(['RATE', 'rate', 'power', 'speed', 'mining_rate']); // power и speed → рост скорости
const BUFFER_IDS = new Set(['BUFFER', 'buffer', 'capacity', 'storage']);      // capacity → рост буфера
const ENERGY_IDS = new Set(['ENERGY', 'energy', 'regen']);  

// маленькие утилы
const round = (n: number) => Math.round(n);
function cumulativeCost(baseCost: number, costK: number, currentLevel: number, L: number) {
    if (L <= 0) return 0;
    if (costK === 1) return baseCost * L;
    const start = Math.pow(costK, currentLevel);
    const geom = (Math.pow(costK, L) - 1) / (costK - 1);
    return baseCost * start * geom;
}

// Тип клиента БД: либо обычный PrismaService, либо транзакционный клиент
type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UpgradesService {
    constructor(private prisma: PrismaService) { }

    // Создаём пользователя, если его нет
    async getOrCreateUserByTgId(tgId: string) {
        const user = await this.prisma.user.upsert({
            where: { tgId },
            update: {},
            create: { tgId, username: null, displayName: null },
        });
        return user;
    }

    // Авто-создание дефолтных типов (если пусто)
    private async ensureDefaultTypes(db: DbClient) {
        const count = await db.upgradeType.count();
        if (count > 0) return;

        const defaults = [
            { id: 'RATE', title: 'Скорость добычи', icon: '⚒️', baseCost: 100, costK: 1.35, valuePerLevel: 0.02, maxLevel: 0 },
            { id: 'BUFFER', title: 'Ёмкость буфера', icon: '📦', baseCost: 150, costK: 1.35, valuePerLevel: 10, maxLevel: 0 },
            { id: 'ENERGY', title: 'Реген энергии', icon: '⚡', baseCost: 120, costK: 1.35, valuePerLevel: 0.05, maxLevel: 0 },
        ] as const;

        for (const t of defaults) {
            await db.upgradeType.upsert({ where: { id: t.id }, create: t, update: t });
        }
    }

    // Список улучшений + кошелёк
    async listForUser(userId: string) {
        // дефолтные типы на случай пустой БД
        await this.ensureDefaultTypes(this.prisma);

        await this.recalcMineFromUpgrades(this.prisma, userId);

        const [types, upgrades] = await this.prisma.$transaction([
            this.prisma.upgradeType.findMany({ orderBy: { title: 'asc' } }),
            this.prisma.userUpgrade.findMany({ where: { userId } }),
        ]);

        // лениво создаём MineState
        let mine = await this.prisma.mineState.findUnique({ where: { userId } });
        if (!mine) {
            mine = await this.prisma.mineState.create({
                data: { userId, ratePerHour: BASE_RATE_PER_HOUR, buffer: 0, bufferCap: BASE_BUFFER_CAP, warehouse: 500 },
            });
        }

        const byType = new Map(upgrades.map(u => [u.typeId, u]));

        const list = types.map(t => {
            const u = byType.get(t.id);
            const level = u?.level ?? 0;
            const nextCost = round(t.baseCost * Math.pow(t.costK, level));
            const canBuy = mine!.warehouse >= nextCost && (t.maxLevel === 0 || level < t.maxLevel);

            return {
                id: t.id,
                title: t.title,
                icon: t.icon,
                baseCost: t.baseCost,
                costK: t.costK,
                valuePerLevel: t.valuePerLevel,
                maxLevel: t.maxLevel,
                level,
                value: u?.value ?? 0,
                nextCost,
                canBuy,
            };
        });

        return {
            upgrades: list,
            wallet: {
                warehouse: mine.warehouse,
                buffer: mine.buffer,
                bufferCap: mine.bufferCap,
                ratePerHour: mine.ratePerHour,
            },
        };
    }

    // Покупка L уровней
    async buy(userId: string, typeId: string, levels: number) {
        return await this.prisma.$transaction(async (tx) => {
            await this.ensureDefaultTypes(tx);

            const type = await tx.upgradeType.findUnique({ where: { id: typeId } });
            if (!type) throw new NotFoundException('Тип улучшения не найден');

            const current = await tx.userUpgrade.findUnique({
                where: { userId_typeId: { userId, typeId } },
            });
            const currentLevel = current?.level ?? 0;

            if (type.maxLevel && type.maxLevel > 0) {
                const target = currentLevel + levels;
                if (target > type.maxLevel) {
                    throw new BadRequestException(`Макс. уровень: ${type.maxLevel}`);
                }
            }

            // лениво создаём MineState
            let mine = await tx.mineState.findUnique({ where: { userId } });
            if (!mine) {
                mine = await tx.mineState.create({
                    data: { userId, ratePerHour: BASE_RATE_PER_HOUR, buffer: 0, bufferCap: BASE_BUFFER_CAP, warehouse: 500 },
                });
            }

            const totalCost = round(cumulativeCost(type.baseCost, type.costK, currentLevel, levels));
            if (mine.warehouse < totalCost) {
                throw new BadRequestException(`Недостаточно ресурсов: нужно ${totalCost}, есть ${mine.warehouse}`);
            }

            const updatedMine = await tx.mineState.update({
                where: { userId },
                data: { warehouse: mine.warehouse - totalCost },
            });

            const newLevel = currentLevel + levels;
            const newValue = newLevel * type.valuePerLevel;

            if (current) {
                await tx.userUpgrade.update({
                    where: { userId_typeId: { userId, typeId } },
                    data: { level: newLevel, value: newValue },
                });
            } else {
                await tx.userUpgrade.create({
                    data: { userId, typeId, level: newLevel, value: newValue },
                });
            }

            // Пересчёт статов шахты внутри ЭТОЙ ЖЕ транзакции
            await this.recalcMineFromUpgrades(tx, userId);

            return {
                success: true,
                typeId,
                spent: totalCost,
                newLevel,
                newValue,
                wallet: { warehouse: updatedMine.warehouse },
            };
        });
    }

    // ====== приватные методы КЛАССА ниже ======

    // Сбор тоталов по апгрейдам (учитываем алиасы id и эвристику по title)
    private async getUpgradeTotals(db: DbClient, userId: string) {
        const ups = await db.userUpgrade.findMany({
            where: { userId },
            include: { type: true },
        });

        let rateMul = 0;
        let bufferAdd = 0;
        let energy = 0;

        for (const u of ups) {
            const tId = String(u.typeId || '');
            const v = u.value ?? 0;

            if (RATE_IDS.has(tId)) rateMul += v;
            if (BUFFER_IDS.has(tId)) bufferAdd += v;
            if (ENERGY_IDS.has(tId)) energy += v;

            // fallback по title (если id «нестандартный»)
            const tTitle = u.type?.title?.toLowerCase?.() ?? '';
            if (!RATE_IDS.has(tId) && /скорост|speed|rate|power/.test(tTitle)) rateMul += v;
            if (!BUFFER_IDS.has(tId) && /буфер|склад|ёмк|capacity|storage/.test(tTitle)) bufferAdd += v;
            if (!ENERGY_IDS.has(tId) && /энерг|energy|regen/.test(tTitle)) energy += v;
        }

        // для дебага увидим суммарные значения
        console.log('[UPG totals]', { userId, rateMul, bufferAdd, energy });

        return { rateMul, bufferAdd, energy };
    }

    // Пересчёт MineState из апгрейдов
    private async recalcMineFromUpgrades(db: DbClient, userId: string) {
        const { rateMul, bufferAdd } = await this.getUpgradeTotals(db, userId);

        let mine = await db.mineState.findUnique({ where: { userId } });
        if (!mine) {
            mine = await db.mineState.create({
                data: {
                    userId,
                    ratePerHour: BASE_RATE_PER_HOUR,
                    buffer: 0,
                    bufferCap: BASE_BUFFER_CAP,
                    warehouse: 0,
                },
            });
        }

        const newRate = Math.round(BASE_RATE_PER_HOUR * (1 + rateMul));
        const newBuffer = Math.round(BASE_BUFFER_CAP + bufferAdd);

        if (mine.ratePerHour !== newRate || mine.bufferCap !== newBuffer) {
            await db.mineState.update({
                where: { userId },
                data: { ratePerHour: newRate, bufferCap: newBuffer },
            });
        }
    }

    // (опционально) отладочный снимок БД
    async debugSnapshot(userId: string) {
        const [user, mine, ups, types] = await this.prisma.$transaction([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.mineState.findUnique({ where: { userId } }),
            this.prisma.userUpgrade.findMany({ where: { userId } }),
            this.prisma.upgradeType.findMany(),
        ]);
        return { user, mine, ups, types };
    }
}
