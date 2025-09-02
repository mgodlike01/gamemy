import React from "react";

type HeroParts = {
  body?: string;
  head?: string;
  armL?: string;
  armR?: string;
  legL?: string;
  legR?: string;
  helmet?: string;
  weapon?: string;
};

type PartsProp = React.ReactNode | (() => React.ReactNode);

interface EnemyState {
    hit?: boolean;
    dead?: boolean;
}

type PartRect = {
  /** проценты от бокса героя */
  x: number; // left%
  y: number; // top%
  w: number; // width%
  h: number; // height%
  z?: number; // z-index
};

type HeroLayout = Partial<Record<keyof HeroParts, PartRect>>;

type Props = {
  bg: string;
  fg?: string;

  armsWave?: boolean;          // включить/выключить
  armSwingDeg?: number;        // амплитуда поворота в градусах (по умолчанию 10)
  armLiftPx?: number;          // вертикальный подъём/опускание, px (по умолчанию 4)
  armWaveMs?: number;          // длительность цикла, мс (по умолчанию 1400)
    /** 🔥 Новый проп: «отдаление» фона. 1 = как есть. <1 — отдаляем, >1 — приближаем */
    bgScale?: number;
    /** Сдвиги фона по осям (тонкая подгонка) */
    bgOffsetX?: number;
    bgOffsetY?: number;
    /** смещение героя (px) */
    heroOffsetX?: number;
    heroOffsetY?: number; // вверх — положительное значение
    /** отзеркалить героя по X */
    heroFlip?: boolean;
    style?: React.CSSProperties;
    heroStyle?: React.CSSProperties;
  /** фолбэк — целиковый PNG героя */
  hero?: string;

  /** набор частей героя */
  heroParts?: HeroParts;
  /** доп. масштаб, 1 = 100% */
  heroScale?: number;

  /** переопределение дефолтной раскладки (в процентах) */
  heroLayout?: HeroLayout;

  /** подсетка для калибровки */
  debugGrid?: boolean;

  /** высота сцены */
  height?: string | number;

  /** UI-слоты */
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;

  /** где стоит герой относительно низа (в %) */
  heroBottomPct?: number;

  /** “дыхание/покачивание” */
  heroIdle?: boolean;
  floatAmplitudePx?: number;
  floatDurationMs?: number;
  breathScale?: number;
  breathDurationMs?: number;

  /** выравнивание вертикальных колонок слева/справа */
  sideAlign?: "middle" | "top";
  sideLiftPx?: number;

    backlineSrc?: string;
    backlineScale?: number;        // множитель размера от сеточной ширины героя
    backlineBottomPct?: number;    // посадка от нижнего края сцены, в %
    backlineOffsetX?: number;      // сдвиг по X (px), вправо — положительный
    backlineOffsetY?: number;      // сдвиг по Y (px), вверх — положительный
    backlineFlip?: boolean;        // зеркалирование по X
    backlineStyle?: React.CSSProperties;

  /** нижний ряд кнопок */
  bottomRow?: React.ReactNode[];
  bottomLiftPx?: number;

  /** отступ сверху (учёт шапки Телеграма/вырезов) */
  topOffsetPx?: number;

  /** отладка рамки героя */
    debugHeroBox?: boolean;
    /** Враг */
    enemyParts?: PartsProp | HeroParts;
    enemyScale?: number;
    enemyBottomPct?: number;
    enemyOffsetX?: number;
    enemyOffsetY?: number;
    enemyFlip?: boolean;
    enemyStyle?: React.CSSProperties;
    enemyState?: EnemyState;
    enemyFx?: {
        dust?: boolean;    // показать облако пыли над врагом (смерть)
        portal?: boolean;  // показать портал появления (до спавна)
    };
};

const HERO_RATIO = 1.05;

/** Дефолтные прямоугольники слоёв (в процентах) — уже подогнано под ваши арты */
const HERO_LAYOUT_DEFAULT: HeroLayout = {
  // тело уже и чуть выше
  body:  { x: 31, y: 36, w: 38, h: 54, z: 3 },
  // голова крупнее и выше
  head:  { x: 34.9, y: 10.3, w: 34, h: 34, z: 5 },

  // руки ближе к корпусу
  armL:  { x: 24, y: 41.5, w: 23, h: 33, z: 4 },
  armR:  { x: 51, y: 43.7, w: 24, h: 30, z: 2 },

  // ноги уже и ниже
  legL:  { x: 25, y: 72, w: 26, h: 26, z: 2 },
  legR:  { x: 48, y: 72, w: 26, h: 26, z: 2 },

  // резерв под шлем/оружие (если появятся)
  helmet:{ x: 38, y: 12, w: 26, h: 18, z: 6 },
  weapon:{ x: 12, y: 38, w: 20, h: 36, z: 6 },
};



