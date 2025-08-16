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

    // dev: получить токен без Telegram (дл€ локальных тестов фронта)
    @Get('dev')
    dev(@Query('tgId') tgId = 'DEV_USER') {
        return this.auth.devToken(tgId);
    }

    // вернуть текущего пользовател€ (по JWT/заголовкам) Ч теперь тащит профиль из Ѕƒ
    @Get('whoami')
    async whoami(@Req() req: FastifyRequest) {
        const auth = String(req.headers['authorization'] || '');
        const hasBearer = auth.startsWith('Bearer ');
        const tgId = getTgIdFromRequest(req);
        const from = hasBearer ? 'jwt' : (req.headers['x-tg-id'] ? 'header' : 'none');

        if (!tgId) return { from, user: null };

        const user = await this.auth.getUserByTgId(tgId);
        return { from, user };
    }
}
