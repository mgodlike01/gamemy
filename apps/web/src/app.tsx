import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// ленивые страницы (оставь как у тебя)
const Home = React.lazy(() => import("./pages/Home"));
const Mine = React.lazy(() => import("./pages/Mine"));
const Raids = React.lazy(() => import("./pages/Raids"));


/* -------------------- мини-хук для перехода -------------------- */
function usePageTransition(duration = 1500) {
    const location = useLocation();
    const [active, setActive] = React.useState(false);
    const first = React.useRef(true);

    React.useEffect(() => {
        // пропускаем первый рендер (старт игры)
        if (first.current) {
            first.current = false;
            return;
        }
        setActive(true);

        const t1 = window.setTimeout(() => setActive(false), duration);
        const t2 = window.setTimeout(() => setActive(false), Math.max(duration, 2000)); // страховка
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [location.key]); // срабатывает на каждый реальный переход

    return active;
}

/* -------------------- оверлей перехода -------------------- */
function TransitionOverlay() {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                pointerEvents: "none",
                backdropFilter: "blur(2px)", // мягкое размытие того, что под оверлеем
                WebkitBackdropFilter: "blur(2px)",
                animation: "overlayFade 700ms ease both",
            }}
        >
            {/* затемнение (радиальный градиент даёт “туннельный” эффект) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.92) 100%)",
                    animation: "veil 700ms ease both",
                }}
            />

            {/* логотип/название игры */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "grid",
                    placeItems: "center",
                    gap: 8,
                    color: "#fff",
                    textAlign: "center",
                    animation: "brandPop 620ms ease-out both",
                }}
            >
                <img src={"../icons/load.png"} alt="" style={{ width: 200, height: 200, objectFit: 'contain' }} />
                {/* если есть svg/картинка логотипа — подставь <img src="/logo.svg" ... /> */}
                <div
                    style={{
                        fontWeight: 800,
                        letterSpacing: 1,
                        fontSize: 20,
                        textTransform: "uppercase",
                        textShadow: "0 2px 12px rgba(0,0,0,.6)",
                    }}
                >
                    
                    Загрузка...
                </div>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        border: "3px solid rgba(255,255,255,.35)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 900ms linear infinite",
                        opacity: 0.9,
                    }}
                />
            </div>

            {/* keyframes — встраиваем здесь, чтобы не плодить файлы */}
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* общее затухание контейнера (на всякий случай) */
        @keyframes overlayFade {
          0% { opacity: 0 }
          15% { opacity: 1 }
          85% { opacity: 1 }
          100% { opacity: 0 }
        }

        /* затемнение */
        @keyframes veil {
          0% { opacity: 0 }
          15% { opacity: 1 }
          85% { opacity: 1 }
          100% { opacity: 0 }
        }

        /* появление "бренда": лёгкий zoom + fade */
        @keyframes brandPop {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(.96) }
          25%  { opacity: 1; transform: translate(-50%,-50%) scale(1.02) }
          75%  { opacity: 1; transform: translate(-50%,-50%) scale(1.00) }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(.98) }
        }
      `}</style>
        </div>
    );
}

/* -------------------- сам App -------------------- */
export default function App() {
    const transitionActive = usePageTransition(700); // длительность перехода (мс)

    return (
        <>
            {/* важный момент: чтобы не выскакивал чужой фолбэк — даём null */}
            <React.Suspense fallback={null}>
                <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/mine" element={<Mine />} />
                    <Route path="/raids" element={<Raids />} />
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </React.Suspense>

            {/* Оверлей поверх всего — только на переходе (кроме первого рендера) */}
            {transitionActive && <TransitionOverlay />}
        </>
    );
}
