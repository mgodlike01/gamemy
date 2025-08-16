import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { energyQueue, makeScheduler, miningQueue } from './bullmq';
import { startMiningWorker } from './mining.worker';
import { startEnergyWorker } from './energy.worker';

@Module({})
export class JobsModule implements OnModuleInit, OnModuleDestroy {
    private miningW?: ReturnType<typeof startMiningWorker>;
    private energyW?: ReturnType<typeof startEnergyWorker>;

    async onModuleInit() {
        await makeScheduler();

        // repeatable jobs в v4 работают без QueueScheduler
        await miningQueue.add('tick', {}, { repeat: { every: 15_000 }, removeOnComplete: true, removeOnFail: true });
        await energyQueue.add('tick', {}, { repeat: { every: 60_000 }, removeOnComplete: true, removeOnFail: true });

        this.miningW = startMiningWorker();
        this.energyW = startEnergyWorker();

        console.log('[jobs] mining:15s, energy:60s started');
    }

    async onModuleDestroy() {
        await this.miningW?.close();
        await this.energyW?.close();
    }
}
