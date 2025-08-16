import React, { useMemo, useState, useEffect } from 'react';
import { useProfile } from '../shared/useProfile';
import { AVATARS } from '../data/avatars';
import { NicknameModal } from '../components/NicknameModal';
import { GenderSwitchModal } from '../components/GenderSwitchModal';

function Progress({ xp, level }: { xp: number; level: number }) {
  const curLevelStart = (level - 1) * 100;
  const nextLevelStart = level * 100;
  const inLevel = Math.min(100, Math.max(0, xp - curLevelStart));
  const pct = Math.round((inLevel / (nextLevelStart - curLevelStart)) * 100);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, opacity:.8 }}>
        <span>Уровень {level}</span>
        <span>{inLevel}/100 XP</span>
      </div>
      <div style={{ height:8, background:'#eee', borderRadius:8 }}>
        <div style={{ width:`${pct}%`, height:'100%', borderRadius:8, background:'#4caf50' }} />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, loading, setNickname, setAvatar, reload } = useProfile();

  const [nickOpen, setNickOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);   // модалка первого выбора пола
  const [switchOpen, setSwitchOpen] = useState(false);   // модалка платной смены
  const gender = useMemo(
  () => profile?.gender ?? profile?.hero?.gender ?? null,
  [profile]
);
  const current = useMemo(
    () => AVATARS.find(a => a.key === profile?.avatarKey),
    [profile]
  );
  const [needGenderModal, setNeedGenderModal] = useState(false);

  useEffect(() => {
  if (!loading) {
    setNeedGenderModal(!gender); // покажем только если пола нет
  }
}, [loading, gender]);

  // если пол не выбран — показать модалку первого выбора (без списания)
  useEffect(() => {
    if (profile && !profile.gender) setGenderOpen(true);
  }, [profile]);

  if (loading || !profile) return <div style={{ padding:16 }}>Загрузка…</div>;

  return (
    <>
      {/* Модалка платной смены персонажа */}
      <GenderSwitchModal
        open={switchOpen}
        current={profile.gender as 'male' | 'female' | null | undefined}
        onClose={() => setSwitchOpen(false)}
        onSwitched={reload}
      />

      {/* Если ты используешь отдельную модалку для первого бесплатного выбора пола — вставь её здесь.
          Либо открой такую же GenderSwitchModal в спец-режиме, где цена = 0 и бэк использует /profile/gender/choose. */}

      <div style={{ padding:16, display:'grid', gap:16 }}>
        {/* Шапка: аватар + ник */}
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <img
                      src={profile?.photoUrl || '/avatars/placeholder.png'}
                      alt="avatar"
                      width={64}
                      height={64}
                      style={{ borderRadius: 12, objectFit: 'cover', background: '#f2f2f2' }}
                      onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/avatars/placeholder.png' }}
                  />
        <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:600 }}>
              {profile.displayName || profile.username || profile.tgId}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              <button onClick={() => setNickOpen(true)}>
                {profile.displayName ? 'Сменить ник' : 'Задать ник'}
              </button>
              <button onClick={() => setSwitchOpen(true)}>
                Сменить персонажа
              </button>
            </div>
          </div>
        </div>

        {/* Уровень */}
        <div className="card">
          <Progress xp={profile.xp} level={profile.level} />
        </div>

        

        {/* Модалка ника */}
        <NicknameModal
          open={nickOpen || (!profile.displayName)}
          initial={profile.displayName || ''}
          onSubmit={async (nick) => { await setNickname(nick); setNickOpen(false); }}
        />
      </div>
    </>
  );
}
