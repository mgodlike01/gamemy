import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MineModule } from './modules/mine/mine.module';
import { RaidsModule } from './modules/raids/raids.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UpgradesModule } from './modules/upgrades/upgrades.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        MineModule,
        RaidsModule,
        AuthModule,
        JobsModule,
        ProfileModule,
        UpgradesModule,
    ],
})
export class AppModule { }
