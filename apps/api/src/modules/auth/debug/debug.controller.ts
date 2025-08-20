// apps/api/src/modules/debug/debug.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

@Controller('debug')
export class DebugController {
    @Get('echo')
    echo(@Req() req: FastifyRequest) {
        return {
            headers: req.headers,
            hasInitData: !!req.headers['x-telegram-init-data'],
            initDataLen: (req.headers['x-telegram-init-data'] as string | '')?.length || 0,
        };
    }
}
