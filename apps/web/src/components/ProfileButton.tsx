import React from "react";
import { createPortal } from "react-dom";
import ProfileModal from "./ProfileModal";           // ваш модальный контейнер
import Profile from "../pages/Profile";                      // контент модалки (страница профиля внутри)
import { useProfile } from "../shared/useProfile";    // где берёте данные профиля

type Props = {
    className?: string;
};

export default function ProfileButton({ className }: Props) {
    const { profile } = useProfile();
    const [open, setOpen] = React.useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={className}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                }}
            >
                <img
                    src={profile?.avatarUrl ?? "/assets/ui/avatar_placeholder.png"}
                    alt="avatar"
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/ui/avatar_placeholder.png")}
                />
                <span style={{ color: "#fff", fontWeight: 600 }}>
                    {profile?.displayName ?? "Профиль"}
                </span>
            </button>

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
