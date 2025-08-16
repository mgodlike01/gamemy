import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { validateInitData } from './auth.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    /** Обмен initData → JWT + upsert пользователя в БД */
    async exchange(initData: string) {
        const botToken = process.env.BOT_TOKEN as string;
        const jwtSecret = process.env.JWT_SECRET as string;

        if (!botToken) throw new UnauthorizedException('BOT_TOKEN missing');
        if (!jwtSecret) throw new UnauthorizedException('JWT_SECRET missing');

        const res = validateInitData(initData, botToken);
        if (!res.ok || !res.data) throw new UnauthorizedException('Invalid initData');

        // user приходит строкой JSON в res.data.user
        let tgId = 'UNKNOWN';
        let username: string | undefined;
        let first_name = '';
        let last_name = '';
        let photo_url: string | undefined;

        if (res.data.user) {
            try {
                const u = JSON.parse(res.data.user);
                tgId = String(u.id);
                username = u.username;
                first_name = (u.first_name || '').trim();
                last_name = (u.last_name || '').trim();
                photo_url = u.photo_url;
            } catch {
                // если вдруг не распарсилось — дальше упадём на tgId === 'UNKNOWN'
            }
        } else if (res.data.telegram_user_id) {
            tgId = String(res.data.telegram_user_id);
        }

        if (!tgId || tgId === 'UNKNOWN') {
            throw new UnauthorizedException('Telegram user not found in initData');
        }

        const displayName =
            (first_name || last_name)
                ? `${first_name}${last_name ? ' ' + last_name : ''}`.trim()
                : (username ?? null);

        // upsert в БД: создаём/обновляем профиль
        const user = await this.prisma.user.upsert({
            where: { tgId },
            create: {
                tgId,
                username: username ?? null,
                displayName: displayName ?? null,
                photoUrl: photo_url ?? null,
            },
            update: {
                ...(username ? { username } : {}),
                ...(displayName ? { displayName } : {}),
                ...(photo_url ? { photoUrl: photo_url } : {}),
            },
        });

        // JWT: кладём и sub (id из БД), и tgId
        const token = jwt.sign({ sub: user.id, tgId: user.tgId }, jwtSecret, { expiresIn: '7d' });

        return { token, user };
    }

    /** dev-режим: получить токен без Telegram (в проде выключено) */
    devToken(tgId: string) {
        if (process.env.NODE_ENV === 'production') {
            throw new UnauthorizedException('Dev token disabled');
        }
        const jwtSecret = process.env.JWT_SECRET as string;
        const token = jwt.sign({ tgId }, jwtSecret, { expiresIn: '7d' });
        return { token };
    }

    /** Получить пользователя по tgId (для /auth/whoami) */
    getUserByTgId(tgId: string) {
        return this.prisma.user.findUnique({ where: { tgId } });
    }
}
