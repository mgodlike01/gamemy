import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../shared/api';

type MineDto = {
  ratePerHour: number;
  buffer: number;
  bufferCap: number;
  warehouse: number;
  shieldUntil?: string | null;
  updatedAt: string; // ← серверное время последнего апдейта
};

export default function Mine() {
  const [mine, setMine] = useState<MineDto | null>(null);
  const [loading, setLoading] = useState(false);

  // локальные опоры для «бегущих» чисел
  const syncedAt = useRef<number>(Date.now());
  const serverAt = useRef<number>(0); // отметка serverNow ~ updatedAt

  const fetchMine = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mine');
      setMine(data);
      syncedAt.current = Date.now();
      serverAt.current = new Date(data.updatedAt).getTime();
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMine();
    const syncId = setInterval(fetchMine, 15_000); // периодически синхронизируем (анти-дрифт)
    return () => clearInterval(syncId);
  }, []);

  // «Живой» расчёт буфера между синхронизациями
  const live = useMemo(() => {
    if (!mine) return { buffer: 0, perSec: 0, etaFullSec: null as number | null };
    const perSec = mine.ratePerHour / 3600;
    const elapsedSec = Math.max(0, Math.floor((Date.now() - syncedAt.current) / 1000));
    const predicted = Math.min(
      mine.bufferCap,
      mine.buffer + Math.floor(perSec * elapsedSec)
    );
    const left = mine.bufferCap - predicted;
    const etaFullSec = left <= 0 ? null : Math.ceil(left / perSec);
    return { buffer: predicted, perSec, etaFullSec };
  }, [mine, Date.now() /* заставим пересчет через наш тиканье ниже */]);

  // каждую секунду перерисовывать
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const claim = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/mine/claim');
      // после claim сразу подтянем актуальное состояние
      await fetchMine();
      alert(`Забрали: ${data.moved}. Щит до: ${new Date(data.shieldUntil).toLocaleString()}`);
    } finally { setLoading(false); }
  };

  const shieldCountdown = useMemo(() => {
    if (!mine?.shieldUntil) return null;
    const ms = new Date(mine.shieldUntil).getTime() - Date.now();
    return ms <= 0 ? null : ms;
  }, [mine, Date.now()]);

  const fmtDur = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  };

  if (!mine) return <div style={{ padding: 16 }}>Загрузка…</div>;

  const progress = Math.round((live.buffer / mine.bufferCap) * 100);

  return (
    <div style={{ maxWidth: 480, margin: '24px auto', padding: 16 }}>
      <h1>Подземелье</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Скорость</div><b>{mine.ratePerHour} ед./час</b>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>Буфер: <b>{live.buffer}</b> / {mine.bufferCap}</div>
        <div style={{ height: 8, background: 'var(--tg-theme-hint-color, #ddd)', borderRadius: 6 }}>
          <div style={{
            width: `${progress}%`,
            height: 8,
            background: 'var(--tg-theme-button-color, #2aabee)',
            borderRadius: 6
          }} />
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          {live.etaFullSec == null ? 'Заполнен' : `До заполнения: ${fmtDur(live.etaFullSec)}`}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Склад</div><b>{mine.warehouse}</b>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div>Щит: <b>{shieldCountdown == null ? 'нет' : `${fmtDur(Math.ceil(shieldCountdown/1000))}`}</b></div>
      </div>

      <button onClick={claim} disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Обработка…' : 'Забрать (Claim)'}
      </button>
    </div>
  );
}
