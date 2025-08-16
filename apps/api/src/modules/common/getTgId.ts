import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

export function getTgIdFromRequest(req: FastifyRequest): string {
    const auth = (req.headers['authorization'] || '') as string;
    if (auth.startsWith('Bearer ')) {
        try {
            const token = auth.substring(7);
            const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            if (payload?.tgId) return String(payload.tgId);
        } catch { }
    }
    const hdr = req.headers['x-tg-id'] as string | undefined;
    return hdr || 'DEV_USER';
}
