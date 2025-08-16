import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "./api";

export type MineState = {
    ratePerHour: number;
    buffer: number;
    bufferCap: number;
    warehouse: number;
    shieldUntil?: string | null;
};

export function useMine(pollMs = 10000) {
    const [mine, setMine] = useState<MineState | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const alive = useRef(true);

    /** Загружает текущее состояние шахты */
    const load = useCallback(async () => {
        try {
            const res = await api.get<MineState>("/mine");
            if (alive.current) setMine(res.data);
        } finally {
            if (alive.current) setLoading(false);
        }
    }, []);

    /** Забрать буфер → если API не возвращает состояние, перезагрузим его */
    const claim = useCallback(async () => {
        if (claiming) return;
        setClaiming(true);
        try {
            const res = await api.post("/mine/claim", {});
            if (!alive.current) return;

            const maybe = res?.data as any;
            if (maybe && typeof maybe === "object" && "buffer" in maybe) {
                setMine(maybe as MineState);
            } else {
                await load(); // если ответ пустой — подтягиваем свежие данные
            }
        } finally {
            if (alive.current) setClaiming(false);
        }
    }, [claiming, load]);

    useEffect(() => {
        alive.current = true;
        load();
        const t = setInterval(load, pollMs);
        return () => {
            alive.current = false;
            clearInterval(t);
        };
    }, [load, pollMs]);

    return { mine, loading, claim, claiming, reload: load };
}
