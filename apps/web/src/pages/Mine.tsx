// apps/web/src/pages/Mine.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DungeonScene } from "../components/DungeonScene";
import { IconTile } from "../components/IconTile";
import GenderSelectModal from "../components/GenderSelectModal";
import HeroHeader from "../components/HeroHeader";
import { SafeStage } from "../shared/SafeStage";

import { useProfile } from "../shared/useProfile";
import { useMine } from "../shared/useMine";
import { api, logout } from "../shared/api";

import UpgradesOverlay from "../components/UpgradesOverlay";
import * as U from "../shared/upgradesApi";

/** безопасный отступ под шапку Telegram + вырезы */
function useTelegramSafeTop() {
    const [safeTop, setSafeTop] = React.useState(64);

    React.useEffect(() => {
        const tg: any = (window as any).Telegram?.WebApp;

        const readPx = (varName: string) => {
            const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            const n = parseFloat(raw || "0");
            return Number.isFinite(n) ? n : 0;
        };

        const recalc = () => {
            const notch = readPx("--sat"); // см. index.css: --sat: env(safe-area-inset-top);
            const isExpanded = !!tg?.isExpanded;
            const HEADER_NOT_EXPANDED = 92;
            const PADDING_EXPANDED = 16;
            const MIN_TOP = 36;

            const top = isExpanded ? notch + PADDING_EXPANDED : notch + HEADER_NOT_EXPANDED;
            setSafeTop(Math.max(MIN_TOP, Math.round(top)));
        };

        recalc();
        tg?.onEvent?.("viewportChanged", recalc);
        tg?.onEvent?.("themeChanged", recalc);
        window.addEventListener("resize", recalc);

        return () => {
            tg?.offEvent?.("viewportChanged", recalc);
            tg?.offEvent?.("themeChanged", recalc);
            window.removeEventListener("resize", recalc);
        };
    }, []);

    return safeTop;
}

