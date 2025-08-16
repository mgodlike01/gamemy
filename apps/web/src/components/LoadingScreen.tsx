import React from "react";

type Props = {
    message?: string;
    progress?: number; // 0..100; если не задан, полоска будет “бесконечной”
};

export function LoadingScreen({ message = "Создаем твое приключение...", progress }: Props) {
    const indeterminate = progress == null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(180deg,#0d1117,#0a0f14)",
                color: "#fff",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            }}
        >
            <div style={{ width: "min(420px,90vw)", display: "grid", gap: 16, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: .2 }}>{message}</div>

                {/* Контейнер полоски */}
                <div
                    style={{
                        position: "relative",
                        height: 10,
                        background: "rgba(255,255,255,.12)",
                        borderRadius: 999,
                        overflow: "hidden",
                    }}
                >
                    {/* Заполнение (детерминированное) */}
                    {!indeterminate && (
                        <div
                            style={{
                                width: `${Math.max(0, Math.min(100, progress))}%`,
                                height: "100%",
                                background: "linear-gradient(90deg,#4ade80,#22d3ee)",
                            }}
                        />
                    )}

                    {/* Бесконечная анимация */}
                    {indeterminate && (
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: "30%",
                                background: "linear-gradient(90deg,#4ade80,#22d3ee)",
                                borderRadius: 999,
                                animation: "loaderRun 1.1s ease-in-out infinite",
                            }}
                        />
                    )}
                </div>

                <style>
                    {`
          @keyframes loaderRun {
            0%   { transform: translateX(-100%); }
            50%  { transform: translateX(140%); }
            100% { transform: translateX(140%); }
          }
        `}
                </style>
            </div>
        </div>
    );
}
