import React, { useEffect, useState } from 'react';
import { api } from '../shared/api';

type Item = { key: 'male'|'female'; title: string; art: string; desc: string };

export function GenderSwitchModal({
  open,
  current,
  onClose,
  onSwitched,
}: {
  open: boolean;
  current: 'male' | 'female' | null | undefined;
  onClose: () => void;
  onSwitched: () => void; // вызовем после успешной смены (чтобы перезагрузить профиль)
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [cost, setCost] = useState<number>(0);
  const [loadingKey, setLoadingKey] = useState<null | 'male' | 'female'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await api.get('/profile/genders');
        setItems(data.items || []);
        setCost(data.switchCost ?? 0);
      } catch {
        setItems([
          { key: 'male', title: 'Мужской', art: '/hero/male.png', desc: '' },
          { key: 'female', title: 'Женский', art: '/hero/female.png', desc: '' },
        ]);
        setCost(1000);
      }
    })();
  }, [open]);

  if (!open) return null;

  const switchTo = async (key: 'male'|'female') => {
    if (key === current) return;
    setError(null);
    setLoadingKey(key);
    try {
      const { data } = await api.post('/profile/gender/switch', { gender: key });
      // можно показать тост: `успех, списано ${cost}, новый баланс ${data.newBalance}`
      onSwitched();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка при смене');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'var(--tg-theme-bg-color,#fff)', color:'var(--tg-theme-text-color,#111)', borderRadius:12, padding:16, width:340 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h3 style={{ margin:0, fontSize:18 }}>Смена персонажа</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize:12, opacity:.7, marginBottom:10 }}>
          Стоимость смены: <b>{cost}</b>
        </div>
        {error && <div style={{ color:'#d32f2f', fontSize:12, marginBottom:8 }}>{error}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {items.map(it => {
            const isCurrent = current === it.key;
            return (
              <button
                key={it.key}
                disabled={isCurrent || !!loadingKey}
                onClick={() => switchTo(it.key)}
                style={{
                  border: isCurrent ? '2px solid #4caf50' : '1px solid #ddd',
                  borderRadius:12, padding:8, background:'#fff',
                  opacity: isCurrent ? .85 : 1, position:'relative'
                }}
              >
                <img src={it.art} alt={it.title} style={{ width:'100%', height:120, objectFit:'contain' }}/>
                <div style={{ fontWeight:700, marginTop:6 }}>{it.title}</div>
                <div style={{ fontSize:12, opacity:.8 }}>{it.desc}</div>
                {isCurrent && (
                  <div style={{
                    position:'absolute', top:8, right:8, fontSize:10, background:'#4caf50',
                    color:'#fff', padding:'2px 6px', borderRadius:999
                  }}>
                    Текущий
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop:12, fontSize:12, opacity:.65 }}>
          Выберите нового персонажа. С баланса (склад) будет списано <b>{cost}</b>.
        </div>
      </div>
    </div>
  );
}
