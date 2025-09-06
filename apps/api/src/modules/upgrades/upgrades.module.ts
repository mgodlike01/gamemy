// apps/api/src/modules/upgrades/upgrades.module.ts
// Описываем модуль NestJS

import { Module } from '@nestjs/common';
import { UpgradesService } from './upgrades.service';
import { UpgradesController } from './upgrades.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UpgradesController],
    providers: [UpgradesService],
    exports: [UpgradesService],
})
export class UpgradesModule { }
