import { Queue, JobsOptions } from 'bullmq';

function connection() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const { hostname, port } = new URL(url);
    return { host: hostname, port: Number(port) };
}

export const miningQueue = new Queue('mining', { connection: connection() });
export const energyQueue = new Queue('energy', { connection: connection() });

// В v4 отдельный QueueScheduler не нужен для repeatable jobs
export async function makeScheduler(): Promise<void> {
    return; // no-op
}

export type Repeat = JobsOptions['repeat'];
