import React from "react";

type Props = {
    progress?: number; // 0..100
};

export function LoadingScreen({ progress = 0 }: Props) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "#0b0b0c",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                zIndex: 999999,
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            }}
        >
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>
                Создаем твое приключение...
            </div>

            <div
                style={{
                    width: "64%",
                    maxWidth: 520,
                    height: 12,
                    background: "rgba(255,255,255,.12)",
                    borderRadius: 999,
                    overflow: "hidden",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
                }}
            >
                <div
                    style={{
                        width: `${Math.max(0, Math.min(100, progress))}%`,
                        height: "100%",
                        background: "linear-gradient(90deg,#00c6ff,#0072ff)",
                        transition: "width .25s ease",
                    }}
                />
            </div>

            <div style={{ opacity: 0.8, fontSize: 14 }}>{progress}%</div>
        </div>
    );
}