// Вставляем keyframes один раз
let __fxInjected = false;
function ensureEnemyFxKeyframes() {
    if (__fxInjected) return;
    __fxInjected = true;
    const css = `
@keyframes enemyHitTint {
  0%   { opacity: 0; }
  30%  { opacity: .65; }
  100% { opacity: 0; }
}
@keyframes enemyHitFlash {
  0% { opacity: 0.0; }
  10% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes dustPoof {
  0%   { transform: translateX(-50%) scale(0.85); opacity: 0; }
  20%  { opacity: 0.95; }
  100% { transform: translateX(-50%) scale(1.35); opacity: 0; }
}
@keyframes portalPulse {
  0%   { transform: translateX(-50%) scale(0.85); filter: brightness(0.9); }
  50%  { transform: translateX(-50%) scale(1.0);  filter: brightness(1.2); }
  100% { transform: translateX(-50%) scale(0.85); filter: brightness(0.9); }
}`


        ;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
}


function isHeroParts(x: any): x is HeroParts {
    return (
        x &&
        typeof x === "object" &&
        ("body" in x ||
            "head" in x ||
            "armL" in x ||
            "armR" in x ||
            "legL" in x ||
            "legR" in x ||
            "helmet" in x ||
            "weapon" in x)
    );
}

export function DungeonScene({

  bg,
  fg,
  hero,
  heroParts,
  heroLayout,

  height = "100%",
  heroScale = 1,

  topLeft,
  topRight,
  left,
  right,
  bottom,
    bgScale = 1,
    bgOffsetX = 0,
    bgOffsetY = 0,
    style,
    heroStyle = {},
  heroBottomPct = 18,

  heroIdle = true,
  floatAmplitudePx = 6,
  floatDurationMs = 2800,
  breathScale = 0.985,
  breathDurationMs = 3200,

  sideAlign = "middle",
  sideLiftPx = 64,

  bottomRow,
  bottomLiftPx = 32,

  topOffsetPx = 0,

  debugHeroBox = false,
  debugGrid = false,


  armsWave = true,
  armSwingDeg = 10,
  armLiftPx = 4,
  armWaveMs = 1400,

    heroOffsetX = 0,
    heroOffsetY = 0,
    heroFlip = false,


    backlineSrc,
    backlineScale = 1,
    backlineBottomPct = 18,
    backlineOffsetX = 0,
    backlineOffsetY = 0,
    backlineFlip = false,
    backlineStyle,

    enemyParts,
    enemyScale = 1,
    enemyBottomPct = 18,
    enemyOffsetX = 20,   // правее центра
    enemyOffsetY = 0,
    enemyFlip = false,     // смотрит на героя
    enemyStyle,
    enemyState,
    enemyFx,
}: Props) {
    ensureEnemyFxKeyframes();
  const layout = { ...HERO_LAYOUT_DEFAULT, ...(heroLayout || {}) };

  const topPad = Math.max(0, Math.floor(topOffsetPx));

  // Респонсивная ширина героя + явная высота по соотношению
  const [heroW, setHeroW] = React.useState<number>(calcHeroW());
  function calcHeroW() {
    const vw = Math.max(320, window.innerWidth || 360);
    const vh = Math.max(480, window.innerHeight || 640);
    const w1 = vw * 1.20;  // ширина относительно экрана
    const w2 = vh * 1.12;  // высота относительно экрана
    const w3 = 560;        // верхний предел
    return Math.min(w1, w2, w3);
  }
  React.useEffect(() => {
    const onResize = () => setHeroW(calcHeroW());
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const hasParts =
    heroParts &&
    (heroParts.body ||
      heroParts.head ||
      heroParts.armL ||
      heroParts.armR ||
      heroParts.legL ||
      heroParts.legR ||
      heroParts.helmet ||
      heroParts.weapon);

    const enemyHitFilter = enemyState?.hit
        ? "brightness(0.7) sepia(1) hue-rotate(-10deg) saturate(4)"
        : "none";

  return (
    <div
          style={{ position: "absolute", inset: 0, height, overflow: "hidden", ...style }}>
    
      {/* BACKGROUND */}
      <img
        src={bg}
        alt=""
              style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `calc(100% / ${bgScale || 1})`,
                  height: `calc(100% / ${bgScale || 1})`,
                  objectFit: "cover",
                  transform: `translate(calc(-50% + ${bgOffsetX}px), calc(-50% + ${bgOffsetY}px)) scale(${bgScale})`,
                  transformOrigin: "center",
                  zIndex: 0,
                  pointerEvents: "none",
                  userSelect: "none",
              }}
      />


          {/* BACKLINE — отряд помощников, стоит позади героя */}
          {backlineSrc && (
              <div
                  style={{
                      position: "absolute",
                      left: "50%",
                      bottom: `${backlineBottomPct}%`,
                      transform: `translate(calc(-50% + ${backlineOffsetX}px), ${-backlineOffsetY}px) ${backlineFlip ? "scaleX(-1)" : ""}`,
                      transformOrigin: "50% 100%",
                      zIndex: 1, // bg:0, backline:1, hero:2.., fg:5
                      width: heroW * backlineScale,
                      height: heroW * backlineScale * HERO_RATIO,
                      pointerEvents: "none",
                      ...(backlineStyle || {}),
                  }}
              >
                  <img
                      src={backlineSrc}
                      alt=""
                      style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          imageRendering: "auto",
                      }}
                  />
              </div>
          )}

      {/* HERO */}
      {(hero || hasParts) && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: `${heroBottomPct}%`,
            transform: `translate(calc(-50% + ${heroOffsetX}px), ${-heroOffsetY}px) ${heroFlip ? 'scaleX(-1)' : ''}`,
            transformOrigin: "50% 100%",
            zIndex: 2,
            width: heroW * heroScale,
            height: heroW * heroScale * HERO_RATIO,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            outline: debugHeroBox ? "1px dashed rgba(255,0,0,.6)" : "none",
                      outlineOffset: 2,
                      ...heroStyle, 
          
          }}
        >
          <div
            className={heroIdle ? "hero-idle-wrap" : undefined}
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            {!hasParts && hero && (
              <img
                src={hero}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 6px 18px rgba(0,0,0,.45))",
                  imageRendering: "auto",
                    display: "block",

                }}
              />
            )}

            {hasParts && (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  filter: "drop-shadow(0 6px 18px rgba(0,0,0,.45))",
                }}
              >
                {debugGrid && <GridOverlay />}

                {/* порядок слоёв */}
                {heroParts.legL && <Part src={heroParts.legL} rect={layout.legL} defaultZ={2} />}
                {heroParts.legR && <Part src={heroParts.legR} rect={layout.legR} defaultZ={2} />}

                {heroParts.body && <Part src={heroParts.body} rect={layout.body} defaultZ={3} />}

