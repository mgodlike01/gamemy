import React, { useMemo } from "react";
import { useProfile as useProfileHook } from "../shared/useProfile";

interface ProfileData {
    id: string | number;
    displayName?: string;
    avatarUrl?: string | null;
    gender?: "male" | "female" | null;
    level?: number;
    xp?: number;
    expToNext?: number;
}

function useProfileSafe(): {
    profile: ProfileData | null;
    loading: boolean;
} {
    try {
        // @ts-ignore - provided by проект
        const h = useProfileHook();
        return { profile: h.profile, loading: h.loading };
    } catch {
        return {
            profile: {
                id: 1,
                displayName: "Miner",
                avatarUrl: null,
                gender: null,
                level: 3,
                xp: 120,
                expToNext: 300,
            },
            loading: false,
        } as any;
    }
}

// ТЁПЛЫЕ ТОНА, НО БЕЗ РАСТЯГИВАНИЯ НА ВЕСЬ ЭКРАН
const cardStyle: React.CSSProperties = {
    background: "#3a2417",
    border: "2px solid #2a1a10",
    borderRadius: 16,
    padding: 12,
    boxShadow: "inset 0 0 6px rgba(0,0,0,0.5)",
    color: "#f5e6d3",
};

function SectionCard({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section style={{ ...cardStyle }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>{title}</h3>
                <div style={{ marginLeft: "auto" }}>{action}</div>
            </div>
            {children}
        </section>
    );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
    const safeMax = Math.max(1, max || 0);
    const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));
    return (
        <div style={{ width: "100%", height: 14, borderRadius: 999, background: "#5a3b26", overflow: "hidden", border: "1px solid #2a1a10" }}>
            <div
                style={{
                    width: pct + "%",
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #ffcc66, #ff9933)",
                    transition: "width .3s ease",
                }}
            />
        </div>
    );
}

export default function Profile() {
    const { profile, loading } = useProfileSafe();

    const xp = profile?.xp ?? 0;
    const expToNext = profile?.expToNext ?? 0;
    const level = profile?.level ?? 1;

    const tgPhotoUrl = (typeof window !== "undefined" && (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) as
        | string
        | undefined;
    const avatarSrc = profile?.avatarUrl ?? tgPhotoUrl ?? null;

    const avatarLetter = useMemo(() => profile?.displayName?.[0]?.toUpperCase() ?? "M", [profile?.displayName]);

    if (loading || !profile) {
        return (
            <div style={{ padding: 16 }}>
                <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#5a3b26" }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ height: 12, background: "#7a4b36", borderRadius: 6, marginBottom: 8 }} />
                        <div style={{ height: 12, background: "#7a4b36", borderRadius: 6, width: "60%" }} />
                    </div>
                </div>
            </div>
        );
    }

    const pctText = expToNext > 0 ? Math.min(100, Math.round((xp / expToNext) * 100)) + "%" : "0%";

    // ВАЖНО: не задаём 100vh/фон контейнеру, чтобы модалка не растягивалась
    // Контейнер ограничиваем по высоте и включаем скролл внутри модалки
    return (
        <div
            style={{
                padding: 12,
                paddingBottom: 16,
                color: "#f5e6d3",
                maxHeight: "75vh",
                overflowY: "auto",
            }}
        >
            {/* Header */}
            <div
                style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: "#5a3b26",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: 28,
                        userSelect: "none",
                        overflow: "hidden",
                        flex: "0 0 auto",
                    }}
                >
                    {avatarSrc ? (
                        <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} />
                    ) : (
                        avatarLetter
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 800,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {profile.displayName || "Безымянный"}
                    </h2>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>ID: {String(profile.id)}</div>
                </div>
            </div>

            {/* Level */}
            <SectionCard
                title={
                    <>
                        Уровень
                        <span
                            style={{
                                marginLeft: 8,
                                padding: "2px 8px",
                                fontSize: 12,
                                borderRadius: 999,
                                background: "#5a3b26",
                                fontWeight: 800,
                            }}
                            aria-label="current level"
                        >
                            {level}
                        </span>
                    </>
                }
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ProgressBar value={xp} max={expToNext || 1} />
                    <span style={{ fontSize: 12, minWidth: 72, textAlign: "right" }}>
                        {xp}/{expToNext || 0}
                    </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Прогресс до следующего уровня: {pctText}</div>
            </SectionCard>

            {/* Achievements */}
            <SectionCard
                title="Достижения"
                action={
                    <button
                        style={{
                            border: "1px solid rgba(255,236,200,0.18)",
                            background: "rgba(255,236,200,0.06)",
                            cursor: "pointer",
                            borderRadius: 999,
                            padding: "6px 10px",
                            color: "#f5e6d3",
                        }}
                        onClick={() => alert("Скоро")}
                    >
                        Все
                    </button>
                }
            >
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                    <li style={{ ...cardStyle, padding: 8 }}>Первый удар — получите первые монеты.</li>
                    <li style={{ ...cardStyle, padding: 8 }}>Рукожоп? Нет! — прокачайте силу до 10.</li>
                </ul>
            </SectionCard>
        </div>
    );
}
