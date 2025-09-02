import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

type Props = {
    onClose: () => void;
    children: React.ReactNode;
    /** длительность анимации (мс) */
    durationMs?: number;
    /** координаты центра анимации (например, из аватара) */
    origin?: { x: number; y: number } | undefined;
    /** прозрачность фона 0..1 */
    backdropOpacity?: number;
};

export default function ProfileModal({
    onClose,
    children,
    durationMs = 300,
    origin,
    backdropOpacity = 0.55,
}: Props) {
    const [hiding, setHiding] = useState(false);
    const scrollYRef = useRef(0);

    // Лочим скролл body и запоминаем позицию
    useEffect(() => {
        scrollYRef.current = window.scrollY || window.pageYOffset || 0;
        const body = document.body;
        body.style.position = "fixed";
        body.style.top = `-${scrollYRef.current}px`;
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
        body.style.overflow = "hidden";
        return () => {
            const y = scrollYRef.current;
            body.style.position = "";
            body.style.top = "";
            body.style.left = "";
            body.style.right = "";
            body.style.width = "";
            body.style.overflow = "";
            window.scrollTo(0, y);
        };
    }, []);

    // ESC закрывает
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && startHide();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const startHide = () => {
        if (hiding) return;
        setHiding(true);
        window.setTimeout(onClose, durationMs); // дать доиграть анимацию
    };

    // клики внутри карточки не должны закрывать модалку и не всплывать
    const stopInside = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return ReactDOM.createPortal(
        <div
            // КЛИК ПО ФОНУ — закрыть модалку
            onClick={() => startHide()}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                display: "grid",
                placeItems: "center",
                background: `rgba(0,0,0,${backdropOpacity})`,
                padding: 18,
                animation: `${hiding ? "overlayOut" : "overlayIn"} ${durationMs}ms ease forwards`,
                pointerEvents: "auto",
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                // внутри карточки клики останавливаем
                onClick={stopInside}
                onMouseDown={stopInside}
                onTouchStart={stopInside}
                style={{
                    width: "min(520px, 82vw)",
                    maxHeight: "min(80vh, 700px)",
                    overflowY: "auto",
                    borderRadius: 16,
                    background: "rgba(111, 101, 30, .35)",  // светлая карточка — не сливается с фоном игры
                    color: "#222",
                    padding: 20,
                    boxShadow: "0 12px 40px rgba(0,0,0,.35)",
                    transformOrigin: origin ? `${origin.x}px ${origin.y}px` : "center center",
                    animation: `${hiding ? "cardOut" : "cardIn"} ${durationMs}ms cubic-bezier(.18,.9,.22,1) forwards`,
                }}
            >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            startHide();
                        }}
                        aria-label="Закрыть"
                        style={{
                            border: 0,
                            background: "transparent",
                            color: "#fff",
                            fontSize: 22,
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div>{children}</div>
            </div>

            <style>{`
        @keyframes overlayIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes overlayOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes cardIn  { 0% { opacity: 0; transform: scale(.6) } 100% { opacity: 1; transform: scale(1) } }
        @keyframes cardOut { 0% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(.6) } }
      `}</style>
        </div>,
        document.body
    );
}
