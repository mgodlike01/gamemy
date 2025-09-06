// apps/api/src/modules/upgrades/upgrades.controller.ts
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { UpgradesService } from './upgrades.service';
import { BuyUpgradeDto } from './dto/buy-upgrade.dto';

function resolveTgId(req: any): string {
    const fromHeader =
        req.headers?.['x-telegram-id'] ||
        req.headers?.['x-telegram-user-id'] ||
        req.headers?.['x-user-id'] ||
        req.headers?.['x-tg-id']; // ← ДОБАВИЛИ алиас, который ставит твой фронт в dev

    const fromQuery = req.query?.tgId || req.query?.userId;
    const fromBody = req.body?.tgId || req.body?.userId;
    const fromReqUser = (req.user && (req.user.tgId || req.user.id)) || (req as any)?.telegramId;

    // дефолт для dev, чтобы не падать 400:
    return String(fromHeader || fromQuery || fromBody || fromReqUser || 'dev-user-id-1').trim();
}

@Controller('upgrades')
export class UpgradesController {
    constructor(private readonly upgrades: UpgradesService) { }

    @Get()
    async list(@Req() req: any) {
        const tgId = resolveTgId(req);
        const user = await this.upgrades.getOrCreateUserByTgId(tgId); // ← используем новый метод
        return this.upgrades.listForUser(user.id);
    }

    @Post(':typeId/buy')
    async buy(@Param('typeId') typeId: string, @Body() body: BuyUpgradeDto, @Req() req: any) {
        const tgId = resolveTgId(req);
        const user = await this.upgrades.getOrCreateUserByTgId(tgId);
        const levels = body.levels ?? 1;
        return this.upgrades.buy(user.id, typeId, levels);
    }
}
