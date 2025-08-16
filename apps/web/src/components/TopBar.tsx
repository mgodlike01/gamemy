import React from 'react';

export function TopBar({
  avatar,
  name,
  level,
  energy,
  energyMax,
  coins,
  gems,
  onProfile,
}: {
  avatar?: string | null;
  name: string;
  level: number;
  energy: number;
  energyMax: number;
  coins: number;
  gems: number;
  onProfile: () => void;
}) {
  return (
    <div
   style={{
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      background: '#0f1216',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      ['--topbar-h' as any]: '56px',
      borderRadius: 10
    }}
    >
      <button
        onClick={onProfile}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        {/* Аватар с бейджем уровня */}
        <div style={{ position: 'relative', width: 40, height: 40 }}>
          <img
            src={avatar || '/avatars/miner_1.png'}
            alt="avatar"
            width={40}
            height={40}
            style={{ borderRadius: 999, objectFit: 'cover', background: '#2c2f36' }}
          />
          <div
            title={`Уровень ${level}`}
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              minWidth: 5,
              height: 20,
              padding: '0 6px',
              borderRadius: 999,
              background: '#3b82f6',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              lineHeight: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,.35)',
            }}
          >
            {level}
          </div>
        </div>

        <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          
        </div>
      </button>

      {/* Ресурсы справа */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
        <div title="Энергия" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/icons/energy.png" width={16} height={16} />
          <span>{energy} / {energyMax}</span>
        </div>
        <div title="Монеты" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/icons/coin.svg" width={16} height={16} />
          <span>{coins}</span>
        </div>
        <div title="Гемы" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/icons/gem.svg" width={16} height={16} />
          <span>{gems}</span>
        </div>
      </div>
    </div>
  );
}
