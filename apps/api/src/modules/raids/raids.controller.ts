import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RaidsService } from './raids.service';
import { getTgIdFromRequest } from '../common/getTgId';

@Controller('raids')
export class RaidsController {
  constructor(private raids: RaidsService) {}

  @Get('status')
  async status(@Req() req: FastifyRequest) {
    const me = await this.raids.getOrCreateUser(getTgIdFromRequest(req));
    const regenEveryMin = Number(process.env.RAID_ENERGY_REGEN_MIN || 30);
    return {
      energy: me.raidEnergy,
      regenFrom: me.raidEnergyUpdatedAt, // когда последний раз начисляли
      regenEveryMin,
      serverNow: new Date(),
      energyMax: Number(process.env.RAID_ENERGY_MAX || 5),
    };
  }

  @Get('find')
  async find(@Req() req: FastifyRequest, @Query('limit') limit = '5') {
    const tgId = getTgIdFromRequest(req);
    const n = Math.max(1, Math.min(10, Number(limit) || 5));
    const targets = await this.raids.findTargetsFor(tgId, n);
    return { targets };
  }

  @Post()
  async raid(
    @Req() req: FastifyRequest,
    @Body() body: { targetTgId?: string },
  ) {
    const attacker = getTgIdFromRequest(req);
    if (!body?.targetTgId)
      throw new BadRequestException('targetTgId is required');
    return this.raids.attack(attacker, body.targetTgId);
  }

    @Get('logs')
    async logs(@Req() req: FastifyRequest, @Query('limit') limit = '20') {
        const tgId = getTgIdFromRequest(req);
        const n = Math.max(1, Math.min(50, Number(limit) || 20));
        const items = await this.raids.getLogsForUser(tgId, n);
        return { items };
    }
}
