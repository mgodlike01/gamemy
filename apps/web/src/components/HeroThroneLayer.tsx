import React from "react";

/** Конфиг позиций. Подбирается 1 раз под твои PNG. */
export type HeroThroneConfig = {
    /** размер условного контейнера героя (можно не трогать) */
    boxWidth?: number;
    boxHeight?: number;
    /** позиций слоёв — x,y внутри контейнера */
    head: [number, number];
    torso: [number, number];
    armL: [number, number];
    armR: [number, number];
    legL: [number, number];
    legR: [number, number];
    sword?: [number, number];
    shadow?: [number, number];
};

export type HeroThroneParts = {
    head: string; torso: string; armL: string; armR: string; legL: string; legR: string;
    sword?: string; shadow?: string;
};

export function HeroThroneLayer(props: {
    parts: HeroThroneParts;
    /** позиционирование всего героя относительно сцены */
    leftPct?: number;          // 0..100 — по центру по умолчанию
    bottomPct?: number;        // насколько поднять от низа сцены
    scale?: number;            // масштаб героя
    offsetX?: number;          // мелкая подстройка по X в px
    offsetY?: number;          // мелкая подстройка по Y в px
    zIndex?: number;
    config: HeroThroneConfig;
}) {
    const {
        parts, leftPct = 50, bottomPct = 18, scale = 1, offsetX = 0, offsetY = 0, zIndex = 8,
        config,
    } = props;

    const BW = config.boxWidth ?? 360;     // ширина условного контейнера героя
    const BH = config.boxHeight ?? 480;    // высота

    const box: React.CSSProperties = {
        position: "absolute",
        left: `${leftPct}%`,
        bottom: `${bottomPct}%`,
        transform: `translate(-50%, ${offsetY}px) translateX(${offsetX}px) scale(${scale})`,
        transformOrigin: "50% 100%",
        width: BW,
        height: BH,
        zIndex,
        pointerEvents: "none",
    };

    const p = (xy: [number, number]): React.CSSProperties => ({
        position: "absolute", left: xy[0], top: xy[1], imageRendering: "auto",
    });

    return (
        <div style={box}>
            {/* порядок слоёв: ноги → тень → торс → правая рука → меч → левая рука → голова */}
            <img src={parts.legL} alt="" style={{ ...p(config.legL), zIndex: 1 }} />
            <img src={parts.legR} alt="" style={{ ...p(config.legR), zIndex: 2 }} />

            {parts.shadow && <img src={parts.shadow} alt="" style={{ ...p(config.shadow!), zIndex: 3, opacity: .95 }} />}

            <img src={parts.torso} alt="" style={{ ...p(config.torso), zIndex: 4 }} />
            <img src={parts.armR} alt="" style={{ ...p(config.armR), zIndex: 5 }} />
            {parts.sword && <img src={parts.sword} alt="" style={{ ...p(config.sword!), zIndex: 6 }} />}
            <img src={parts.armL} alt="" style={{ ...p(config.armL), zIndex: 7 }} />
            <img src={parts.head} alt="" style={{ ...p(config.head), zIndex: 8 }} />
        </div>
    );
}
