import React, { useEffect } from "react";
import ReactDOM from "react-dom";

type Props = {
    onClose: () => void;
    children: React.ReactNode;
};

export default function ProfileModal({ onClose, children }: Props) {
    // Закрытие по ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const modal = (
        <div
            // Оверлей «выше всех»
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: "90vh",
                    overflow: "auto",
                    background: "rgba(69,30,30,0.55)",
                    color: "var(--tg-theme-text-color, #111)",
                    borderRadius: 16,
                    boxShadow: "0 12px 40px rgba(0,0,0,.25)",
                    padding: 16,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Кнопка закрытия */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            fontSize: 20,
                            lineHeight: 1,
                            cursor: "pointer",
                        }}
                        aria-label="Close"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );

    const root = document.body;
    return ReactDOM.createPortal(modal, root);
}
