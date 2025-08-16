import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from './xp.service';

@Module({
    controllers: [ProfileController],
    providers: [PrismaService, XpService],
    exports: [XpService],              // ← чтобы другие модули могли инжектить
})
export class ProfileModule { }
