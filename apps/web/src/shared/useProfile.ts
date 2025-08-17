import { useCallback, useEffect, useState } from 'react';
import { api, ensureAuth } from './api';

export type Profile = {
    id: string;
    tgId: string;
    username?: string | null;
    displayName?: string | null;
    photoUrl?: string | null;
    level?: number;
    xp?: number;
    gender?: 'male' | 'female' | null;
    hero?: { gender?: 'male' | 'female' | null } | null;
};

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            await ensureAuth();
            const { data } = await api.get('/auth/whoami');
            setProfile(data?.user ?? null);
        } catch (e) {
            console.error('[useProfile] whoami fail:', e);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const setNickname = async (_nick: string) => { /* реализация позже */ };
    const setAvatar = async (_key: string) => { /* реализация позже */ };
    const reload = load;

    return { profile, loading, setNickname, setAvatar, reload };
}
