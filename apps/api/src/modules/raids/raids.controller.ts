import { BadRequestException, Body, Controller, Get, Post, Req, Query } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RaidsService } from './raids.service';
import { getTgIdFromRequest } from '../common/getTgId';

@Controller('raids')
export class RaidsController {
    constructor(private readonly raids: RaidsService) { }

    @Get('status')
    async status(@Req() req: FastifyRequest) {
        const tgId = getTgIdFromRequest(req);
        return this.raids.getStatus(tgId);
    }

    @Get('find')
    async find(@Req() req: FastifyRequest, @Query('limit') limit = '5') {
        const tgId = getTgIdFromRequest(req);
        const n = Math.max(1, Math.min(50, Number(limit) || 5));
        const targets = await this.raids.findTargetsFor(tgId, n); // ← правильное имя
        return { targets };
    }

    @Post()
    async attack(@Req() req: FastifyRequest, @Body() body: { targetTgId: string }) {
        const attacker = getTgIdFromRequest(req);
        if (!body?.targetTgId) throw new BadRequestException('targetTgId is required');
        return this.raids.attack(attacker, body.targetTgId);
    }

    @Get('logs')
    async logs(@Req() req: FastifyRequest, @Query('limit') limit = '20') {
        const tgId = getTgIdFromRequest(req);
        const n = Math.max(1, Math.min(50, Number(limit) || 20));
        const items = await this.raids.getLogsForUser(tgId, n); // ← правильное имя
        return { items };
    }
}
