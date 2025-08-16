import { Module } from '@nestjs/common';
import { MineService } from './mine.service';
import { MineController } from './mine.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileModule } from '../profile/profile.module'; // ←

@Module({
    imports: [ProfileModule],          // ← чтобы получить XpService
    controllers: [MineController],
    providers: [MineService, PrismaService],
})
export class MineModule { }
