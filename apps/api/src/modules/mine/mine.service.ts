import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MineState } from '@prisma/client';
import { XpService } from '../profile/xp.service';

const MINUTE_MS = 60_000;

@Injectable()
export class MineService {
    constructor(private prisma: PrismaService, private xp: XpService) {}

  private now() { return new Date(); }

  /** Гарантируем, что у пользователя есть запись в MineState */
  private async getOrCreateMineByUserId(userId: string): Promise<MineState> {
    return this.prisma.mineState.upsert({
      where: { userId },
      update: {},
      create: { userId }, // создаст с дефолтами из Prisma-схемы
    });
  }

  /** Создаём пользователя при первом заходе (с MineState уже не обязателен, мы сделаем upsert отдельно) */
  async ensureUser(tgId: string, username?: string) {
    let user = await this.prisma.user.findUnique({ where: { tgId } });
    if (!user) {
      user = await this.prisma.user.create({ data: { tgId, username } });
    }
    return user;
  }

  async getMine(tgId: string) {
    const user = await this.ensureUser(tgId);
    let mine = await this.getOrCreateMineByUserId(user.id);
    mine = await this.applyPassive(mine);
    return {
      ratePerHour: mine.ratePerHour,
      buffer: mine.buffer,
      bufferCap: mine.bufferCap,
      warehouse: mine.warehouse,
      shieldUntil: mine.shieldUntil,
      updatedAt: mine.updatedAt,
    };
  }

  private async applyPassive(mine: MineState): Promise<MineState> {
    const last = mine.updatedAt ?? mine.createdAt;
    const minutes = Math.max(0, Math.floor((this.now().getTime() - new Date(last).getTime()) / MINUTE_MS));
    if (minutes <= 0) return mine;

    const perMin = Math.floor(mine.ratePerHour / 60);
    const add = perMin * minutes;
    const newBuffer = Math.min(mine.buffer + add, mine.bufferCap);

    return this.prisma.mineState.update({
      where: { id: mine.id },
      data: { buffer: newBuffer },
    });
  }

    async claim(tgId: string) {
        const user = await this.ensureUser(tgId);
        const mine = await this.prisma.mineState.findUnique({ where: { userId: user.id } });
        if (!mine) throw new Error('MineState not found');

        const moved = mine.buffer;
        if (moved <= 0) {
            return { moved: 0, shieldUntil: mine.shieldUntil };
        }

        const updated = await this.prisma.mineState.update({
            where: { id: mine.id },
            data: {
                warehouse: mine.warehouse + moved,
                buffer: 0,
                // ВАЖНО: shieldUntil не меняем!
            },
        });
        await this.xp.awardByUserId(user.id, Math.min(10, Math.floor(moved / 100)));
        return { moved, shieldUntil: updated.shieldUntil };
    }
}
