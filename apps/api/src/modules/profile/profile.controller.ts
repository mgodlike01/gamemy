// apps/api/src/modules/profile/profile.controller.ts
import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import { getTgIdFromRequest } from '../common/getTgId';
import { AVATARS, isValidAvatar } from './avatars';
import { GENDERS, isValidGender } from './genders';

const GENDER_SWITCH_COST = Number(process.env.GENDER_SWITCH_COST ?? 1000);

@Controller('profile')
export class ProfileController {
    constructor(private prisma: PrismaService) { }

    /** Гарантируем, что есть User и Hero */
    private async ensureUserAndHero(tgId: string) {
        let user = await this.prisma.user.findUnique({ where: { tgId } });
        if (!user) user = await this.prisma.user.create({ data: { tgId } });

        let hero = await this.prisma.hero.findUnique({ where: { userId: user.id } });
        if (!hero) hero = await this.prisma.hero.create({ data: { userId: user.id } });

        return { user, hero };
    }

    /** Профиль текущего игрока */
    @Get('me')
    async me(@Req() req: FastifyRequest) {
        const tgId = getTgIdFromRequest(req);
        const { user, hero } = await this.ensureUserAndHero(tgId);

        return {
            tgId: user.tgId,
            username: user.username ?? null,
            displayName: user.displayName ?? null,
            avatarKey: hero.avatarKey ?? user.avatarKey ?? null,
            xp: hero.xp ?? 0,
            level: hero.level ?? 1,
            gender: hero.gender ?? null, // 'male' | 'female' | null
        };
    }

    /** Справочник аватаров (плоский список) */
    @Get('avatars')
    listAvatars() {
        return { items: AVATARS };
    }

    /** Установка/смена ника */
    @Post('nickname')
    async setNick(@Req() req: FastifyRequest, @Body() body: { displayName?: string }) {
        const tgId = getTgIdFromRequest(req);
        const raw = (body?.displayName || '').trim();
        if (!/^[A-Za-zА-Яа-яЁё0-9_]{3,16}$/.test(raw)) {
            throw new BadRequestException('Ник: 3–16 символов, буквы/цифры/_.');
        }
        const { user } = await this.ensureUserAndHero(tgId);
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: { displayName: raw },
            select: { tgId: true, displayName: true },
        });
        return { ok: true, ...updated };
    }

    /** Установка аватарки (из списка) */
    @Post('avatar')
    async setAvatar(@Req() req: FastifyRequest, @Body() body: { avatarKey?: string }) {
        const tgId = getTgIdFromRequest(req);
        const key = (body?.avatarKey || '').trim();
        if (!isValidAvatar(key)) throw new BadRequestException('Некорректная аватарка');

        const { user } = await this.ensureUserAndHero(tgId);
        await this.prisma.hero.update({
            where: { userId: user.id },
            data: { avatarKey: key },
        });
        return { ok: true, avatarKey: key };
    }

    /** Справочник полов (male/female) + стоимость смены */
    @Get('genders')
    listGenders() {
        return { items: GENDERS, switchCost: GENDER_SWITCH_COST };
    }

    /** Первый выбор пола (бесплатно, если ещё не выбран) */
    @Post('gender/choose')
    async chooseGender(@Req() req: FastifyRequest, @Body() body: { gender?: string }) {
        const tgId = getTgIdFromRequest(req);
        const key = (body?.gender || '').trim();
        if (!isValidGender(key)) throw new BadRequestException('Некорректный пол персонажа');

        const { user, hero } = await this.ensureUserAndHero(tgId);
        if (hero.gender) throw new BadRequestException('Пол уже выбран. Используйте платную смену.');

        await this.prisma.hero.update({
            where: { userId: user.id },
            data: { gender: key, genderSelectedAt: new Date() },
        });
        return { ok: true, gender: key };
    }

    /** Платная смена пола — списываем из склада (mineState.warehouse) */
    @Post('gender/switch')
    async switchGender(@Req() req: FastifyRequest, @Body() body: { gender?: string }) {
        const tgId = getTgIdFromRequest(req);
        const key = (body?.gender || '').trim();
        if (!isValidGender(key)) throw new BadRequestException('Некорректный пол персонажа');

        const { user, hero } = await this.ensureUserAndHero(tgId);
        if (hero.gender === key) throw new BadRequestException('Этот пол уже выбран.');

        const mine = await this.prisma.mineState.findUnique({ where: { userId: user.id } });
        if (!mine) throw new BadRequestException('Нет склада');
        if (mine.warehouse < GENDER_SWITCH_COST) throw new BadRequestException('Недостаточно средств');

        await this.prisma.$transaction([
            this.prisma.mineState.update({
                where: { id: mine.id },
                data: { warehouse: mine.warehouse - GENDER_SWITCH_COST },
            }),
            this.prisma.hero.update({
                where: { userId: user.id },
                data: { gender: key, genderSelectedAt: new Date() },
            }),
        ]);

        return { ok: true, gender: key, newBalance: mine.warehouse - GENDER_SWITCH_COST };
    }
}
