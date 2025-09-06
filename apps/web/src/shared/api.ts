import axios from 'axios';

// ВНЕШНИЙ API URL (туннель/прод), локально можно переопределить .env
const BASE_URL =
    import.meta.env.VITE_API_URL ||
    'https://trimly-upbeat-lungfish.cloudpub.ru';

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: false,
});

const LS_JWT = 'jwt';
const LS_JWT_SOURCE: 'tg' | 'dev' | '' =
    (localStorage.getItem('jwt_source') as any) || '';

function inTelegram(): boolean {
    const tg = (window as any)?.Telegram?.WebApp;
    return Boolean(tg && tg.initData);
}

async function getTelegramJwt(): Promise<string | null> {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg?.initData) return null;
    const { data } = await axios.post(`${BASE_URL}/auth/telegram`, {
        initData: tg.initData,
    });
    localStorage.setItem(LS_JWT, data.token);
    localStorage.setItem('jwt_source', 'tg');
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data.token;
}

async function getDevJwt(): Promise<string | null> {
    // Разрешаем dev-токен только вне Telegram
    if (inTelegram()) return null;
    const { data } = await axios.get(`${BASE_URL}/auth/dev?tgId=DEV_USER`);
    localStorage.setItem(LS_JWT, data.token);
    localStorage.setItem('jwt_source', 'dev');
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data.token;
}

// Публичная функция, которую можно вызывать где угодно (boot/хуки)
export async function ensureAuth(): Promise<void> {
    try {
        // Если мы в Telegram, а лежит dev-токен — сбросить
        if (inTelegram() && localStorage.getItem('jwt_source') === 'dev') {
            localStorage.removeItem(LS_JWT);
            localStorage.removeItem('jwt_source');
        }

        let token = localStorage.getItem(LS_JWT);
        if (!token) {
            token = inTelegram() ? await getTelegramJwt() : await getDevJwt();
        }

        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            // Фолбэк только для локалки (вне Telegram)
            if (!inTelegram()) {
                (api.defaults.headers.common as any)['x-tg-id'] = 'DEV_USER';
            }
        }
    } catch (e) {
        console.error('[ensureAuth] fail:', e);
        // на всякий случай чистим и не блокируем UI
        localStorage.removeItem(LS_JWT);
        localStorage.removeItem('jwt_source');
    }
}

// (необязательно) Если где-то напрямую зовёте авторизацию через Telegram
export async function authByTelegram() {
    await ensureAuth();
    const { data } = await api.get('/auth/whoami');
    return data?.user;
}

export function clearAuth() {
    try {
        localStorage.removeItem('jwt');
        localStorage.removeItem('jwt_source');
        delete (api.defaults.headers.common as any)['Authorization'];
    } catch { }
}

/** Полный выход: чистим токен и заново пробуем авторизоваться */
export async function logout() {
    clearAuth();
    await ensureAuth(); // подтянет токен из Telegram initData или DEV (в браузере)
}