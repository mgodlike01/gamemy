// apps/web/src/shared/raidsApi.ts
import { api as http } from '../shared/api'; // 👈 существующий клиент Home
// ↑ В нём уже выставлен baseURL и заголовок x-telegram-id — используем его!

export type RaidTarget = {
    tgId: string;
    tag: string;
    buffer: number;
    bufferCap: number;
    ratePerHour: number;
    shieldUntil?: string | null;
    isShielded: boolean;
    canAttack: boolean;
    power?: number;
    warehouse?: number;
};

export type RaidLogItem = {
    id: string;
    createdAt: string;
    amount: number;
    isOutbound: boolean;
    attackerTag: string;
    targetTag: string;
    message: string;
};

export type RaidsSummary = {
    energy: number;
    energyMax: number;
    energyRegenAt?: string | null;
    myWarehouse: number;
    targets: RaidTarget[];
    logs: RaidLogItem[];
};

export type AttackResult = {
    stolen?: number;
    energyLeft?: number;
    logId?: string;
    shieldUntil?: string;
    message?: string;
};

export const raidsApi = {
    async summary(): Promise<RaidsSummary> {
        const [st, fnd, lgs] = await Promise.all([
            http.get('/raids/status'),
            http.get('/raids/find', { params: { limit: 5 } }),
            http.get('/raids/logs', { params: { limit: 20 } }),
        ]);

        const status = st.data as {
            energy: number; energyMax: number;
            regenFrom?: string; regenEveryMin?: number; serverNow?: string;
            myWarehouse?: number;
            mineStats?: { buffer: number; bufferCap: number; ratePerHour: number };
        };

        let energyRegenAt: string | null = null;
        try {
            if (status.energy < status.energyMax && status.regenFrom) {
                const from = new Date(status.regenFrom).getTime();
                const next = new Date(from + (status.regenEveryMin ?? 30) * 60_000);
                energyRegenAt = next.toISOString();
            }
        } catch { }

        const find = fnd.data as { targets: any[] };
        const logs = lgs.data as { items: any[] };

        return {
            energy: status.energy,
            energyMax: status.energyMax,
            energyRegenAt,
            myWarehouse: Number(status.myWarehouse ?? 0),                 // 👈 теперь реально с бэка
            targets: (find.targets ?? []).map((t: any) => ({
                tgId: String(t.tgId ?? ''),
                tag: String(t.tag ?? t.tgId ?? 'unknown'),
                buffer: Number(t.buffer ?? 0),
                bufferCap: Number(t.bufferCap ?? 0),
                ratePerHour: Number(t.ratePerHour ?? 0),
                shieldUntil: t.shieldUntil ? String(t.shieldUntil) : null,
                isShielded: !!t.isShielded,
                canAttack: t.canAttack !== undefined ? !!t.canAttack : !t.isShielded,
                power: Number(t.power ?? 0),
                warehouse: Number(t.warehouse ?? t.buffer ?? 0),
            })),
            logs: (logs.items ?? []) as RaidLogItem[],
        };
    },

    async attack(targetTgId: string): Promise<AttackResult> {
        const r = await http.post('/raids', { targetTgId });
        return r.data as AttackResult;
    },
};
