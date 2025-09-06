// src/shared/stableVh.ts
export function initStableVh() {
    // Забираем высоту из Telegram WebApp, если он есть
    const tg = (window as any)?.Telegram?.WebApp;

    const update = () => {
        const h = Math.round(
            tg?.viewportStableHeight ||   // стабильная высота TMA (лучший вариант)
            tg?.viewportHeight ||         // запасной вариант TMA
            window.innerHeight            // браузерный fallback
        );
        document.documentElement.style.setProperty('--app-vh', `${h}px`);
    };

    update();
    window.addEventListener('resize', update);
    tg?.onEvent?.('viewportChanged', update);

    // на всякий случай: очистка слушателя TMA
    return () => tg?.offEvent?.('viewportChanged', update);
}
