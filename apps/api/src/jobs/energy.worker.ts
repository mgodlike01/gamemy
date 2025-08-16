import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function conn() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const { hostname, port } = new URL(url);
    return { host: hostname, port: Number(port) };
}

export function startEnergyWorker() {
    const regenMin = Number(process.env.ENERGY_REGEN_MIN || 30);
    const maxEnergy = Number(process.env.RAID_ENERGY_MAX || 5);

    const worker = new Worker(
        'energy',
        async () => {
            await prisma.$executeRawUnsafe(
                `
        UPDATE "User" AS u
        SET "raidEnergy" = LEAST($1, u."raidEnergy" + 1),
            "raidEnergyUpdatedAt" = NOW()
        WHERE u."raidEnergy" < $1
          AND EXTRACT(EPOCH FROM (NOW() - u."raidEnergyUpdatedAt")) >= ($2 * 60);
      `,
                maxEnergy,
                regenMin
            );
        },
        { connection: conn() }
    );

    worker.on('failed', (_job, err) => {
        console.error('[energy] failed', err?.message || err);
    });

    return worker;
}
