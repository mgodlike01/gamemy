import { Module } from '@nestjs/common';
import { RaidsService } from './raids.service';
import { RaidsController } from './raids.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileModule } from '../profile/profile.module'; // ←

@Module({
    imports: [ProfileModule],          // ← чтобы получить XpService
    controllers: [RaidsController],
    providers: [RaidsService, PrismaService],
})
export class RaidsModule { }
