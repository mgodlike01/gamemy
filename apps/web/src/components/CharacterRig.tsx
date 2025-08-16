import React from 'react';

export type PartSrcs = {
  body: string;
  head: string;
  armL: string;
  armR: string;
  legL: string;
  legR: string;
  weapon?: string;
  helmet?: string;
};

type Props = {
  src: PartSrcs;
  width?: number;       // итоговая ширина рига в px
  idle?: boolean;       // idle-анимация
  flipX?: boolean;      // отзеркалить по X
};

export const CharacterRig: React.FC<Props> = ({
  src,
  width = 260,
  idle = true,
  flipX = false,
}) => {
  return (
    <div
      style={{
        width,
        aspectRatio: '1 / 1.25',              // подстрой под свой арт
        position: 'relative',
        transform: flipX ? 'scaleX(-1)' : undefined,
        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.45))',
        pointerEvents: 'none',
      }}
    >
      {/* Ноги */}
      <img src={src.legL} alt="" style={legStyle(idle, true)} />
      <img src={src.legR} alt="" style={legStyle(idle, false)} />

      {/* Тело */}
      <img src={src.body} alt="" style={bodyStyle(idle)} />

      {/* Руки + оружие */}
      <img src={src.armL} alt="" style={armStyle(idle, true)} />
      {src.weapon && <img src={src.weapon} alt="" style={weaponStyle()} />}
      <img src={src.armR} alt="" style={armStyle(idle, false)} />

      {/* Голова + шлем */}
      <img src={src.head} alt="" style={headStyle(idle)} />
      {src.helmet && <img src={src.helmet} alt="" style={helmetStyle()} />}

      <style>{keyframesCss}</style>
    </div>
  );
};

/** Ниже координаты/опорные точки — их можно подправить под твой арт */
const bodyStyle = (idle: boolean): React.CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: '42%',
  width: '42%',
  transform: 'translate(-50%, -50%)',
  transformOrigin: '50% 50%',
  animation: idle ? 'breath 3200ms ease-in-out infinite' : undefined,
});

const headStyle = (idle: boolean): React.CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: '18%',
  width: '30%',
  transform: 'translate(-50%, -50%)',
  transformOrigin: '50% 80%',
  animation: idle ? 'headFloat 2800ms ease-in-out infinite' : undefined,
});

const helmetStyle = (): React.CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: '18%',
  width: '30%',
  transform: 'translate(-50%, -50%)',
  transformOrigin: '50% 80%',
});

const armStyle = (idle: boolean, left: boolean): React.CSSProperties => ({
  position: 'absolute',
  left: left ? '38%' : '62%',
  top: '42%',
  width: '18%',
  transform: 'translate(-50%, -50%)',
  transformOrigin: left ? '80% 15%' : '20% 15%', // плечевой сустав
  animation: idle
    ? (left ? 'armSwingL 2400ms ease-in-out infinite' : 'armSwingR 2400ms ease-in-out infinite')
    : undefined,
});

const weaponStyle = (): React.CSSProperties => ({
  position: 'absolute',
  left: '66%',
  top: '46%',
  width: '22%',
  transform: 'translate(-50%, -50%)',
  transformOrigin: '10% 40%',
});

const legStyle = (idle: boolean, left: boolean): React.CSSProperties => ({
  position: 'absolute',
  left: left ? '45%' : '55%',
  top: '68%',
  width: '20%',
  transform: 'translate(-50%, -50%)',
  transformOrigin: '50% 10%', // тазобедренный сустав
  animation: idle
    ? (left ? 'legShiftL 2000ms ease-in-out infinite' : 'legShiftR 2000ms ease-in-out infinite')
    : undefined,
});

const keyframesCss = `
@keyframes breath {
  0% { transform: translate(-50%, -50%) scaleY(1); }
  50% { transform: translate(-50%, -50%) scaleY(0.985); }
  100% { transform: translate(-50%, -50%) scaleY(1); }
}
@keyframes headFloat {
  0% { transform: translate(-50%, -50%) }
  50% { transform: translate(-50%, calc(-50% - 4px)) }
  100% { transform: translate(-50%, -50%) }
}
@keyframes armSwingL {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(-6deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
@keyframes armSwingR {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(6deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
@keyframes legShiftL {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(3deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
@keyframes legShiftR {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(-3deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
`;
