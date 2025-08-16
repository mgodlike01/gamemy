import React, { useEffect, useRef, useState } from 'react';

type Props = {
  baseWidth: number;   // виртуальная ширина полотна (например, 390)
  baseHeight: number;  // виртуальная высота (например, 700)
  children: React.ReactNode;
  offsetY?: number;    // смещение полотна вниз (px), если надо уйти от шапки
};

export const SafeStage: React.FC<Props> = ({ baseWidth, baseHeight, children, offsetY = 0 }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const s = Math.min(r.width / baseWidth, r.height / baseHeight);
      setScale(s);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth, baseHeight]);

  // Telegram WebApp: занять максимум
  useEffect(() => {
    try { (window as any)?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#0b0f14',
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
        paddingLeft: 'max(env(safe-area-inset-left), 0px)',
        paddingRight: 'max(env(safe-area-inset-right), 0px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% + ${offsetY}px)`,
          width: baseWidth,
          height: baseHeight,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};
