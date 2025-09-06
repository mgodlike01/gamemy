import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconTile } from "./IconTile";

/**
 * Нижняя навигация, такая же как в Home.
 * Использует IconTile и проп bottomRow.
 */
export default function BottomNav() {
    const nav = useNavigate();
    const { pathname } = useLocation();

    const items = [
        {
            key: "home",
            title: "Главная",
            icon: "/icons/home.png",
            to: "/home",
        },
        {
            key: "dungeon",
            title: "ПОДЗЕМЕЛЬЕ",
            icon: "/icons/dungeon.png",
            to: "/mine",
        },
        {
            key: "raids",
            title: "Рейды",
            icon: "/icons/raids.png",
            to: "/raids",
        },
    ];

    return (
        <div
            style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2200,
                display: "flex",
                justifyContent: "space-around",
                background: "rgba(12,15,19,.96)",
                borderTop: "1px solid rgba(83,179,255,.25)",
                paddingBottom: "calc(var(--safe-bottom, 0px) + 6px)",
                paddingTop: "6px",
            }}
        >
            {items.map((it) => (
                <IconTile
                    key={it.key}
                    title={it.title}
                    icon={it.icon}
                    variant="large"
                    labelPosition="below"
                    iconSize="48px"
                    floatIdle={false}
                    onClick={() => nav(it.to)}
                    // Подсветим активную вкладку
                    style={{
                        opacity: pathname === it.to ? 1 : 0.6,
                        filter: pathname === it.to ? "drop-shadow(0 0 8px rgba(83,179,255,.6))" : "none",
                    }}
                />
            ))}
        </div>
    );
}
