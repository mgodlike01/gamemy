import React from 'react';
import Profile from '../pages/Profile';

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function ProfileModal({ open, onClose }: Props) {
    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)',
                display: 'grid', placeItems: 'center',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 'min(640px, 94vw)',
                    height: 'min(86vh, 720px)',
                    borderRadius: 16,
                    background: 'rgba(18, 24, 38, .96)',
                    border: '1px solid rgba(255,255,255,.1)',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,.45)',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Шапка модалки */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.08)'
                }}>
                    <div style={{ fontWeight: 800, letterSpacing: .5 }}>Профиль</div>
                    <button
                        onClick={onClose}
                        style={{
                            border: '1px solid rgba(255,255,255,.18)',
                            background: 'rgba(255,255,255,.07)',
                            color: '#fff', borderRadius: 8, padding: '6px 10px',
                            fontWeight: 700, cursor: 'pointer'
                        }}
                    >
                        Закрыть
                    </button>
                </div>

                {/* Контент профиля */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <Profile />
                </div>
            </div>
        </div>
    );
}
