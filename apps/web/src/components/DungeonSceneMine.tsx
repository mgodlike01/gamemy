import React from "react";

export type HeroRig = {
    body: string;
    head: string;
    armL: string;
    armR: string;
    legL: string;
    legR: string;
};

type Props = {
    bg: string;
    heroParts: HeroRig;

    /** ������ ����� ������������ �������� (220x360) */
    heroScale?: number;          // default 1.0
    /** ��������� ������ �� ���� ����� ��������� ����� (� ���������) */
    heroBottomPct?: number;      // default 28
    /** �������������� ������������ ����� */
    sideAlign?: "left" | "middle" | "right"; // default "middle"
    /** �������������� ����� ����� (px), ���� ����� �� �� ������ */
    sideLiftPx?: number;         // default 0

    /** ˸���� �������� ��� (�������) */
    armsWave?: boolean;          // default false
    armSwingDeg?: number;        // default 2
    armLiftPx?: number;          // default 1
    armWaveMs?: number;          // default 2500

    /** ����� ����� ���� (px) � ����� ��������� ������ ����� ������� */
    bgOffsetX?: number;          // default 0
    bgOffsetY?: number;          // default 0

    style?: React.CSSProperties; // ����� ���������� �����
};

export default function DungeonSceneMine({
    bg,
    heroParts,
    heroScale = 1.0,
    heroBottomPct = 28,
    sideAlign = "middle",
    sideLiftPx = 0,

    armsWave = false,
    armSwingDeg = 2,
    armLiftPx = 1,
    armWaveMs = 2500,

    bgOffsetX = 0,
    bgOffsetY = 0,

    style,
}: Props) {
    const BASE_W = 220;
    const BASE_H = 360;
    const W = Math.round(BASE_W * heroScale);
    const H = Math.round(BASE_H * heroScale);

    const heroHorizPos: React.CSSProperties =
        sideAlign === "left"
            ? { left: `calc(50% - ${Math.abs(sideLiftPx)}px)` }
            : sideAlign === "right"
                ? { left: `calc(50% + ${Math.abs(sideLiftPx)}px)` }
                : { left: "50%", transform: "translateX(-50%)" };

    const armAnim = armsWave
        ? { animation: `arm-wave ${armWaveMs}ms ease-in-out infinite` }
        : undefined;

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                ...style,
            }}
        >
            {/* ��� � COVER, ����� ������ �������� ���� */}
            <img
                src={bg}
                alt="bg"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `translate(${bgOffsetX}px, ${bgOffsetY}px)`,
                    transformOrigin: "center",
                    zIndex: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            />

            {/* ����� */}
            <div
                style={{
                    position: "absolute",
                    ...heroHorizPos,
                    bottom: `${heroBottomPct}%`,
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: W,
                        height: H,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    <img src={heroParts.legL} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                    <img src={heroParts.legR} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                    <img src={heroParts.body} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                    <img
                        src={heroParts.armL}
                        alt=""
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            transformOrigin: "40% 35%",
                            ...(armAnim as any),
                        }}
                    />
                    <img
                        src={heroParts.armR}
                        alt=""
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            transformOrigin: "60% 35%",
                            ...(armAnim as any),
                        }}
                    />
                    <img src={heroParts.head} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
            </div>

            <style>
                {`
          @keyframes arm-wave {
            0%   { transform: translateY(0px) rotate(0deg); }
            50%  { transform: translateY(-${armLiftPx}px) rotate(${armSwingDeg}deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
        `}
            </style>
        </div>
    );
}
