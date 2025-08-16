import React from 'react';
import { api } from '../shared/api';
import { useProfile } from '../shared/useProfile';

type Props = {
  open: boolean;
  onClose?: () => void;
  // опционально: вызывается после выбора пола (успешного)
  onChosen?: () => void;
};

export default function GenderSelectModal({ open, onClose, onChosen }: Props) {
  const { reload } = useProfile();
  const [loading, setLoading] = React.useState<'male' | 'female' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  const choose = async (g: 'male' | 'female') => {
    try {
      setError(null);
      setLoading(g);
      // ВАЖНО: тело именно { gender: 'male' | 'female' }
      await api.post('/profile/gender/choose', { gender: g });
      await reload();
      onChosen?.();
      onClose?.();
    } catch (e: any) {
      // читаем сообщение с сервера, если есть
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Не удалось выбрать персонажа. Попробуйте ещё раз.';
      setError(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        // клик по подложке — закрыть (если нужно убрать — закомментируй)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          background: 'var(--tg-theme-bg-color, #101418)',
          color: 'var(--tg-theme-text-color, #fff)',
          boxShadow: '0 10px 30px rgba(0,0,0,.35)',
          border: '1px solid rgba(255,255,255,.08)',
          padding: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          Выберите персонажа
        </div>
        <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 14, lineHeight: 1.3 }}>
          Это повлияет на внешний вид героя в подземелье. Выбор бесплатный и доступен один раз.
          Сменить позже можно за игровую валюту.
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(255,77,77,.12)',
              border: '1px solid rgba(255,77,77,.35)',
              color: '#ff6b6b',
              whiteSpace: 'pre-wrap',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => choose('male')}
            disabled={loading !== null}
            style={tileStyle(loading === 'male')}
          >
            <img
              src="/hero/male.png"
              alt="male"
              style={{ width: 84, height: 84, objectFit: 'contain', pointerEvents: 'none' }}
            />
            <span style={{ fontWeight: 800, marginTop: 6 }}>Мужской</span>
          </button>

          <button
            onClick={() => choose('female')}
            disabled={loading !== null}
            style={tileStyle(loading === 'female')}
          >
            <img
              src="/hero/female.png"
              alt="female"
              style={{ width: 84, height: 84, objectFit: 'contain', pointerEvents: 'none' }}
            />
            <span style={{ fontWeight: 800, marginTop: 6 }}>Женский</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading !== null}
            style={secondaryBtn}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/** Стили «плиток» выбора пола */
function tileStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    background: active ? 'rgba(255, 213, 74, .15)' : 'rgba(255,255,255,.06)',
    border: active ? '1px solid rgba(255, 213, 74, .8)' : '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform .12s ease, background .2s ease, border-color .2s ease',
    transform: active ? 'scale(0.98)' : 'none',
  };
}

const secondaryBtn: React.CSSProperties = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(255,255,255,.06)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};