export default function Mine() {
    const nav = useNavigate();
    const safeTopPx = useTelegramSafeTop();

    // профиль
    const { profile, reload, loading } = useProfile();
    const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user as
        | { id?: number; username?: string; first_name?: string; last_name?: string; photo_url?: string }
        | undefined;

    // стейты ресурсов/энергии
    const [energy, setEnergy] = useState(0);
    const [energyMax, setEnergyMax] = useState(5);
    const [coins, setCoins] = useState(0);
    const [gems] = useState(0);
    const [claimFlashTop, setClaimFlashTop] = useState<number | null>(null); // +N бейдж вверху
    const [claimGlow, setClaimGlow] = useState(false);                      // зелёная подсветка монет вверху




    // шахта
    const { mine, claim, claiming } = useMine(2000);

    // апгрейды (моки — можно заменить реальным API)
    const [upOpen, setUpOpen] = useState(false);


    // загрузка данных для HUD
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [r1, r2] = await Promise.allSettled([api.get("/raids/status"), api.get("/mine")]);
                if (!alive) return;

                if (r1.status === "fulfilled") {
                    const d: any = r1.value.data;
                    setEnergy(d.energy ?? 0);
                    setEnergyMax(d.energyMax ?? 5);
                }
                if (r2.status === "fulfilled") {
                    const m: any = r2.value.data;
                    setCoins(m?.warehouse ?? 0);
                }
            } catch { }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // монеты обновляем из хука шахты (буфер/склад)
    useEffect(() => {
        if (mine?.warehouse !== undefined && mine?.warehouse !== null) {
            setCoins(mine.warehouse);
        }
    }, [mine?.warehouse]);

    // имя/аватар для шапки
    const pickFirstString = (arr: any[]) => {
        for (const v of arr) {
            if (typeof v === "string") {
                const s = v.trim();
                if (s) return s;
            }
        }
        return undefined;
    };
    const name =
        pickFirstString([
            profile?.displayName,
            profile?.username,
            [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
            (profile as any)?.user?.displayName,
            (profile as any)?.user?.username,
            [(profile as any)?.user?.firstName, (profile as any)?.user?.lastName].filter(Boolean).join(" "),
            tgUser && [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
            tgUser?.username,
        ]) || "Герой";
    const avatarUrl =
        pickFirstString([
            profile?.photoUrl,
            (profile as any)?.user?.photoUrl,
            (profile as any)?.user?.avatarUrl,
            tgUser?.photo_url,
            profile?.avatarKey ? `/avatars/${profile.avatarKey}.png` : "",
        ]) || "/avatars/placeholder.png";

    // модалка выбора пола (оставляем, если нужно в онбординге)
    const gender = useMemo(() => profile?.gender ?? (profile as any)?.hero?.gender ?? null, [profile]);
    const [needGenderModal, setNeedGenderModal] = useState(false);
    useEffect(() => {
        const dismissed = localStorage.getItem("genderModalDismissed") === "1";
        if (loading || !profile) return;
        if (gender) {
            setNeedGenderModal(false);
            if (!dismissed) localStorage.setItem("genderModalDismissed", "1");
            return;
        }
        setNeedGenderModal(!dismissed);
    }, [loading, profile, gender]);

    // размеры сцены под SafeStage
    const BASE_W = 490;
    const BASE_H = 1050;

    return (
        <SafeStage baseWidth={BASE_W} baseHeight={BASE_H} offsetY={0}>
            <>
                <DungeonScene
                    /* фон/передний план */
                    bg="/scenes/dungeon_bg.png"
                    fg="/scenes/dungeon_fg.png"

                    /* 🔹 только отряд помощников (героя/врагов нет) */
                    backlineSrc="/allies/squad.png"
                    backlineScale={1.0}
                    backlineBottomPct={20}
                    backlineOffsetX={0}
                    backlineOffsetY={0}
                    backlineFlip={false}
                    backlineStyle={{ filter: "saturate(0.95) contrast(0.98)", opacity: 0.95 }}

                    /* верхний левый HUD */
                    topLeft={
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", userSelect: "none" }}>
                            <HeroHeader avatarSize={36} showLevel showCurrencies name={name} avatarUrl={avatarUrl} />
                        </div>
                    }

                    /* верхний правый HUD */
                    topRight={
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                background: "rgba(0,0,0,.28)",
                                border: "1px solid rgba(255,255,255,.18)",
                                borderRadius: 14,
                                padding: "6px 10px",
                                color: "#fff",
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            <HudItem icon="/icons/energy.png" text={`${energy} / ${energyMax}`} />

                            {/* Монеты с подсветкой и бейджем */}
                            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <img src="/icons/coin.svg" alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
                                    <span
                                        style={{
                                            fontWeight: 800,
                                            display: "inline-block",
                                            animation: claimGlow ? "glowPulse 0.9s ease forwards" : "none",
                                        }}
                                    >
                                        {coins.toLocaleString()}
                                    </span>
                                </span>

                                {/* Бейдж +N (всплывает над монетами) */}
                                {claimFlashTop !== null && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            bottom: "100%",
                                            transform: "translate(-50%, -6px)",
                                            padding: "3px 8px",
                                            borderRadius: 999,
                                            fontWeight: 900,
                                            fontSize: 11,
                                            color: "#1f160f",
                                            background: "#f5c96b",
                                            border: "1px solid rgba(0,0,0,.35)",
                                            boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                                            pointerEvents: "none",
                                            animation: "popFloat 1.1s ease forwards",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        +{claimFlashTop.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            <HudItem icon="/icons/gem.svg" text={String(gems)} />

                            <button
                                onClick={async () => {
                                    await logout();
                                }}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    background: "rgba(255,255,255,0.06)",
                                    color: "#fff",
                                }}
                            >
                                Сбросить вход
                            </button>
                        </div>
                    }


                    /* нижняя навигация (без логики «собрать») */
                    bottomRow={[
                        <IconTile
                            key="home"
                            title="Главная"
                            icon="/icons/home.png"
                            variant="large"
                            labelPosition="below"
                            iconSize="48px"
                            floatIdle={false}
                            onClick={() => nav("/home")}
                        />,
                        <IconTile
                            key="dungeon"
                            title="ПОДЗЕМЕЛЬЕ"
                            icon="/icons/dungeon.png"
                            variant="large"
                            labelPosition="below"
                            iconSize="48px"
                            floatIdle={false}
                            onClick={() => nav("/mine")}
                        />,
                        <IconTile
                            key="raids"
                            title="Рейды"
                            icon="/icons/raids.png"
                            variant="large"
                            labelPosition="below"
                            iconSize="48px"
                            floatIdle={false}
                            onClick={() => nav("/raids")}
                        />,
                    ]}

                    /* другие параметры сцены */
                    height="100%"
                    topOffsetPx={safeTopPx + 70}
                    sideAlign="middle"
                    sideLiftPx={165}
                    bottomLiftPx={36}
                />

                {/* ▼ новый ряд кнопок поверх сцены, ЧУТЬ ВЫШЕ навигации */}
                <div
                    style={{
                        position: "fixed",
                        left: 0,
                        bottom: 136, // подстрой под высоту навигации
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        gap: 12,
                        zIndex: 60,
                        pointerEvents: "none",
                    }}
                >
                    {/* Буфер */}
                    <div
                        style={{
                            pointerEvents: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            fontWeight: 800,
                            boxShadow: "0 2px 8px rgba(0,0,0,.35)",
                        }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <img src="/icons/buffer.svg" alt="" style={{ width: 36, height: 36 }} />
                            <span>
                                Ресурсы<br /> {(mine?.buffer ?? 0).toLocaleString()}
                                {typeof mine?.bufferCap === "number" ? ` / ${mine.bufferCap.toLocaleString()}` : ""}<br />
                                
                                
                            </span>
                        </span>
                    </div>

                    {/* Кнопка СобрАть */}
                    <div style={{ position: "relative", pointerEvents: "auto" }}>
                        <button
                            onClick={async () => {
                                const amount = mine?.buffer ?? 0;
                                if (amount <= 0 || claiming) return;

                                await claim();

                                // верхние анимации:
                                setClaimFlashTop(amount);
                                setTimeout(() => setClaimFlashTop(null), 1100);
                                setClaimGlow(true);
                                setTimeout(() => setClaimGlow(false), 900);
                            }}
                            disabled={claiming || !mine || (mine.buffer ?? 0) <= 0}
                            style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: (mine && (mine.buffer ?? 0) > 0) ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)",
                                color: "#fff",
                                fontWeight: 800,
                                boxShadow: "0 2px 8px rgba(0,0,0,.35)",
                                cursor: (claiming || !mine || (mine.buffer ?? 0) <= 0) ? "default" : "pointer",
                            }}
                            title="Забрать из буфера в склад"
                        >
                            {claiming ? "..." : "Продать ресурсы"}
                        </button>
                    </div>

                    {/* Кнопка Улучшения */}
                    <button
                        onClick={() => setUpOpen(true)}
                        style={{
                            pointerEvents: "auto",
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            fontWeight: 800,
                            boxShadow: "0 2px 8px rgba(0,0,0,.35)",
                        }}
                    >
                        Улучшения
                    </button>
                </div>


                <UpgradesOverlay open={upOpen} onClose={() => setUpOpen(false)} />

                {/* модалка выбора пола (если нужна) */}
                <GenderSelectModal
                    open={needGenderModal}
                    onClose={() => {
                        localStorage.setItem("genderModalDismissed", "1");
                        setNeedGenderModal(false);
                    }}
                    onChosen={() => {
                        localStorage.setItem("genderModalDismissed", "1");
                        setNeedGenderModal(false);
                        reload?.();
                    }}
                />
            </>
            <style>
                {`
@keyframes popFloat {
  0%   { transform: translateY(0) scale(0.95); opacity: 0; }
  10%  { transform: translateY(-4px) scale(1); opacity: 1; }
  70%  { transform: translateY(-14px) scale(1); opacity: 1; }
  100% { transform: translateY(-22px) scale(1); opacity: 0; }
}

/* Мягкое зелёное свечение числа "Склад" */
@keyframes glowPulse {
  0%   { color: #fff; text-shadow: none; }
  15%  { color: #b9f6ca; text-shadow: 0 0 10px rgba(123,255,138,.85); }
  70%  { color: #b9f6ca; text-shadow: 0 0 4px rgba(123,255,138,.45); }
  100% { color: #fff; text-shadow: none; }
}
`}
            </style>

        </SafeStage>
    );
}

/** маленький элемент HUD: иконка + текст */
function HudItem({ icon, text }: { icon: string; text: string }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <img src={icon} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
            <span style={{ fontWeight: 700 }}>{text}</span>
        </span>
    );
}
