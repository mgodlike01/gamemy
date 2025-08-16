import React, { useMemo, useState } from "react";

type Props = {
    title: string;
    icon: string;
    badge?: string;
    variant?: "compact" | "large";
    square?: boolean;
    labelPosition?: "below" | "right" | "none";
    iconSize?: string;        // например "70px"
    labelSize?: string;       // например "clamp(11px,3vw,13px)"
    uppercase?: boolean;
    onClick?: () => void;

    /** Дополнительно для анимаций */
    animDelayMs?: number;     // задержка появления (стаггер), по умолчанию 0
    floatIdle?: boolean;      // плавное «дыхание» иконки в покое (по умолчанию true для compact)
};

export function IconTile({
    title,
    icon,
    badge,
    variant = "compact",
    square,
    labelPosition = "below",
    iconSize = variant === "compact" ? "70px" : "56px",
    labelSize = "clamp(12px,3.5vw,16px)",
    uppercase,
    onClick,
    animDelayMs = 0,
    floatIdle,
}: Props) {
    const [isPressed, setPressed] = useState(false);

    // дефолты для idle-анимации
    const shouldFloat = useMemo(
        () => (floatIdle ?? variant === "compact"),
        [floatIdle, variant]
    );

    // размеры + раскладка
    const isCompact = variant === "compact";
    const rootPadding = isCompact ? 6 : 8;
    const col = labelPosition === "right";

    return (
        <button
            onClick={onClick}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            style={{
                // контейнер
                display: "grid",
                gridAutoFlow: col ? "column" : "row",
                alignItems: "center",
                justifyItems: "center",
                gap: col ? 12 : 6,
                padding: rootPadding,
                width: square ? "100%" : undefined,
                aspectRatio: square ? "1 / 1" : undefined,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                // анимации появления и hover/active
                transform: isPressed ? "scale(0.96)" : "none",
                transition: "transform 140ms ease, filter 200ms ease",
                filter: isPressed ? "brightness(1.02)" : "none",
                // появление
                opacity: 0,
                animation: `tileFadeIn 420ms cubic-bezier(.2,.8,.2,1) forwards`,
                animationDelay: `${animDelayMs}ms`,
                // подсказка для GPU
                willChange: "transform, opacity",
            }}
        >
            {/* ИКОНКА */}
            <div
                style={{
                    position: "relative",
                    width: iconSize,
                    height: iconSize,
                    display: "grid",
                    placeItems: "center",
                    // лёгкая тень на иконке
                    filter: "drop-shadow(0 2px 8px rgba(0,0,0,.35))",
                    // idle-покачивание
                    animation: shouldFloat ? `iconFloat 2600ms ease-in-out infinite` : undefined,
                    // при hover увеличиваем
                }}
                className="icon-wrap"
            >
                <img
                    src={icon}
                    alt=""
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                        transform: isPressed ? "scale(1.05)" : "scale(1.0)",
                        transition: "transform 140ms ease",
                    }}
                />

                {/* Бейдж */}
                {badge && (
                    <span
                        style={{
                            position: "absolute",
                            right: -4,
                            top: -4,
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            display: "inline-grid",
                            placeItems: "center",
                            background: "#ff4d4f",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: 12,
                            borderRadius: 999,
                            border: "2px solid rgba(0,0,0,.35)",
                            boxShadow: "0 4px 10px rgba(0,0,0,.35)",
                            transformOrigin: "center",
                            animation: "badgePulse 1400ms ease-in-out infinite",
                        }}
                    >
                        {badge}
                    </span>
                )}
            </div>

            {/* ТЕКСТ */}
            {labelPosition !== "none" && (
                <div
                    style={{
                        color: "#fff",
                        textShadow: "0 2px 6px rgba(0,0,0,.65)",
                        fontWeight: 800,
                        fontSize: labelSize,
                        letterSpacing: uppercase ? 0.5 : 0.2,
                        textTransform: uppercase ? "uppercase" : "none",
                        lineHeight: 1.1,
                        textAlign: col ? "left" : "center",
                        maxWidth: col ? 120 : "unset",
                    }}
                >
                    {title}
                </div>
            )}

            {/* ЛОКАЛЬНЫЕ СТИЛИ/АНИМАЦИИ */}
            <style>{`
        @keyframes tileFadeIn {
          0% { opacity: 0; transform: translateY(6px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes iconFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
        @keyframes badgePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }

        /* Hover эффекты для устройств с мышью */
        @media (hover:hover) and (pointer:fine) {
          button:hover > .icon-wrap img {
            transform: scale(1.06);
          }
        }

        /* Учитываем, если пользователь просит меньше анимаций */
        @media (prefers-reduced-motion: reduce) {
          .icon-wrap { animation: none !important; }
          button { animation: none !important; }
        }
      `}</style>
        </button>
    );
}
