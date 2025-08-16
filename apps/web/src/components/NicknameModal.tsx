import React, { useEffect, useState } from 'react';

export function NicknameModal({
  open, initial = '', onSubmit
}: { open: boolean; initial?: string; onSubmit: (nick: string)=>void }) {
  const [nick, setNick] = useState(initial);
  useEffect(() => { setNick(initial); }, [initial]);
  if (!open) return null;

  const ok = /^[A-Za-zА-Яа-яЁё0-9_]{3,16}$/.test(nick);

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex: 9999
    }}>
      <div style={{
        background:'var(--tg-theme-bg-color,#fff)',
        color:'var(--tg-theme-text-color,#111)',
        borderRadius:12, padding:16, width:320, boxShadow:'0 8px 24px rgba(0,0,0,.2)'
      }}>
        <h3 style={{ margin:'0 0 6px' }}>Выберите ник</h3>
        <p style={{ margin:'0 0 10px', fontSize:12, opacity:.8 }}>3–16 символов: буквы/цифры/_</p>

        <input
          value={nick}
          onChange={e=>setNick(e.target.value)}
          placeholder="Ваш ник"
          style={{ width:'80%',boxSizing: 'border-box',maxWidth: '260px', display: 'block', padding:10, borderRadius:8, border:'1px solid #ccc',margin: '0 auto', }}
        />

        <button
          onClick={()=> ok && onSubmit(nick)}
          disabled={!ok}
          style={{ marginTop:12, width:'100%', padding:10, borderRadius:8 }}
        >
          Сохранить
        </button>

        {!ok && <div style={{ marginTop:8, fontSize:12, opacity:.8 }}>Ник некорректен</div>}
      </div>
    </div>
  );
}
