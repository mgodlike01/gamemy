// apps/api/src/modules/upgrades/dto/list-upgrades.dto.ts
// DTO для выдачи списка — чтобы фронту было удобно.

export type UpgradeListItem = {
    id: string;
    code: string;
    title: string;
    description?: string | null;
    priceCoins: number;
    maxLevel: number;
    effectType: string;
    effectValue: number;
    // персональный статус игрока:
    level: number;        // текущий уровень (0 если не покупал)
    canBuy: boolean;      // хватает ли монет сейчас
    nextPrice: number;    // цена за следующий уровень (если у тебя динамическая цена — можно переопределить)
};

export type UpgradeListResponse = {
    upgrades: UpgradeListItem[];
    coins: number; // сколько монет у игрока сейчас (для удобства UI)
};
