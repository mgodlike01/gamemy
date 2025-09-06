import React, { useEffect, useMemo, useState } from "react";

type PartKey =
    | "body" | "head" | "armL" | "armR" | "legL" | "legR" | "helmet" | "weapon";

type Rect = { x: number; y: number; w: number; h: number; z: number };
type Layout = Record<PartKey, Rect>;

const PARTS: PartKey[] = ["body", "head", "armL", "armR", "legL", "legR", "weapon", "helmet"];

/**
 * Накладывается поверх контейнера героя (360x480 в твоих расчётах).
 * Управление:
 *  - 1..8  — выбрать слой (по порядку PARTS)
 *  - ← → ↑ ↓ — двигать (Shift = шаг 5)
 *  - [ ]   — изменить ширину (Shift = ±5)
 *  - ; '   — изменить высоту (Shift = ±5)
 *  - , .   — z-index (в пределах 0..9)
 *  - E     — экспорт JSON в консоль (скопируешь в HERO_LAYOUT_THRONE)
 *  - H     — подсказка в консоли
 */
export default function HeroLayoutCalibrator({
    layout,
    onApply,
}: {
    layout: Partial<Layout>;
    onApply?: (next: Partial<Layout>) => void;
}) {
    const [sel, setSel] = useState<PartKey>("body");
    const [state, setState] = useState<Partial<Layout>>(() => ({ ...layout }));

    useEffect(() => setState({ ...layout }), [layout]);

    const help = () => {
        // eslint-disable-next-line no-console
        console.log(
            `[Calibrator]
1..8 - select part
Arrows - move (Shift x5)
[ ] - width +/- 1 (Shift x5)
; ' - height +/- 1 (Shift x5)
, . - z-index +/- 1
E - export JSON
Current: ${sel}`
        );
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const step = e.shiftKey ? 5 : 1;
            const cur = { ...(state[sel] || { x: 30, y: 40, w: 30, h: 30, z: 3 }) };

            if (e.key >= "1" && e.key <= "8") {
                setSel(PARTS[Number(e.key) - 1]);
                e.preventDefault();
                return;
            }

            let changed = false;
            switch (e.key) {
                case "ArrowLeft": cur.x -= step; changed = true; break;
                case "ArrowRight": cur.x += step; changed = true; break;
                case "ArrowUp": cur.y -= step; changed = true; break;
                case "ArrowDown": cur.y += step; changed = true; break;
                case "[": cur.w -= step; changed = true; break;
                case "]": cur.w += step; changed = true; break;
                case ";": cur.h -= step; changed = true; break;
                case "'": cur.h += step; changed = true; break;
                case ",": cur.z = Math.max(0, cur.z - 1); changed = true; break;
                case ".": cur.z = Math.min(9, cur.z + 1); changed = true; break;
                case "e":
                case "E": {
                    const out: any = {};
                    for (const k of PARTS) {
                        const r = state[k];
                        if (r) {
                            out[k] = {
                                x: +r.x.toFixed(1), y: +r.y.toFixed(1),
                                w: +r.w.toFixed(1), h: +r.h.toFixed(1), z: r.z | 0
                            };
                        }
                    }
                    // eslint-disable-next-line no-console
                    console.log("=== HERO_LAYOUT_THRONE ===\n", out);
                    e.preventDefault();
                    return;
                }
                case "h":
                case "H":
                    help(); e.preventDefault(); return;
            }
            if (changed) {
                const next = { ...state, [sel]: cur };
                setState(next);
                onApply?.(next);
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", onKey);
        help();
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sel, state]);

    // Визуальная сетка и рамки слоёв
    const boxes = useMemo(() => {
        return PARTS.map((k) => {
            const r = state[k];
            if (!r) return null;
            const isSel = sel === k;
            return (
                <div key={k}
                    style={{
                        position: "absolute",
                        left: `${r.x}%`,
                        top: `${r.y}%`,
                        width: `${r.w}%`,
                        height: `${r.h}%`,
                        border: `2px ${isSel ? "solid #48ffa7" : "dashed rgba(83,179,255,.6)"}`,
                        boxShadow: isSel ? "0 0 14px rgba(72,255,167,.45)" : "none",
                        zIndex: 99,
                        pointerEvents: "none",
                    }}
                    title={`${k}`}
                />
            );
        });
    }, [state, sel]);

    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 98, pointerEvents: "none" }}>
            {/* сетка 10x10 */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background:
                    "linear-gradient(rgba(0,255,0,.10) 1px, transparent 1px) 0 0/100% 10%,"
                    + "linear-gradient(90deg, rgba(0,255,0,.10) 1px, transparent 1px) 0 0/10% 100%",
            }} />
            {boxes}
            <div style={{
                position: "absolute", left: 8, bottom: 8, fontSize: 12, opacity: .8,
                background: "rgba(0,0,0,.45)", padding: "4px 6px", borderRadius: 6
            }}>
                Calibrator: [{sel}] — 1..8 select, arrows move, [ ] width, ; ' height, , . z, E export
            </div>
        </div>
    );
}
