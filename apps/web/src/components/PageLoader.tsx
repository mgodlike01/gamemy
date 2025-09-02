// src/components/PageLoader.tsx
import React from "react";

export function PageLoader() {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)", // полупрозрачный фон
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    border: "4px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }}
            />
            <style>
                {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
}
