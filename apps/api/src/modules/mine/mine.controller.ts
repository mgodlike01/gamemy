import { Controller, Get, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { MineService } from './mine.service';
import { getTgIdFromRequest } from '../common/getTgId';

@Controller('mine')
export class MineController {
    constructor(private mine: MineService) { }

    @Get()
    getMine(@Req() req: FastifyRequest) {
        return this.mine.getMine(getTgIdFromRequest(req));
    }

    @Post('claim')
    claim(@Req() req: FastifyRequest) {
        return this.mine.claim(getTgIdFromRequest(req));
    }
}