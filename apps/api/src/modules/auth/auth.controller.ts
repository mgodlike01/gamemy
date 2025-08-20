import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { FastifyRequest } from 'fastify';
import { getTgIdFromRequest } from '../common/getTgId';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('telegram')
    telegram(@Body() body: { initData: string }) {
        return this.auth.exchange(body.initData);
    }

    // dev: получить токен без Telegram (для локальных тестов фронта)
    @Get('dev')
    dev(@Query('tgId') tgId = 'DEV_USER') {
        return this.auth.devToken(tgId);
    }

    // вернуть текущего пользователя (по JWT/заголовкам)
    @Get('whoami')
    async whoami(@Req() req: FastifyRequest) {
        const auth = String(req.headers['authorization'] || '');
        const from = auth.startsWith('Bearer ')
            ? 'jwt'
            : (req.headers['x-tg-id'] ? 'header' : 'none');

        const tgId = getTgIdFromRequest(req);
        if (!tgId) return { from, user: null };

        // Теперь гарантируем, что запись в БД есть
        const user = await this.auth.ensureUserByTgId(tgId);
        return { from, user };
    }
}
