import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

export function getTgIdFromRequest(req: FastifyRequest): string {
    const auth = (req.headers['authorization'] || '') as string;

    if (auth.startsWith('Bearer ')) {
        try {
            const token = auth.substring(7);
            const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            if (payload?.tgId) return String(payload.tgId);
        } catch {
            // токен некорректен — игнорируем
        }
    }

    const hdr = req.headers['x-tg-id'] as string | undefined;
    // ВАЖНО: больше НЕ возвращаем DEV_USER по умолчанию,
    // чтобы в Телеге не подтягивался dev-профиль.
    return hdr || '';
}
