/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../profile/xp.service';

const STEAL_PCT = Number(process.env.STEAL_PCT ?? 0.2);          // доля от капы, которую можно украсть за раз
const STEAL_CAP = Number(process.env.STEAL_CAP ?? 300);          // жёсткий потолок кражи за раз
const ENERGY_MAX = Number(process.env.RAID_ENERGY_MAX ?? 5);
const ENERGY_REGEN_MIN = Number(process.env.RAID_ENERGY_REGEN_MIN ?? 30);
const SHIELD_AFTER_RAID_MIN = Number(process.env.SHIELD_AFTER_RAID_MIN ?? 30);
const RAID_COOLDOWN_MIN = Number(process.env.RAID_COOLDOWN_MIN ?? 10);
const RAID_DAILY_LIMIT = Number(process.env.RAID_DAILY_LIMIT ?? 50);

@Injectable()
export class RaidsService {
    constructor(public prisma: PrismaService, private xp: XpService) { }

    private regenEnergy(energy: number, updatedAt: Date) {
        const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
        if (mins <= 0) return { energy, updatedAt };
        const gained = Math.floor(mins / ENERGY_REGEN_MIN);
        if (gained <= 0) return { energy, updatedAt };
        const newEnergy = Math.min(ENERGY_MAX, energy + gained);
        const leftoverMins = mins % ENERGY_REGEN_MIN;
        const newUpdatedAt = new Date(Date.now() - leftoverMins * 60000);
        return { energy: newEnergy, updatedAt: newUpdatedAt };
    }

