import crypto from 'crypto';

export function parseInitData(initData: string): Record<string, string> {
    const params = new URLSearchParams(initData);
    const obj: Record<string, string> = {};
    params.forEach((v, k) => { obj[k] = v; });
    return obj;
}

export function validateInitData(initData: string, botToken: string): { ok: boolean; data?: Record<string, string> } {
    try {
        const data = parseInitData(initData);
        const hash = data.hash;
        if (!hash) return { ok: false };

        // Строка проверки: отсортированные key=value, без hash
        const checkString = Object.entries(data)
            .filter(([k]) => k !== 'hash')
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        // secret = HMAC-SHA256(botToken) с ключом 'WebAppData'
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calc = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

        return { ok: calc === hash, data };
    } catch {
        return { ok: false };
    }
}
