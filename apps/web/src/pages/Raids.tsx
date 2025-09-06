import React, { useEffect, useMemo, useRef, useState } from 'react';
import { raidsApi, type RaidsSummary, type RaidTarget, type RaidLogItem } from '../shared/raidsApi';
import BottomNav from "../components/BottomNav";

/**
 * Страница рейдов:
 * - грузит статус/цели/логи
 * - даёт кнопки действий (История, Ищем жертву, Улучшения)
 * - позволяет атаковать цель
 * - показывает анимацию боя + летящие монетки
 * - обрабатывает кулдаун атак (КД)
 */

export default function RaidsPage() {
    // --- базовые состояния страницы ---
    const [loading, setLoading] = useState(false);       // первичная загрузка
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<RaidsSummary | null>(null);
    const [attackingId, setAttackingId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false); // тихий рефреш после атаки

    // --- подсветка прироста "Мой склад" ---
    const [deltaWarehouse, setDeltaWarehouse] = useState<number | null>(null);
    const deltaTimer = useRef<number | null>(null);

    // --- мини-анимация боя (вспышка карточки + "+N") ---
    const [battleFor, setBattleFor] = useState<string | null>(null);    // tgId цели
    const [battleGain, setBattleGain] = useState<number | null>(null);  // сколько украли

    // --- ЛЕТЯЩИЕ МОНЕТКИ ---
    // куда прилетают (DOM-элемент "Мой склад")
    const myWarehouseRef = useRef<HTMLDivElement | null>(null);
    // откуда стартуют (карточки целей по tgId)
    const targetRefs = useRef<Record<string, HTMLLIElement | null>>({});
    // активные эффекты (может быть несколько подряд)
    const [fxList, setFxList] = useState<Array<{ id: string; startId: string; count: number }>>([]);

    // --- модалки ---
    const [logsOpen, setLogsOpen] = useState(false);       // История боёв
    const [targetsOpen, setTargetsOpen] = useState(false); // Ищем жертву
    const [targetsQuery, setTargetsQuery] = useState('');  // Поиск по имени/тегу

    // --- локальные кулдауны по целям (в секундах) ---
    const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
    useEffect(() => {
        const id = window.setInterval(() => {
            setCooldowns(prev => {
                let changed = false;
                const next: Record<string, number> = {};
                for (const k in prev) {
                    const v = Math.max(0, (prev[k] ?? 0) - 1);
                    next[k] = v;
                    if (v !== prev[k]) changed = true;
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => window.clearInterval(id);
    }, []);

    // ===== Загрузка при монтировании =====
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const s = await raidsApi.summary();
                if (!alive) return;
                setData(s);
            } catch (e: any) {
                const msg = e?.response?.data
                    ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data))
                    : e?.message ?? 'Не удалось загрузить рейды';
                setError(msg);
                setData(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // ===== Читаемая строка энергии =====
    const energyLine = useMemo(() => {
        if (!data) return '';
        const regen = data.energyRegenAt ? ` • восстановление: ${formatTime(data.energyRegenAt)}` : '';
        return `Энергия: ${data.energy}/${data.energyMax}${regen}`;
    }, [data]);

    // ===== ТЕКУЩИЙ СКЛАД =====
    const myWarehouse = data?.myWarehouse ?? 0;

    // ====== RENDER ======
       return (
           <div className="app-page">
            <h2 style={{ margin: '8px 0 12px', fontSize: 20, fontWeight: 800 }}>Рейды</h2>

            {/* Панель действий */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setLogsOpen(true)}>
                    🗂️ История боёв
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setTargetsOpen(true)}>
                    🎯 Ищем жертву
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => alert('Скоро добавим 🙂')}>
                    🛠️ Улучшения
                </button>
            </div>

            {/* Шапка: энергия и мой склад */}
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr', marginBottom: 12 }}>
                <div className="stat-card">
                    <div className="stat-title">Энергия {refreshing ? '(обновляем…)' : ''}</div>
                    <div className="stat-value">{energyLine}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-title">Мой склад</div>
                    <div
                        ref={myWarehouseRef}
                        className={`stat-value ${deltaWarehouse ? 'pulse-green' : ''}`}
                        data-delta={deltaWarehouse ? `+${deltaWarehouse}` : ''}
                    >
                        {myWarehouse}
                    </div>
                </div>
            </div>

            {/* Ошибки/скелет */}
            {loading && <SkeletonList count={3} />}
            {error && <div style={{ color: '#ff6b6b', marginBottom: 8 }}>{error}</div>}

            {/* === Модалки === */}
            {logsOpen && data && (
                <>
                    <div className="modal-backdrop" onClick={() => setLogsOpen(false)} />
                    <div className="modal-card" role="dialog" aria-modal="true" aria-label="История боёв">
                        <div className="modal-head">История боёв</div>
                        <div className="modal-body">
                            {data.logs.length === 0 && <div className="row">Лог пуст.</div>}
                            {data.logs.length > 0 && data.logs.map((log) => (
                                <div key={log.id} className="row" style={{ alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="row-title">{(log as any).targetName ?? (log as any).targetTag ?? '-'}</div>
                                        <div className="row-meta">
                                            {formatTime(log.createdAt)} • {log.amount >= 0 ? `украли ${log.amount}` : `потеряли ${Math.abs(log.amount)}`}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: log.amount >= 0 ? '#35d072' : '#ff6b6b' }}>
                                        {log.amount >= 0 ? 'WIN' : 'LOSE'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-foot">
                            <button className="btn btn-outline btn-sm modal-close" onClick={() => setLogsOpen(false)}>Закрыть</button>
                        </div>
                    </div>
                </>
            )}

            {targetsOpen && data && (
                <>
                    <div className="modal-backdrop" onClick={() => setTargetsOpen(false)} />
                    <div className="modal-card" role="dialog" aria-modal="true" aria-label="Поиск цели">
                        <div className="modal-head">Ищем жертву</div>
                        <div className="modal-body">
                            <div style={{ marginBottom: 10 }}>
                                <input
                                    className="input"
                                    placeholder="Поиск по имени/тегу…"
                                    value={targetsQuery}
                                    onChange={(e) => setTargetsQuery(e.target.value)}
                                />
                            </div>
                            {data.targets
                                .filter(t => {
                                    const q = targetsQuery.trim().toLowerCase();
                                    if (!q) return true;
                                    return (t.tag ?? '').toLowerCase().includes(q) || String(t.tgId ?? '').includes(q);
                                })
                                .map((t, i) => {
                                    const name = t.tag?.trim() || (t.tgId ? `Игрок ${shortId(t.tgId)}` : 'Неизвестный игрок');
                                    const cd = t.tgId ? cooldowns[t.tgId] ?? 0 : 0;
                                    const disabled = !t.tgId || !t.canAttack || (data.energy <= 0) || cd > 0;
                                    return (
                                        <div key={t.tgId || i} className="row">
                                            <div style={{ minWidth: 0 }}>
                                                <div className="row-title" title={String(t.tgId)}>{name}</div>
                                                <div className="row-meta">
                                                    Склад: <b>{t.warehouse ?? t.buffer ?? 0}</b> • Скорость: <b>{t.ratePerHour}/ч</b>
                                                    {t.isShielded && t.shieldUntil ? ` • Щит до ${formatTime(t.shieldUntil)}` : ''}
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                disabled={disabled}
                                                onClick={async () => {
                                                    await onAttack(t);
                                                    setTargetsOpen(false);
                                                }}
                                                title={cd > 0 ? `Кулдаун: ${cd}s` : undefined}
                                            >
                                                {cd > 0 ? `КД ${cd}s` : 'Атаковать'}
                                            </button>
                                        </div>
                                    );
                                })}
                            {data.targets.length === 0 && <div className="row">Нет подходящих целей.</div>}
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={async () => {
                                    try {
                                        setRefreshing(true);
                                        const s = await raidsApi.summary();
                                        setData(s);
                                    } finally {
                                        setRefreshing(false);
                                    }
                                }}
                            >
                                Обновить список
                            </button>
                            <button className="btn btn-outline btn-sm modal-close" onClick={() => setTargetsOpen(false)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* FX-слой: летящие монетки */}
            <div className="fx-layer">
                {fxList.map((fx) => (
                    <CoinFlight
                        key={fx.id}
                        startEl={fx.startId ? targetRefs.current[fx.startId] : null}
                        endEl={myWarehouseRef.current}
                        count={fx.count}
                        onDone={() => setFxList((prev) => prev.filter((x) => x.id !== fx.id))}
                    />
                ))}
               </div>
               <BottomNav />
        </div>
    );


    // ====== ЛОГИКА АТАКИ ======
    async function onAttack(t: RaidTarget) {
        if (!t.tgId) { setError('У цели нет tgId для атаки'); return; }

        try {
            setAttackingId(t.tgId);
            setError(null);

            // 1) шлём атаку
            const res = await raidsApi.attack(t.tgId);

            // 2) сколько украли
            const stolen = Number(res.stolen ?? 0);

            // 3) запускаем полёт монеток (6–12 штук)
            if (stolen > 0 && t.tgId) {
                const count = Math.max(6, Math.min(12, Math.round(stolen / 1000)));
                setFxList((prev) => [...prev, { id: `${t.tgId}-${Date.now()}`, startId: t.tgId!, count }]);
            }

            // 4) вспышка карточки + "+N"
            setBattleFor(t.tgId);
            setBattleGain(stolen);
            if (stolen > 0) flashWarehouseDelta(stolen);
            window.setTimeout(() => {
                setBattleFor(null);
                setBattleGain(null);
            }, 1000);

            // 5) тихий рефреш сводки (энергия/цели/логи/мой склад)
            setRefreshing(true);
            const s = await raidsApi.summary();
            setData(s);
            setRefreshing(false);
        } catch (e: any) {
            const raw =
                e?.response?.data?.message ??
                e?.response?.data?.error ??
                e?.message ??
                String(e);

            // кулдаун — ставим локальный таймер и не запускаем анимации
            if (raw && /cooldown/i.test(raw)) {
                const sec =
                    /(\d+)\s*sec|\b(\d+)\s*s/i.test(raw) ? Number((raw.match(/(\d+)\s*sec|\b(\d+)\s*s/i) || [, '', ''])[1] || (raw.match(/(\d+)\s*sec|\b(\d+)\s*s/i) || [, '', ''])[2]) :
                        /(\d+)\s*min/i.test(raw) ? (Number((raw.match(/(\d+)\s*min/i) || ['', ''])[1]) * 60) :
                            60;

                if (t.tgId) {
                    setCooldowns(prev => ({ ...prev, [t.tgId!]: Math.max(1, sec) }));
                }
                setError(`Кулдаун рейда: попробуйте через ${Math.max(1, sec)} сек.`);
                return;
            }

            setError(typeof raw === 'string' ? raw : 'Ошибка атаки');
        } finally {
            setAttackingId(null);
        }
    }

    // ====== ВСПОМОГАТЕЛЬНЫЕ ======
    function flashWarehouseDelta(amount: number) {
        if (amount <= 0) return;
        setDeltaWarehouse(amount);
        if (deltaTimer.current) window.clearTimeout(deltaTimer.current);
        deltaTimer.current = window.setTimeout(() => {
            setDeltaWarehouse(null);
            deltaTimer.current = null;
        }, 900);
    }
}

// --- утилиты и скелетон ---
function formatTime(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function shortId(id?: string | null) {
    const s = String(id ?? '');
    if (!s) return '????';
    return s.length <= 8 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div style={{ display: 'grid', gap: 8 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skel-item">
                    <div className="skel-bar" style={{ width: '55%' }}></div>
                    <div className="skel-bar" style={{ width: '35%' }}></div>
                    <div className="skel-bar" style={{ width: '70%' }}></div>
                </div>
            ))}
        </div>
    );
}

/** ===== Компонент летящих монеток =====
 * Строит траектории из карточки цели в блок "Мой склад" и анимирует их.
 */
function CoinFlight({
    startEl, endEl, count = 8, onDone,
}: {
    startEl: HTMLElement | null;
    endEl: HTMLElement | null;
    count?: number;
    onDone?: () => void;
}) {
    const layerRef = useRef<HTMLDivElement | null>(null);
    const baseIdRef = useRef(`fx${Math.random().toString(36).slice(2)}`); // уникальный префикс для id
    const [renderCoins, setRenderCoins] = useState<Array<{ id: number; x: number; y: number }>>([]);

    useEffect(() => {
        if (!startEl || !endEl) { onDone?.(); return; }

        // родительский контейнер — ближайший .fx-layer
        const layer = layerRef.current?.parentElement as HTMLElement | null;
        const rectLayer = layer?.getBoundingClientRect();
        const rectStart = startEl.getBoundingClientRect();
        const rectEnd = endEl.getBoundingClientRect();
        if (!rectLayer) { onDone?.(); return; }

        // координаты старта/финиша относительно слоя
        const sx = (rectStart.left + rectStart.width * 0.85) - rectLayer.left;
        const sy = (rectStart.top + rectStart.height * 0.2) - rectLayer.top;
        const ex = (rectEnd.left + rectEnd.width * 0.5) - rectLayer.left;
        const ey = (rectEnd.top + rectEnd.height * 0.5) - rectLayer.top;

        const N = Math.max(1, Math.min(24, count | 0));
        // локальный массив для анимации (НЕ из useState)
        const localCoins = Array.from({ length: N }).map((_, i) => ({
            id: i,
            x0: sx + (Math.random() * 20 - 10),
            y0: sy + (Math.random() * 12 - 6),
            delay: Math.min(0.15, i * 0.02),
            rotSign: i % 2 === 0 ? 1 : -1,
        }));
        // отрисуем «заглушки» для DOM (чтобы появились элементы)
        setRenderCoins(localCoins.map(c => ({ id: c.id, x: c.x0, y: c.y0 })));

        // параметры кривой Безье
        const cx = (sx + ex) / 2 + (Math.random() * 60 - 30);
        const cy = Math.min(sy, ey) - 80 - Math.random() * 40;

        let raf = 0;
        const started = performance.now();
        const D = 820;

        const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const baseId = baseIdRef.current;

        function frame(now: number) {
            const t = Math.min(1, (now - started) / D);

            for (let idx = 0; idx < localCoins.length; idx++) {
                const c = localCoins[idx];
                const tp = Math.max(0, Math.min(1, (t - c.delay) / (1 - c.delay || 1)));
                const tt = easeInOutCubic(tp);

                const x = (1 - tt) * (1 - tt) * c.x0 + 2 * (1 - tt) * tt * cx + tt * tt * ex;
                const y = (1 - tt) * (1 - tt) * c.y0 + 2 * (1 - tt) * tt * cy + tt * tt * ey;

                const node = document.getElementById(`${baseId}-${c.id}`);
                if (node) {
                    const rot = c.rotSign * (15 + idx * 3) * tt;
                    const op = 1 - Math.max(0, tt - 0.8) / 0.2;
                    (node as HTMLElement).style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
                    (node as HTMLElement).style.opacity = `${op}`;
                }
            }

            if (t < 1) {
                raf = requestAnimationFrame(frame);
            } else {
                setTimeout(() => onDone?.(), 80);
            }
        }

        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [startEl, endEl, count, onDone]);

    const baseId = baseIdRef.current;

    return (
        <div ref={layerRef}>
            {renderCoins.map((c) => (
                <span
                    key={c.id}
                    id={`${baseId}-${c.id}`}          // уникальный id
                    className="fx-coin"
                    style={{ transform: `translate3d(${c.x}px, ${c.y}px, 0)` }}
                />
            ))}
        </div>
    );
}