    async getOrCreateUser(tgId: string) {
        let user = await this.prisma.user.findUnique({ where: { tgId } });
        if (!user) user = await this.prisma.user.create({ data: { tgId } });
        const { energy, updatedAt } = this.regenEnergy(user.raidEnergy, user.raidEnergyUpdatedAt);
        if (energy !== user.raidEnergy) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { raidEnergy: energy, raidEnergyUpdatedAt: updatedAt },
            });
        }
        return user;
    }

    /** Список целей для рейда */
    // src/modules/raids/raids.service.ts
    async findTargetsFor(tgId: string, limit = 5) {
        // кто атакует (нужна энергия)
        const me = await this.getOrCreateUser(tgId);
        const myEnergy = me.raidEnergy;

        // берём кандидатов с запасом (чтобы потом отфильтровать) и НЕ берём самого себя
        const rows = await this.prisma.mineState.findMany({
            where: {
                userId: { not: me.id },   // не возвращаем самого игрока
                buffer: { gt: 0 },        // есть что красть
            },
            orderBy: [{ buffer: 'desc' }], // сверху — самые «жирные»
            take: limit * 3,                // с запасом
            select: {
                userId: true,
                buffer: true,
                bufferCap: true,
                ratePerHour: true,
                shieldUntil: true,
                user: {
                    select: {
                        tgId: true,
                        displayName: true,
                        username: true,
                    },
                },
            },
        });

        const nowTs = Date.now();

        const mapped = rows
            .map((r) => {
                const tg = r.user?.tgId ? String(r.user.tgId) : '';
                const tag =
                    r.user?.displayName ??
                    r.user?.username ??
                    tg ??
                    'unknown';

                const shieldTs = r.shieldUntil ? r.shieldUntil.getTime() : 0;
                const isShielded = shieldTs > nowTs;

                return {
                    userId: r.userId,
                    tgId: tg,
                    tag,
                    buffer: r.buffer,
                    bufferCap: r.bufferCap,
                    ratePerHour: r.ratePerHour,
                    shieldUntil: r.shieldUntil ? r.shieldUntil.toISOString() : null,
                    isShielded,
                    canAttack: !!tg && !isShielded && myEnergy > 0, // ← ключевая логика
                };
            })
            // выкидываем мусор без tgId
            .filter((t) => !!t.tgId);

        // режем до лимита и возвращаем
        return mapped.slice(0, limit);
    }


    /** Атака */
    async attack(attackerTgId: string, targetTgId: string) {
        const now = new Date();

        const attacker = await this.getOrCreateUser(attackerTgId);
        const target = await this.getOrCreateUser(targetTgId);

        if (attacker.id === target.id) throw new Error('Cannot raid yourself');
        if (attacker.raidEnergy <= 0) throw new Error('Not enough energy');

        // Кулдаун по паре attacker->target
        const lastPair = await this.prisma.raidLog.findFirst({
            where: { attackerId: attacker.id, targetId: target.id },
            orderBy: { createdAt: 'desc' },
        });
        if (lastPair) {
            const diffMin = (now.getTime() - lastPair.createdAt.getTime()) / 60000;
            if (diffMin < RAID_COOLDOWN_MIN) {
                const wait = Math.ceil(RAID_COOLDOWN_MIN - diffMin);
                throw new Error(`Cooldown: try later (${wait} min)`);
            }
        }

        // Дневной лимит атак (UTC)
        const dayStart = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0
        ));
        const todayCount = await this.prisma.raidLog.count({
            where: { attackerId: attacker.id, createdAt: { gte: dayStart } },
        });
        if (todayCount >= RAID_DAILY_LIMIT) throw new Error('Daily raid limit reached');

        // Состояние цели
        const targetMine = await this.prisma.mineState.findUnique({ where: { userId: target.id } });
        if (!targetMine) throw new Error('Target mine not found');
        if (targetMine.shieldUntil && targetMine.shieldUntil > now) throw new Error('Target is shielded');

        // Сколько украсть за раз
        const pctCap = Math.floor(targetMine.bufferCap * STEAL_PCT);
        const maxStealOnce = Math.max(0, Math.min(STEAL_CAP, pctCap));
        const stolen = Math.max(0, Math.min(targetMine.buffer, maxStealOnce));

        const newShield = new Date(now.getTime() + SHIELD_AFTER_RAID_MIN * 60_000);

        // Транзакция: списать у цели, начислить атакующему, списать энергию, лог, щит жертве
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.mineState.update({
                where: { id: targetMine.id },
                data: {
                    buffer: Math.max(0, targetMine.buffer - stolen),
                    shieldUntil:
                        targetMine.shieldUntil && targetMine.shieldUntil > newShield
                            ? targetMine.shieldUntil
                            : newShield,
                },
            });
            await this.xp.awardByUserId(attacker.id, 20);
            const attackerMine = await tx.mineState.findUnique({ where: { userId: attacker.id } });
            if (!attackerMine) throw new Error('Attacker mine not found');

            await tx.mineState.update({
                where: { id: attackerMine.id },
                data: { warehouse: attackerMine.warehouse + stolen },
            });

            await tx.user.update({
                where: { id: attacker.id },
                data: { raidEnergy: Math.max(0, attacker.raidEnergy - 1), raidEnergyUpdatedAt: now },
            });

            const log = await tx.raidLog.create({
                data: { attackerId: attacker.id, targetId: target.id, amount: stolen },
            });

            return { stolen, energyLeft: Math.max(0, attacker.raidEnergy - 1), logId: log.id, shieldUntil: newShield };



        });
        await this.xp.awardByUserId(attacker.id, 20);
        return result;
        
    }

    /** Журнал для пользователя (по tgId), с удобными тегами */
    async getLogsForUser(tgId: string, limit = 20) {
        const me = await this.getOrCreateUser(tgId);

        const logs = await this.prisma.raidLog.findMany({
            where: { OR: [{ attackerId: me.id }, { targetId: me.id }] },
            orderBy: { createdAt: 'desc' },
            take: Math.max(1, Math.min(50, limit)),
        });

        const ids = Array.from(new Set(logs.flatMap(l => [l.attackerId, l.targetId])));
        const users = await this.prisma.user.findMany({ where: { id: { in: ids } } });
        const byId = new Map(users.map(u => [u.id, u]));

        return logs.map((l) => {
            const attacker = byId.get(l.attackerId);
            const target = byId.get(l.targetId);
            const isOutbound = l.attackerId === me.id;

            const attackerTag = attacker?.displayName ?? attacker?.username ?? attacker?.tgId ?? 'unknown';
            const targetTag = target?.displayName ?? target?.username ?? target?.tgId ?? 'unknown';

            const message = isOutbound
                ? `Ты ограбил ${targetTag} и украл ${l.amount}`
                : `${attackerTag} ограбил тебя и украл ${l.amount}`;

            return {
                id: l.id,
                createdAt: l.createdAt,
                amount: l.amount,
                isOutbound,
                attackerTgId: attacker?.tgId ?? '',
                targetTgId: target?.tgId ?? '',
                attackerTag,
                targetTag,
                message,
            };
        });
    }

    // ВНИЗЕ файла, но внутри export class RaidsService { ... }
    // Вернём статус энергии игрока
    async getStatus(tgId: string) {
        const user = await this.getOrCreateUser(tgId);
        const mine = await this.prisma.mineState.findUnique({
            where: { userId: user.id },
            select: { warehouse: true, buffer: true, bufferCap: true, ratePerHour: true },
        });

        // 👇 ВРЕМЕННЫЙ ЛОГ ДЛЯ ДИАГНОСТИКИ
        console.log('[RAIDS/status]', {
            tgId,
            userId: user.id,
            warehouse: mine?.warehouse,
            buffer: mine?.buffer,
            bufferCap: mine?.bufferCap,
            ratePerHour: mine?.ratePerHour,
        });

        return {
            energy: user.raidEnergy,
            energyMax: Number(process.env.RAID_ENERGY_MAX ?? 5),
            regenFrom: user.raidEnergyUpdatedAt,
            regenEveryMin: Number(process.env.RAID_ENERGY_REGEN_MIN ?? 30),
            serverNow: new Date().toISOString(),

            // 👇 добавили
            myWarehouse: mine?.warehouse ?? 0,
            mineStats: {
                buffer: mine?.buffer ?? 0,
                bufferCap: mine?.bufferCap ?? 0,
                ratePerHour: mine?.ratePerHour ?? 0,
            },
        };
    }


}
