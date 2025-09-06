// src/shared/stableVh.ts
export function initStableVh() {
    // �������� ������ �� Telegram WebApp, ���� �� ����
    const tg = (window as any)?.Telegram?.WebApp;

    const update = () => {
        const h = Math.round(
            tg?.viewportStableHeight ||   // ���������� ������ TMA (������ �������)
            tg?.viewportHeight ||         // �������� ������� TMA
            window.innerHeight            // ���������� fallback
        );
        document.documentElement.style.setProperty('--app-vh', `${h}px`);
    };

    update();
    window.addEventListener('resize', update);
    tg?.onEvent?.('viewportChanged', update);

    // �� ������ ������: ������� ��������� TMA
    return () => tg?.offEvent?.('viewportChanged', update);
}
