import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function conn() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const { hostname, port } = new URL(url);
    return { host: hostname, port: Number(port) };
}

export function startMiningWorker() {
    const worker = new Worker(
        'mining',
        async () => {
            // ƒобавл€ем в buffer прирост с момента updatedAt и двигаем updatedAt = NOW()
            await prisma.$executeRawUnsafe(`
        UPDATE "MineState" AS m
        SET
          buffer = LEAST(
            m."bufferCap",
            m.buffer + GREATEST(
              0,
              FLOOR((m."ratePerHour" / 3600.0) * EXTRACT(EPOCH FROM (NOW() - m."updatedAt")))
            )::int
          ),
          "updatedAt" = NOW()
        WHERE m.buffer < m."bufferCap";
      `);
        },
        { connection: conn() }
    );

    // v4: 'failed' => (job, err)
    worker.on('failed', (_job, err) => {
        console.error('[mining] failed', err?.message || err);
    });

    return worker;
}
