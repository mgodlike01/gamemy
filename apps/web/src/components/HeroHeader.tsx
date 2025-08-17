import React from 'react';
import { useProfile } from '../shared/useProfile';
import { Link, useLocation } from "react-router-dom";

interface HeroHeaderProps {
    name?: string;
    avatarUrl?: string;
    level?: number;
    showLevel?: boolean;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
    name,
    avatarUrl,
    level,
    showLevel = true,
}: {
    name: string;
    level: number;
    avatarUrl?: string;
}) => {
    const { profile } = useProfile();
    const location = useLocation();

    const finalName =
        name ||
        profile?.displayName ||
        profile?.username ||
        profile?.tgName ||
        profile?.tgId ||
        'Герой';

    const finalAvatar =
        avatarUrl || profile?.avatarUrl || '/avatars/placeholder.png';

    const avatarSize = 48;

    return (
        <Link
            to="/profile"
            state={{ background: location }} // сохраняем предыдущее место для модалки
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}
        >
            <img
                src={finalAvatar}
                alt="Аватар"
                style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: '50%',
                    objectFit: 'cover',
                }}
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/avatars/placeholder.png';
                }}
            />
            <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700 }}>{finalName}</div>
                {showLevel && (
                    <div className="muted" style={{ fontSize: 12 }}>
                        Уровень {level ?? profile?.level ?? 1}
                    </div>
                )}
            </div>
        </Link>
    );
};
