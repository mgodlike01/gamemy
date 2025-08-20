import React, { useMemo } from "react";
import { useProfile } from "../shared/useProfile";

/**
 * Герой, вынесенный из Home.
 * Рисует спрайт из набора слоёв (как в Home), чтобы можно было переиспользовать на /mine.
 * Ассеты берутся из /hero_parts/... (см. Home.tsx). fileciteturn22file0
 */
export function Hero({ scale = 1.15, width = 220, height = 360 }: { scale?: number; width?: number; height?: number }) {
    const { profile } = useProfile();

    // Берём гендер из профиля так же, как на Home
    const useFemale = (profile?.gender ?? (profile as any)?.hero?.gender) === "female";

    // Наборы слоёв — те же пути, что используются на Home
    const rigMale = useMemo(
        () => ({
            body: "/hero_parts/male/body.png",
            head: "/hero_parts/male/head.png",
            armL: "/hero_parts/male/arm_left.png",
            armR: "/hero_parts/male/arm_right.png",
            legL: "/hero_parts/male/leg_left.png",
            legR: "/hero_parts/male/leg_right.png",
        }),
        []
    );
    const rigFemale = useMemo(
        () => ({
            body: "/hero_parts/female/body.png",
            head: "/hero_parts/female/head.png",
            armL: "/hero_parts/female/arm_left.png",
            armR: "/hero_parts/female/arm_right.png",
            legL: "/hero_parts/female/leg_left.png",
            legR: "/hero_parts/female/leg_right.png",
        }),
        []
    );

    const parts = useFemale ? rigFemale : rigMale;

    const W = Math.round(width * scale);
    const H = Math.round(height * scale);

    return (
        <div
            style={{
                position: "relative",
                width: W,
                height: H,
                pointerEvents: "none",
                userSelect: "none",
            }}
            aria-label="hero"
        >
            {/* порядок слоёв: ноги → тело → руки → голова */}
            <img src={parts.legL} alt="legL" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            <img src={parts.legR} alt="legR" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            <img src={parts.body} alt="body" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            <img src={parts.armL} alt="armL" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            <img src={parts.armR} alt="armR" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            <img src={parts.head} alt="head" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
    );
}