{heroParts.armL && (
  <Part
    src={heroParts.armL}
    rect={layout.armL}
    defaultZ={4}
    extraStyle={{
      transformOrigin: "20% 10%",
      // инлайн-анимация – работает даже если классы не применились
      animation: armsWave ? `armWaveLeft ${armWaveMs}ms ease-in-out infinite` : undefined,
      willChange: armsWave ? 'transform' : undefined,
    }}
  />
)}
{heroParts.armR && (
  <Part
    src={heroParts.armR}
    rect={layout.armR}
    defaultZ={4}
    extraStyle={{
      transformOrigin: "80% 10%",
      animation: armsWave ? `armWaveRight ${armWaveMs}ms ease-in-out infinite ${armWaveMs/2}ms` : undefined,
      willChange: armsWave ? 'transform' : undefined,
    }}
  />
)}

                {heroParts.head && <Part src={heroParts.head} rect={layout.head} defaultZ={5} />}

                {heroParts.helmet && <Part src={heroParts.helmet} rect={layout.helmet} defaultZ={6} />}
                {heroParts.weapon && <Part src={heroParts.weapon} rect={layout.weapon} defaultZ={6} />}
              </div>
            )}
          </div>

          {/* лёгкая “idle”-анимация (можно отключить heroIdle=false) */}
          <style>{`
            @keyframes heroFloat {
              0%   { transform: translate(-50%, 0) }
              50%  { transform: translate(-50%, -${floatAmplitudePx}px) }
              100% { transform: translate(-50%, 0) }
            }
            @keyframes heroBreath {
              0%   { transform: scaleY(1) }
              50%  { transform: scaleY(${breathScale}) }
              100% { transform: scaleY(1) }
            }
            .hero-idle-wrap {
              transform: translate(-50%, 0);
              transform-origin: 50% 100%;
              animation:
                heroFloat ${floatDurationMs}ms ease-in-out infinite,
                heroBreath ${breathDurationMs}ms ease-in-out infinite;
              will-change: transform;
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-idle-wrap { animation: none !important; }
            }
          `}</style>

          <style>{`
  @keyframes armWaveLeft {
    0%   { transform: translateY(0) rotate(0deg); }
    50%  { transform: translateY(-${armLiftPx}px) rotate(-${armSwingDeg}deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
  @keyframes armWaveRight {
    0%   { transform: translateY(0) rotate(0deg); }
    50%  { transform: translateY(-${armLiftPx}px) rotate(${armSwingDeg}deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
  .armL-anim {
    will-change: transform;
    animation: armWaveLeft ${armWaveMs}ms ease-in-out infinite;
  }
  .armR-anim {
    will-change: transform;
    animation: armWaveRight ${armWaveMs}ms ease-in-out infinite;
    animation-delay: ${armWaveMs / 2}ms; /* асинхронно для естественности */
  }
  @media (prefers-reduced-motion: reduce) {
    .armL-anim, .armR-anim { animation: none !important; }
  }
`}</style>
        </div>
          )}
          {/* ENEMY */}
          {enemyParts && (
              <div
                  style={{
                      position: "absolute",
                      left: "50%",
                      bottom: `${enemyBottomPct}%`,
                      transform: `translate(calc(${enemyOffsetX}px), ${-enemyOffsetY}px) ${enemyFlip ? "scaleX(-1)" : ""}`,
                      transformOrigin: "50% 100%",
                      zIndex: 52,
                      width: heroW * enemyScale,               // используем ту же «рамку», что и у героя
                      height: heroW * enemyScale * HERO_RATIO,
                      //display: "grid",
                      //placeItems: "center",
                      pointerEvents: "none",
                      ...(enemyStyle || {}),

                  }}
              >
                  <div
                      style={{
                          position: "relative",          // 👈 важно
                          isolation: "isolate",          // 👈 ограничивает blend внутри
                          width: "100%",
                          height: "100%",
                          transform: "none",
                          filter: enemyState?.dead ? "grayscale(1) brightness(0.75)" : "none",
                          opacity: enemyState?.dead ? 0.9 : 1,
                          transition: "filter 180ms ease, opacity 180ms ease",
                      }}
                  >
                      {typeof enemyParts === "function"
                                 ? (enemyParts as () => React.ReactNode)()
                              : isHeroParts(enemyParts)
                                  ? (
                                          <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                                {debugGrid && <GridOverlay />}
                                                {/* порядок слоёв — ТОЧНО как у героя */}
                                      {enemyParts.legL && (
                                          <Part src={enemyParts.legL} rect={layout.legL} defaultZ={2}
                                              extraStyle={{ filter: enemyHitFilter }} />
                                      )}
                                      {enemyParts.legR && (
                                          <Part src={enemyParts.legR} rect={layout.legR} defaultZ={2}
                                              extraStyle={{ filter: enemyHitFilter }} />
                                      )}
                                      {enemyParts.body && (
                                          <Part src={enemyParts.body} rect={layout.body} defaultZ={3}
                                              extraStyle={{ filter: enemyHitFilter }} />
                                      )}
                                                {enemyParts.armL && (
                                                      <Part
                                                    src={enemyParts.armL}
                                                    rect={layout.armL}
                                                    defaultZ={4}
                                                    extraStyle={{
                                                    transformOrigin: "20% 10%",
                                                     animation: armsWave ? `armWaveLeft ${armWaveMs}ms ease-in-out infinite` : undefined,
                                                        willChange: armsWave ? "transform" : undefined,
                                                        filter: enemyHitFilter,
                                                    }}
                                            />
                                        )}
                                               {enemyParts.armR && (
                                                      <Part
                                                    src={enemyParts.armR}
                                                    rect={layout.armR}
                                                    defaultZ={4}
                                                    extraStyle={{
                                                    transformOrigin: "80% 10%",
                                                      animation: armsWave ? `armWaveRight ${armWaveMs}ms ease-in-out infinite ${armWaveMs / 2}ms` : undefined,
                                                        willChange: armsWave ? "transform" : undefined,
                                                        filter: enemyHitFilter,
                                                        }}
                                                />
                                                    )}
                                      {enemyParts.head && (
                                          <Part src={enemyParts.head} rect={layout.head} defaultZ={5}
                                              extraStyle={{ filter: enemyHitFilter }} />
                                      )}
                                      {enemyParts.helmet && (
                                          <Part src={enemyParts.helmet} rect={layout.helmet} defaultZ={6}
                                              extraStyle={{ filter: enemyHitFilter }} />
                                      )}
                                      {enemyParts.weapon && (
                                          <Part src={enemyParts.weapon} rect={layout.weapon} defaultZ={6}
                                              extraStyle={{ filter: enemyHitFilter }} />
                                      )}
                                              </div>
                                        )
                              : enemyParts}

                      
                      {/* Облако пыли (смерть) */}
                      {enemyFx?.dust && (
                          <img
                              src="/fx/dust_poof.png"   // положи картинку в public/fx/
                              alt=""
                              style={{
                                  position: "absolute",
                                  left: "50%",
                                  bottom: "1%",
                                  transform: "translateX(-50%)",
                                  width: "160%",
                                  height: "auto",
                                  opacity: 0.95,
                                  animation: "dustPoof 520ms ease-out forwards",
                                  pointerEvents: "none",
                                  zIndex: 5,
                              }}
                          />
                      )}

                      {/* Портал появления */}
                      {enemyFx?.portal && (
                          <img
                              src="/fx/portal.png"     // положи картинку в public/fx/
                              alt=""
                              style={{
                                  position: "absolute",
                                  left: "50%",
                                  bottom: "0%",
                                  transform: "translateX(-50%)",
                                  width: "140%",
                                  height: "auto",
                                  opacity: 0.9,
                                  animation: "portalPulse 480ms ease-in-out infinite",
                                  pointerEvents: "none",
                                  mixBlendMode: "screen",
                              }}
                          />
                      )}

                  </div>
              </div>

          )}
          


      {/* FOREGROUND */}
      {fg && (
        <img
          src={fg}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "1px",
            height: "1px",
            objectFit: "cover",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}

      {/* UI слой */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        {topLeft && (
          <div style={{ position: "absolute", left: 12, top: -4 + topPad, pointerEvents: "auto" }}>
            {topLeft}
          </div>
        )}

        {topRight && (
          <div style={{ position: "absolute", right: 12, top: 12 + topPad, pointerEvents: "auto" }}>
            {topRight}
          </div>
        )}

        {left && (
          <div
            style={{
              position: "absolute",
              left: 10,
              ...(sideAlign === "middle"
                ? { top: `calc(55% - ${sideLiftPx}px)`, transform: "translateY(-50%)" }
                : { top: 12 + topPad }),
              display: "grid",
              gap: 16,
              pointerEvents: "auto",
            }}
          >
            {left}
          </div>
        )}

        {right && (
          <div
            style={{
              position: "absolute",
              right: 10,
              ...(sideAlign === "middle"
                ? { top: `calc(55% - ${sideLiftPx}px)`, transform: "translateY(-50%)" }
                : { top: 12 + topPad }),
              display: "grid",
              gap: 16,
              pointerEvents: "auto",
            }}
          >
            {right}
          </div>
        )}

        {Array.isArray(bottomRow) && bottomRow.length > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomLiftPx}px)`,
              pointerEvents: "auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: "0 8px",
            }}
          >
            {bottomRow.map((node, i) => (
              <div key={i} style={{ flex: 1, display: "grid", placeItems: "end center" }}>
                {node}
              </div>
            ))}
          </div>
        ) : (
          bottom && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomLiftPx}px)`,
                padding: "0 12px",
                pointerEvents: "auto",
              }}
            >
              {bottom}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/** один слой по прямоугольнику в процентах */
function Part({
  src,
  rect,
  defaultZ = 1,
  className,
  extraStyle,
}: {
  src: string;
  rect?: PartRect;
  defaultZ?: number;
  className?: string;
  extraStyle?: React.CSSProperties;
}) {
  const r: PartRect = rect || { x: 0, y: 0, w: 100, h: 100, z: defaultZ };
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{
        position: "absolute",
        left: `${r.x}%`,
        top: `${r.y}%`,
        width: `${r.w}%`,
        height: `${r.h}%`,
        objectFit: "contain",
        imageRendering: "auto",
        zIndex: r.z ?? defaultZ,
        pointerEvents: "none",
        display: "block",
        ...extraStyle,
      }}
    />
  );
}


/** прозрачная сетка 10×10 — удобно подгонять координаты */
function GridOverlay() {
  const cells = Array.from({ length: 10 * 10 });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 99,
        pointerEvents: "none",
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
        gridTemplateRows: "repeat(10, 1fr)",
        opacity: 0.25,
      }}
    >
      {cells.map((_, i) => (
        <div
          key={i}
          style={{
            border: "1px dashed #fff",
            background: "transparent",
          }}
        />
      ))}
    </div>
  );
}
