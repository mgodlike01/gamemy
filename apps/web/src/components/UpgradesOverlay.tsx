import React, { useEffect, useMemo, useRef, useState } from 'react';
import { upgradesApi } from '../shared/upgradesApi';
import type { UpgradeListItem, UpgradeListResponse } from '../shared/upgradesApi';

type Props = { open: boolean; onClose: () => void };

// длительность анимации (должна совпадать с CSS .18s)
const EXIT_MS = 180;

export default function UpgradesOverlay({ open, onClose }: Props) {
    // --- управление монтированием для exit-анимации ---
    const [visible, setVisible] = useState(open);      // смонтирован ли компонент
    const [closing, setClosing] = useState(false);     // идёт ли анимация закрытия

    // --- состояние данных ---
    const [initialLoading, setInitialLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [upgrades, setUpgrades] = useState<UpgradeListItem[] | null>(null);
    const [wallet, setWallet] = useState<UpgradeListResponse['wallet'] | null>(null);
    const [buyingId, setBuyingId] = useState<string | null>(null);

    // --- подсветка прироста (храним «дельты» на короткое время) ---
    const [deltaRate, setDeltaRate] = useState<number | null>(null);
    const [deltaCap, setDeltaCap] = useState<number | null>(null);
    const deltasTimer = useRef<number | null>(null);
    const prevWallet = useRef<UpgradeListResponse['wallet'] | null>(null);

    // монтирование/размонтирование с анимацией
    useEffect(() => {
        if (open) {
            setVisible(true);
            setClosing(false);
        } else if (visible) {
            // запускаем exit-анимацию, потом размонтируем
            setClosing(true);
            const t = window.setTimeout(() => {
                setVisible(false);
                setClosing(false);
            }, EXIT_MS);
            return () => window.clearTimeout(t);
        }
    }, [open]);

    // загрузка данных при открытии
    useEffect(() => {
        if (!visible || closing) return;
        let alive = true;

        (async () => {
            try {
                setInitialLoading(true);
                setError(null);
                const data = await upgradesApi.list();
                if (!alive) return;
                setUpgrades(data?.upgrades ?? []);
                setWallet(data?.wallet ?? null);
                prevWallet.current = data?.wallet ?? null; // запоминаем базу для дельт
            } catch (e: any) {
                if (!alive) return;
                const msg = e?.response?.data
                    ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data))
                    : e?.message ?? 'Не удалось загрузить улучшения';
                setError(msg);
                setUpgrades([]); // не null, чтобы не падать
            } finally {
                if (alive) setInitialLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [visible, closing]);

    // запрет прокрутки фона
    useEffect(() => {
        if (!visible) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [visible]);

    // строка статов
    const walletLine = useMemo(() => {
        if (!wallet) return '';
        return `Склад: ${wallet.warehouse}  •  Буфер: ${wallet.buffer}/${wallet.bufferCap}  •  Скорость: ${wallet.ratePerHour}/ч`;
    }, [wallet]);

    if (!visible) return null;

    function effectUnit(u: UpgradeListItem) {
        // для «скорости»/«силы» показываем проценты, для «склада» — число
        const id = (u.id || '').toLowerCase();
        if (id.includes('speed') || id.includes('power')) return '%';
        if (id.includes('capacity')) return '';
        if (id.includes('luck')) return '%';
        // fallback по названию
        const t = (u.title || '').toLowerCase();
        if (/скорост|сила|speed|power/.test(t)) return '%';
        if (/склад|буфер|capacity/.test(t)) return '';
        if (/удач|luck/.test(t)) return '%';
        return '';
    }

    function computeProgress(u: UpgradeListItem) {
        if (u.maxLevel && u.maxLevel > 0) {
            const pct = Math.max(0, Math.min(1, u.level / u.maxLevel));
            return Math.round(pct * 100);
        }
        // бесконечные уровни: нарисуем косметические 10% + 2% за уровень (до 100%)
        const pct = Math.max(0.1, Math.min(1, 0.1 + 0.02 * u.level));
        return Math.round(pct * 100);
    }


    function renderEffect(u: UpgradeListItem) {
        const id = (u.id || '').toLowerCase();
        const perLvl = u.valuePerLevel;

        if (id.includes('capacity')) return `+${perLvl} к буферу`;
        if (id.includes('speed') || id.includes('power')) return `+${Math.round(perLvl * 100)}% к скорости`;
        if (id.includes('luck')) return `+${Math.round(perLvl * 100)}% удачи`;

        // fallback по названию
        const t = (u.title || '').toLowerCase();
        if (/склад|буфер|capacity/.test(t)) return `+${perLvl} к буферу`;
        if (/скорост|сила|speed|power/.test(t)) return `+${Math.round(perLvl * 100)}% к скорости`;
        if (/удач|luck/.test(t)) return `+${Math.round(perLvl * 100)}% удачи`;

        return `+${perLvl}${effectUnit(u)}`;
    }


    return (
        <div
            className={`upg-backdrop ${closing ? 'upg-backdrop--closing' : ''}`}
            onClick={() => safeClose()}
        >
            <div
                className={`upg-modal ${closing ? 'upg-modal--closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className="upg-header">
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Улучшения</div>
                    <button onClick={() => safeClose()}>Закрыть</button>
                </div>

                {/* Контент */}
                <div className="upg-body">
                    {/* Строка статов со вспышками дельт */}
                    {wallet && (
                        <div style={{ marginBottom: 10, opacity: 0.95, fontSize: 13 }}>
                            Склад: {wallet.warehouse}
                            {'  •  '}
                            <span className={deltaCap ? 'pulse-green' : ''} data-delta={deltaCap ? `+${deltaCap}` : ''}>
                                Буфер: {wallet.buffer}/{wallet.bufferCap}
                            </span>
                            {'  •  '}
                            <span className={deltaRate ? 'pulse-green' : ''} data-delta={deltaRate ? `+${deltaRate}` : ''}>
                                Скорость: {wallet.ratePerHour}/ч
                            </span>
                            {refreshing && <span style={{ marginLeft: 8, opacity: .7 }}>(обновляем…)</span>}
                        </div>
                    )}

                    {error && <div style={{ color: '#ff6b6b', marginBottom: 8 }}>{error}</div>}

                    {/* skeleton при первом открытии */}
                    {initialLoading && (
                        <div className="skel-list">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skel-item">
                                    <div className="skel-bar" style={{ width: '55%' }}></div>
                                    <div className="skel-bar" style={{ width: '35%' }}></div>
                                    <div className="skel-bar" style={{ width: '70%' }}></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* пусто */}
                    {!initialLoading && (upgrades ?? []).length === 0 && (
                        <div style={{ opacity: 0.8 }}>Пока нет доступных улучшений.</div>
                    )}

                    {/* список */}
                    {!initialLoading && (upgrades ?? []).length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
                            {(upgrades ?? []).map((u) => {
                                const disabled = !!buyingId; // во время покупки блокируем кнопки
                                const buyingThis = buyingId === u.id;
                                return (
                                    <li key={u.id} className="upg-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                                            {/* слева: иконка + название */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                {u.icon?.startsWith('/') ? (
                                                    <img src={u.icon} alt="" style={{ width: 22, height: 22 }} />
                                                ) : (
                                                    <span style={{ fontSize: 18 }}>{u.icon}</span>
                                                )}
                                                <div style={{ display: 'grid' }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{u.title}</div>
                                                    <div style={{ fontSize: 12, opacity: .8, lineHeight: 1.1 }}>
                                                        Уровень: <b>{u.level}</b>{u.maxLevel > 0 ? ` / ${u.maxLevel}` : ''} • Цена: <span className="upg-price">{u.nextCost}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* справа: эффект от апгрейда */}
                                            <div className="upg-effect">
                                                {renderEffect(u)}
                                            </div>
                                        </div>

                                        {/* прогресс уровня */}
                                        <div style={{ marginTop: 8 }}>
                                            <div className="upg-progress">
                                                <div className="upg-progress__bar" style={{ width: `${computeProgress(u)}%` }} />
                                            </div>
                                        </div>

                                        {/* нижняя строка: значение + кнопки */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: 12, opacity: .9 }}>
                                                Значение: <b>{u.value.toFixed(2)}</b> (+{u.valuePerLevel}{effectUnit(u)} за уровень)
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    disabled={!!buyingId || !u.canBuy}
                                                    onClick={() => handleBuy(u.id, 1)}
                                                >
                                                    <span className="ico">🛒</span>
                                                    {buyingId === u.id ? 'Покупаем…' : 'Купить 1'}
                                                </button>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    disabled={!!buyingId}
                                                    onClick={() => handleBuy(u.id, 5)}
                                                >
                                                    <span className="ico">⏫</span>
                                                    +5
                                                </button>
                                            </div>
                                        </div>
                                    </li>

                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );

    // ——— helpers ———

    function safeClose() {
        // запускаем exit-анимацию, а onClose вызовем по завершению
        setClosing(true);
        window.setTimeout(() => {
            setClosing(false);
            setVisible(false);
            onClose();
        }, EXIT_MS);
    }

    async function handleBuy(typeId: string, levels: number) {
        try {
            setBuyingId(typeId);
            setError(null);

            // 1) POST покупка
            const resp = await upgradesApi.buy(typeId, levels);

            // 2) оптимистично уменьшим склад
            setWallet((w) => (w ? { ...w, warehouse: resp.wallet.warehouse } : w));

            // 3) тихий рефетч и вычисление дельт
            setRefreshing(true);
            const fresh = await upgradesApi.list();
            // вычислим дельты от прошлого wallets
            const prev = prevWallet.current;
            const next = fresh?.wallet ?? null;

            if (prev && next) {
                const dRate = Math.max(0, (next.ratePerHour ?? 0) - (prev.ratePerHour ?? 0));
                const dCap = Math.max(0, (next.bufferCap ?? 0) - (prev.bufferCap ?? 0));
                flashDeltas(dRate, dCap);
            }
            prevWallet.current = next;

            setUpgrades(fresh?.upgrades ?? []);
            setWallet(next);
            setRefreshing(false);
        } catch (e: any) {
            const msg = e?.response?.data
                ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data))
                : e?.message ?? 'Не удалось купить улучшение';
            setError(msg);
        } finally {
            setBuyingId(null);
        }
    }

    function flashDeltas(dRate: number, dCap: number) {
        // покажем +дельты в шапке на ~0.8с (как в CSS анимации)
        if (dRate > 0) setDeltaRate(dRate);
        if (dCap > 0) setDeltaCap(dCap);

        if (deltasTimer.current) window.clearTimeout(deltasTimer.current);
        deltasTimer.current = window.setTimeout(() => {
            setDeltaRate(null);
            setDeltaCap(null);
            deltasTimer.current = null;
        }, 820);
    }
}
