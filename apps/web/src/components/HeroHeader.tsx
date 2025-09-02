import React from "react";
import { createPortal } from "react-dom";
import { useProfile } from "../shared/useProfile";

// ⚠️ путь подправь под свои файлы:
import ProfileModal from "./ProfileModal";
import Profile from "../pages/Profile"; // или: import Profile from "../pages/Profile";

type Props = {
    name?: string;
    avatarUrl?: string;
    level?: number;
    showLevel?: boolean;
    className?: string;
};

export default function HeroHeader({
    name,
    avatarUrl,
    level,
    showLevel = true,
    className,
}: Props) {
    const { profile } = useProfile();
    const [open, setOpen] = React.useState(false);

    const finalName =
        name ||
        profile?.displayName ||
        profile?.username ||
        "Герой";

    const finalAvatar =
        avatarUrl || profile?.avatarUrl || "/assets/ui/avatar_placeholder.png";

    const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
        // если вдруг обёрнут в <Link> родителя — блокируем навигацию
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
    };

    return (
        <>
            {/* КЛИКАБЕЛЬНАЯ ШАПКА — никаких <Link to="/profile"> */}
            <div
                onClick={handleClick}
                className={className}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 8,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.25)",
                    cursor: "pointer",
                    userSelect: "none",
                }}
            >
                <img
                    src={finalAvatar}
                    alt="Аватар"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                    }}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                            "/assets/ui/avatar_placeholder.png";
                    }}
                />
                <div style={{ lineHeight: 1.2, color: "#fff" }}>
                    <div style={{ fontWeight: 700 }}>{finalName}</div>
                    {showLevel && (
                        <div style={{ fontSize: 12, opacity: 0.85 }}>
                            Уровень {level ?? profile?.level ?? 1}
                        </div>
                    )}
                </div>
            </div>

            {/* Модалка поверх всего */}
            {open &&
                createPortal(
                    <ProfileModal onClose={() => setOpen(false)}>
                        <Profile />
                    </ProfileModal>,
                    document.body
                )}
        </>
    );
}
