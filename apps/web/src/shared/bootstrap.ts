// Универсальные утилиты для предзагрузки

// Картинки (спрайты/фоны)
export async function preloadImages(
    urls: string[],
    onProgress?: (done: number, total: number) => void
) {
    let done = 0;
    const total = urls.length;

    await Promise.all(
        urls.map(
            (src) =>
                new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        done++;
                        onProgress?.(done, total);
                        resolve();
                    };
                    img.src = src;
                })
        )
    );
}

// Шрифты (@font-face) — ждём, пока применятся
export async function waitForFonts() {
    if ("fonts" in document) {
        // @ts-ignore
        await (document as any).fonts.ready;
    }
}

// Подключённые стили (link rel="stylesheet")
export async function waitForStylesheet(selector = 'link[rel="stylesheet"]') {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>(selector));
    await Promise.all(
        links.map(
            (l) =>
                new Promise<void>((resolve) => {
                    if (l.sheet) return resolve();
                    l.addEventListener("load", () => resolve(), { once: true });
                    l.addEventListener("error", () => resolve(), { once: true }); // не блокируем загрузку
                })
        )
    );
}
// apps/web/src/shared/bootstrap.ts
// Комментарии по-русски, чтобы было понятно

// 1) Говорим Telegram, что приложение готово и его можно "растянуть"
declare global {
    interface Window {
        Telegram?: any;
    }
}
const tg = window.Telegram?.WebApp;
try {
    tg?.ready();     // сигнал "готов"
    tg?.expand();    // просим занять максимум доступного места
} catch { /* no-op */ }

// 2) Функция, которая записывает полезные размеры в CSS-переменные
function updateViewportVars() {
    // viewportStableHeight — стабильная высота видимой области внутри Telegram
    const vh = tg?.viewportStableHeight || window.innerHeight;

    // Safe area (чтобы не налезать под шапку/низ Telegram)
    const safeTop = tg?.safeAreaInset?.top ?? 0;      // пиксели сверху
    const safeBottom = tg?.safeAreaInset?.bottom ?? 0; // пиксели снизу

    // Записываем в :root → можно использовать в CSS как var(--app-height) и т.д.
    const root = document.documentElement;
    root.style.setProperty('--app-height', `${vh}px`);
    root.style.setProperty('--safe-top', `${safeTop}px`);
    root.style.setProperty('--safe-bottom', `${safeBottom}px`);
}

// Вызов при старте
updateViewportVars();

// И подписка на изменения размера (изменение ориентации, открытие клавиатуры и т.д.)
try {
    tg?.onEvent?.('viewportChanged', updateViewportVars);
    window.addEventListener('resize', updateViewportVars);
} catch { /* no-op */ }

