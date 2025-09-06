// apps/web/shared/upgradesApi.ts
import axios from 'axios';
import { api } from './api';


const BASE = 'https://trimly-upbeat-lungfish.cloudpub.ru';

// -------- Типы ответа с бэка --------
export type UpgradeListItem = {
    id: string;
    title: string;
    icon: string;
    baseCost: number;
    costK: number;
    valuePerLevel: number;
    maxLevel: number;
    level: number;
    value: number;
    nextCost: number;
    canBuy: boolean;
};

export type UpgradeListResponse = {
    upgrades: UpgradeListItem[];
    wallet: { warehouse: number; buffer: number; bufferCap: number; ratePerHour: number };
};

export type BuyResponse = {
    success: boolean;
    typeId: string;
    spent: number;
    newLevel: number;
    newValue: number;
    wallet: { warehouse: number };
};

function getTgId() {
    const tg = (window as any)?.Telegram?.WebApp;
    return String(tg?.initDataUnsafe?.user?.id ?? 'dev-user-id-1');
}

// -------- Новый API (как мы делали выше) --------
export const upgradesApi = {
    async list() {
        const res = await axios.get(`${BASE}/upgrades`, {
            headers: { 'x-telegram-id': getTgId() },
        });
        return res.data; // 👈 возвращаем только полезные данные
    },

    async buy(typeId: string, levels = 1) {
        const res = await axios.post(
            `${BASE}/upgrades/${typeId}/buy`,
            { levels },
            {
                headers: { 'x-telegram-id': getTgId() },
                
            }
        );
        return res.data; // 👈 возвращаем только полезные данные
    },
};

// -------- ШИМ под старые вызовы в коде --------
// Если где-то в коде вызывается fetchUpgrades/buyUpgrade — пусть работают.

export function fetchUpgrades(): Promise<UpgradeListResponse> {
    return upgradesApi.list();
}

export function buyUpgrade(typeId: string, levels = 1): Promise<BuyResponse> {
    return upgradesApi.buy(typeId, levels);
}

// На случай импорта по умолчанию: import U from './upgradesApi'
const defaultExport = {
    fetchUpgrades,
    buyUpgrade,
    list: upgradesApi.list.bind(upgradesApi),
    buy: upgradesApi.buy.bind(upgradesApi),
};

export default defaultExport;
