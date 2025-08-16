import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Mine from './pages/Mine';
import Raids from './pages/Raids';
import { useProfile } from './shared/useProfile';
import { NicknameModal } from './components/NicknameModal';

export default function App() {
  const { profile, loading, setNickname } = useProfile();
  const [open, setOpen] = useState(false);

  // если ника нет — автоматически открываем модалку
  const needNick = !loading && profile && !profile.displayName;
console.log('profile=', profile, 'loading=', loading, 'needNick=', needNick);
  return (
    <div style={{ paddingBottom: 56 }}>
      {/* Навбар */}
      <nav style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderBottom:'1px solid #eee' }}>
        <Link to="/mine">Шахта</Link>
        <Link to="/raids">Рейды</Link>
        <div style={{ marginLeft: 'auto' }} />
        <button onClick={() => setOpen(true)}>
          {profile?.displayName ? `Профиль (${profile.displayName})` : 'Профиль'}
        </button>
      </nav>

      {/* Роутинг */}
      <Routes>
        <Route path="/mine" element={<Mine />} />
        <Route path="/raids" element={<Raids />} />
        <Route path="/" element={<Navigate to="/mine" replace />} />
        <Route path="*" element={<Mine />} />
      </Routes>

      {/* Модалка ника: открывается либо по кнопке, либо сама при первом входе */}
      <NicknameModal
        open={open || needNick}
        initial={profile?.displayName || ''}
        onSubmit={async (nick) => { await setNickname(nick); setOpen(false); }}
      />
    </div>
  );
}
