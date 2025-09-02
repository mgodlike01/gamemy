import React from "react";

export function PageTransitionOverlay() {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.88)",
                zIndex: 99999,
                pointerEvents: "none",
                animation: "fadeInOutOverlay 600ms ease",
            }}
        >
            {/* можно добавить логотип/иконку тут */}
            <style>
                {`
          @keyframes fadeInOutOverlay {
            0%   { opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 1; }
            100% { opacity: 0; }
          }
        `}
            </style>
        </div>
    );
}
