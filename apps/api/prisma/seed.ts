// prisma/seed.ts
// Наполняет базу начальными данными для апгрейдов и тестового пользователя.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // ← dev-пользователь для локальной проверки
    const tgId = 'dev-user-id-1';

    // 1) Пользователь: только tgId (без coins/gems — их нет в схеме)
    const user = await prisma.user.upsert({
        where: { tgId },
        create: {
            tgId,
            username: 'dev',
            displayName: 'Dev User',
        },
        update: {},
    });

    // 2) Шахта для пользователя: сюда положим "кошелёк" (warehouse)
    await prisma.mineState.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            ratePerHour: 100,   // базовая скорость
            buffer: 0,
            bufferCap: 1000,
            warehouse: 6123,    // стартовые ресурсы для теста покупок
        },
        update: {
            warehouse: 6123,    // обновим, если запись есть
        },
    });

    // 3) Каталог типов апгрейдов (UpgradeType)
    // id — твой ключ. maxLevel=0 означает "без лимита".
    const types = [
        {
            id: 'RATE',
            title: 'Скорость добычи',
            icon: '⚒️',
            baseCost: 100,
            costK: 1.35,
            valuePerLevel: 0.02, // +2% за уровень
            maxLevel: 0,
        },
        {
            id: 'BUFFER',
            title: 'Ёмкость буфера',
            icon: '📦',
            baseCost: 150,
            costK: 1.35,
            valuePerLevel: 10,   // +10 ед. за уровень
            maxLevel: 0,
        },
        {
            id: 'ENERGY',
            title: 'Реген энергии',
            icon: '⚡',
            baseCost: 120,
            costK: 1.35,
            valuePerLevel: 0.05, // +5% за уровень
            maxLevel: 0,
        },
    ] as const;

    for (const t of types) {
        await prisma.upgradeType.upsert({
            where: { id: t.id },
            create: t,
            update: t,
        });
    }

    console.log('✅ Seed done');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
