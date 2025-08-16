import { useEffect, useMemo, useState } from 'react';
import { api } from '../shared/api';

type Target = {
  tgId: string;
  buffer: number;
  bufferCap: number;
  ratePerHour: number;
  shieldUntil?: string | null;
  isShielded?: boolean;
  canAttack?: boolean;
};

type RaidStatus = {
  energy: number;
  regenFrom: string;
  regenEveryMin: number;
  serverNow: string;
  energyMax: number;
};


export default function Raids() {
  const [status, setStatus] = useState<RaidStatus | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  const loadStatus = async () => {
    const { data } = await api.get('/raids/status');
    setStatus(data);
  };

  const loadLogs = async () => {
  const { data } = await api.get('/raids/logs?limit=20');
  setLogs(data.items || []);
};

  const loadTargets = async () => {
    const { data } = await api.get('/raids/find?limit=5');
    setTargets(data.targets || []);
  };

  useEffect(() => {
    loadStatus();
    loadTargets();
    const id = setInterval(loadStatus, 30_000);
    return () => clearInterval(id);
  }, []);

  const raid = async (tgId: string) => {
    setLoadingId(tgId);
    setMsg(null);
    try {
      const { data } = await api.post('/raids', { targetTgId: tgId });
      setResult(data);
      await loadStatus();
      await loadTargets();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Ошибка атаки');
    } finally {
      setLoadingId(null);
    }
  };

  const fmtNum = (n: number) => n.toLocaleString();
  const canSpendEnergy = (status?.energy ?? 0) > 0;

  return (
    <div style={{ maxWidth: 480, margin: '24px auto', padding: 16 }}>
      <h2>Рейды</h2>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Энергия</div>
          <b>{status ? `${status.energy} / ${status.energyMax}` : '—'}</b>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={loadTargets} disabled={!!loadingId}>Обновить цели</button>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {targets.length === 0 && <div className="muted">Нет доступных целей</div>}
        {targets.map(t => {
          const shieldText = t.isShielded ? (
            <span className="muted">Щит активен{t.shieldUntil ? ` до ${new Date(t.shieldUntil).toLocaleString()}` : ''}</span>
          ) : null;
          const disabled = !canSpendEnergy || t.isShielded || loadingId === t.tgId;
          return (
            <div key={t.tgId} className="card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div>Игрок: <b>{t.tgId}</b></div>
                <div className="muted">Скорость: {fmtNum(t.ratePerHour)}/ч</div>
                <div>Буфер: <b>{fmtNum(t.buffer)}</b> / {fmtNum(t.bufferCap)}</div>
                {shieldText}
              </div>
              <button onClick={() => raid(t.tgId)} disabled={disabled}>
                {loadingId === t.tgId ? 'Атакуем…' : t.isShielded ? 'Щит' : 'Напасть'}
              </button>
            </div>
          );
        })}
      </div>

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <p>Украдено: <b>{result.stolen}</b></p>
          <p>Энергии осталось: <b>{result.energyLeft}</b></p>
          <p>Лог: {result.logId}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <b>Журнал</b>
    <button onClick={loadLogs} disabled={!!loadingId}>Обновить</button>
  </div>

  <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
    {logs.length === 0 && <div className="muted">Пока пусто</div>}
    {logs.map((l, i) => (
  <div key={l.id ?? i} className="muted">
    <span>{new Date(l.createdAt).toLocaleString()} — </span>
    <span>{l.message}</span>
    {/* или:
    <span>{l.isOutbound ? 'Ты ограбил ' : 'Тебя ограбил '}</span>
    <b>{l.isOutbound ? l.targetTgId : l.attackerTgId}</b>
    <span>: </span><b>{l.amount}</b>
    */}
  </div>
))}
  </div>
</div>

      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
    </div>
  );
}

