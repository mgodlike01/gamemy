import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class XpService {
    constructor(private prisma: PrismaService) { }

    // Простая кривая уровней: каждые 100 XP — новый уровень (можно усложнить позже)
    levelFromXp(xp: number) {
        return Math.max(1, Math.floor(xp / 100) + 1);
    }

    async awardByUserId(userId: string, delta: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;
        const newXp = Math.max(0, user.xp + delta);
        const newLevel = this.levelFromXp(newXp);
        await this.prisma.user.update({
            where: { id: userId },
            data: { xp: newXp, level: newLevel },
        });
    }
}
