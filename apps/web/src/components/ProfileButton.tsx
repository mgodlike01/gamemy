import React from 'react';
import { type Profile } from '../shared/useProfile';
import { AVATARS } from '../data/avatars';

// находим src картинки по ключу
function avatarSrc(key?: string | null) {
  const found = AVATARS.find(a => a.key === key);
  return found?.src || '/avatars/placeholder.png'; // положи файл в public/avatars/placeholder.png
}

export function ProfileButton({
  profile,
  onClick,
}: {
  profile: Profile | null | undefined;
  onClick?: () => void;
}) {
  const level = profile?.level ?? 1;
  const nick  = profile?.displayName || profile?.username || profile?.tgId || 'Профиль';
  const src   = avatarSrc(profile?.avatarKey);

  return (
    <button
      onClick={onClick}
      title="Профиль"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 6,
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'var(--tg-theme-bg-color, #fff)',
        color: 'var(--tg-theme-text-color, #111)',
      }}
    >
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        {/* аватар */}
        <img
          src={src}
          alt="avatar"
          width={44}
          height={44}
          style={{
            display: 'block',
            width: 44,
            height: 44,
            borderRadius: '50%',
            objectFit: 'cover',
            background: '#ececec',
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/placeholder.png'; }}
        />
        {/* бейдж уровня в правом нижнем углу */}
        <div
          style={{
            position: 'absolute',
            right: -2,
            bottom: -3,
            minWidth: 13,
            height: 13,
            padding: '2 4px',
            borderRadius: 999,
            border: '2px solid var(--tg-theme-bg-color, #fff)',
            background: 'var(--tg-theme-button-color, #5865F2)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            fontSize: 10,
            lineHeight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          {level}
        </div>
      </div>

      {/* ник рядом */}
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: 14, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nick}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Профиль🥷</div>
      </div>
    </button>
  );
}
