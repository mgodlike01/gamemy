import React, { useEffect, useMemo, useState } from 'react';
import { IconTile } from '../components/IconTile';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../shared/useProfile';
import { api } from '../shared/api';
import { DungeonScene } from '../components/DungeonScene';
import GenderSelectModal from '../components/GenderSelectModal';

import { useMine } from '../shared/useMine';
import HeroHeader from '../components/HeroHeader';
import { SafeStage } from '../shared/SafeStage';
import { logout } from '../shared/api';
import ProfileButton from "../components/ProfileButton";
/** безопасный отступ под шапку Telegram + вырезы */
function useTelegramSafeTop() {
  const [safeTop, setSafeTop] = React.useState(64);

  React.useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;

    const readPx = (varName: string) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      const n = parseFloat(raw || '0');
      return Number.isFinite(n) ? n : 0;
    };

    const recalc = () => {
      const notch = readPx('--sat'); // см. index.css: --sat: env(safe-area-inset-top);
      const isExpanded = !!tg?.isExpanded;
      const HEADER_NOT_EXPANDED = 92;
      const PADDING_EXPANDED = 16;
      const MIN_TOP = 36;

      const top = isExpanded ? notch + PADDING_EXPANDED : notch + HEADER_NOT_EXPANDED;
      setSafeTop(Math.max(MIN_TOP, Math.round(top)));
    };

    recalc();
    tg?.onEvent?.('viewportChanged', recalc);
    tg?.onEvent?.('themeChanged', recalc);
    window.addEventListener('resize', recalc);

    return () => {
      tg?.offEvent?.('viewportChanged', recalc);
      tg?.offEvent?.('themeChanged', recalc);
      window.removeEventListener('resize', recalc);
    };
  }, []);

  return safeTop;
}

export default function Home() {
    const nav = useNavigate();
    const location = useLocation();
  const { profile, reload, loading } = useProfile();

  // ваши идеальные размеры сцены
  const BASE_W = 490;
  const BASE_H = 1050;

  const [energy, setEnergy] = useState(0);
  const [energyMax, setEnergyMax] = useState(5);
  const [coins, setCoins] = useState(0);
  const [gems] = useState(0);

  // загрузочный экран
  const [booting, setBooting] = useState(true);
  const [progress, setProgress] = useState(12);
  const { mine, claiming, claim } = useMine(8000);

  const fmt = (n?: number | null) => (typeof n === 'number' && isFinite(n) ? n.toLocaleString() : '0');

  // гендер-модалка (только если пола нет)
  const gender = useMemo(() => profile?.gender ?? (profile as any)?.hero?.gender ?? null, [profile]);
  const LS_KEY = 'genderModalDismissed';
  const [needGenderModal, setNeedGenderModal] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY) === '1';
    if (loading || !profile) return;

    if (gender) {
      setNeedGenderModal(false);
      if (!dismissed) localStorage.setItem(LS_KEY, '1');
      return;
    }
    setNeedGenderModal(!dismissed);
  }, [loading, profile, gender]);

  // монеты из шахты
  useEffect(() => {
    if (mine?.warehouse !== undefined && mine?.warehouse !== null) {
      setCoins(mine.warehouse);
    }
  }, [mine?.warehouse]);

  // имитация загрузки
  useEffect(() => {
    let alive = true;
    const stepTo = (val: number, delay = 120) =>
      setTimeout(() => alive && setProgress((p) => Math.min(val, p + 5)), delay);

    (async () => {
      try {
        stepTo(30);
        const p1 = api.get('/raids/status');
        stepTo(55);
        const p2 = api.get('/mine');

        const [r1, r2] = await Promise.allSettled([p1, p2]);

        if (r1.status === 'fulfilled') {
          const d: any = r1.value.data;
          setEnergy(d.energy ?? 0);
          setEnergyMax(d.energyMax ?? 5);
        }
        if (r2.status === 'fulfilled') {
          const m: any = r2.value.data;
          setCoins(m?.warehouse ?? 0);
        }

        stepTo(92, 100);
      } finally {
        setTimeout(() => {
          if (alive) {
            setProgress(100);
            setTimeout(() => { if (alive) setBooting(false); }, 2000);
          }
        }, 180);
      }
    })();
    return () => { alive = false; };
  }, []);

  const safeTopPx = useTelegramSafeTop();

  // Telegram WebApp user (на случай, если из профиля ещё не пришло)
  const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user as
    | { id?: number; username?: string; first_name?: string; last_name?: string; photo_url?: string }
    | undefined;

  const pickFirstString = (arr: any[]) => {
    for (const v of arr) {
      if (typeof v === 'string') {
        const s = v.trim();
        if (s) return s;
      }
    }
    return undefined;
  };

  const name =
    pickFirstString([
      profile?.displayName,
      profile?.username,
      [profile?.firstName, profile?.lastName].filter(Boolean).join(' '),
      (profile as any)?.name,
      (profile as any)?.fullName,
      (profile as any)?.user?.displayName,
      (profile as any)?.user?.username,
      [(profile as any)?.user?.firstName, (profile as any)?.user?.lastName].filter(Boolean).join(' '),
      (profile as any)?.user?.name,
      (profile as any)?.user?.fullName,
      tgUser && [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
      tgUser?.username,
      (profile as any)?.tgId,
    ]) || 'Герой';

  const avatarUrl =
    pickFirstString([
      profile?.photoUrl,
      (profile as any)?.avatarUrl,
      (profile as any)?.telegramPhotoUrl,
      (profile as any)?.user?.photoUrl,
      (profile as any)?.user?.avatarUrl,
      (profile as any)?.user?.telegramPhotoUrl,
      tgUser?.photo_url,
      profile?.avatarKey ? `/avatars/${profile.avatarKey}.png` : '',
    ]) || '/avatars/placeholder.png';

  // --- наборы слоёв для героя ---
  const rigMale = {
    body: '/hero_parts/male/body.png',
    head: '/hero_parts/male/head.png',
    armL: '/hero_parts/male/arm_left.png',
    armR: '/hero_parts/male/arm_right.png',
    legL: '/hero_parts/male/leg_left.png',
    legR: '/hero_parts/male/leg_right.png',
  };
  const rigFemale = {
    body: '/hero_parts/female/body.png',
    head: '/hero_parts/female/head.png',
    armL: '/hero_parts/female/arm_left.png',
    armR: '/hero_parts/female/arm_right.png',
    legL: '/hero_parts/female/leg_left.png',
    legR: '/hero_parts/female/leg_right.png',
  };
  const useFemale = (profile?.gender ?? (profile as any)?.hero?.gender) === 'female';
  const heroParts = useFemale ? rigFemale : rigMale;

  // иконки HUD
  const energyIcon = '/icons/energy.png';
  const coinIcon = '/icons/coin.svg';
  const gemIcon = '/icons/gem.svg';



  return (
    <SafeStage baseWidth={BASE_W} baseHeight={BASE_H} offsetY={0}>
      <>
        {booting}

        <DungeonScene
          bg="/scenes/home_bg.png"
          fg="/scenes/dungeon_fg.png"

          /** передаём слои героя */
          heroParts={heroParts}
          heroScale={1.15}         // <- слегка увеличен
          heroBottomPct={18}
          height="100%"

          armsWave={true}
  armSwingDeg={2}
  armLiftPx={1}
  armWaveMs={2500}

          /** чтобы не залезало под интерфейс Телеграма */
          topOffsetPx={safeTopPx + 70}

          /** расположение боковых колонок */
          sideAlign="middle"
          sideLiftPx={165}
                  bottomLiftPx={36}
                  heroOffsetY={-102}   // вверх
                  

          /** ЛЕВЫЙ ВЕРХ — аватар/имя, кликабельно в профиль */
                  topLeft={


            <div
                  onClick={() => nav('/profile', { state: { modal: true, backgroundLocation: location } })}


              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'flex-start',
                userSelect: 'none',
                cursor: 'pointer',
              }}
                      >

              <HeroHeader
                avatarSize={36}
                showLevel
                showCurrencies
                name={name}
                avatarUrl={avatarUrl}
              />
            </div>

          }

          /** ПРАВЫЙ ВЕРХ — энергия/монеты/драгоценности */
          topRight={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(0,0,0,.28)',
                border: '1px solid rgba(255,255,255,.18)',
                borderRadius: 14,
                padding: '6px 10px',
                color: '#fff',
                backdropFilter: 'blur(6px)',
              }}
            >
              <HudItem icon={energyIcon} text={`${energy} / ${energyMax}`} />
              <HudItem icon={coinIcon} text={coins.toLocaleString()} />
                  <HudItem icon={gemIcon} text={String(gems)} />
                  <button
                      onClick={async () => {
                          await logout();
                          // Можно сразу дернуть повторную загрузку профиля:
                          // await reload();
                      }}
                      style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.06)',
                          color: '#fff',
                      }}
                  >
                      Сбросить вход
                  </button>
            </div>
          }

          /** ЛЕВАЯ КОЛОНКА */
                  left={
                      <>

                          <IconTile title="КВЕСТЫ" icon="/icons/quests.png" variant="compact" iconSize="70px" labelSize="clamp(11px,3vw,13px)" labelOffsetY={-4} uppercase />
                          <IconTile
                              title="Инвентарь"
                              icon="/icons/inventory.png"
                              variant="compact"
                              iconSize="70px"
                              labelSize="clamp(11px,3vw,13px)"
                              labelOffsetY={-4}
                              uppercase
                              onClick={() => nav('/profile')}
                          />
                          <IconTile title="БОССЫ" icon="/icons/boss.png" variant="compact" iconSize="70px" labelSize="clamp(11px,3vw,13px)" labelOffsetY={-4} uppercase />
                      </>
                  }

                  /** ПРАВАЯ КОЛОНКА */
                  right={
                      <>
                          <IconTile title="МАГАЗИН" icon="/icons/shop.png" variant="compact" iconSize="70px" labelSize="clamp(11px,3vw,13px)" labelOffsetY={-4} uppercase badge="!" />
                          <IconTile title="ЛИДЕРЫ" icon="/icons/leaderboard.png" variant="compact" iconSize="70px" labelSize="clamp(11px,3vw,13px)" labelOffsetY={-4} uppercase />
                          <IconTile title="КЛАНЫ" icon="/icons/clans.png" variant="compact" iconSize="70px" labelSize="clamp(11px,3vw,13px)" labelOffsetY={-4} uppercase />


                      </>
                  }

                  /** НИЖНИЙ РЯД */
                  bottomRow={[
                      <IconTile
                          key="home"
                          title="Главная"
                          icon="/icons/home.png"
                          variant="large"
                          labelPosition="below"
                          iconSize="48px"
                          floatIdle={false}
                          onClick={() => nav('/home')}
                      />,
                      <DungeonSmartDungeonTile key="dungeon" />,
                      <IconTile
                          key="raids"
                          title="Рейды"
                          icon="/icons/raids.png"
                          variant="large"
                          labelPosition="below"
                          iconSize="48px"
                          floatIdle={false}
                          onClick={() => nav('/raids')}
                      />,

                  ]}
              />

        {/* модалка выбора пола (если не выбран) */}
        <GenderSelectModal
          open={needGenderModal}
          onClose={() => {
            localStorage.setItem('genderModalDismissed', '1');
            setNeedGenderModal(false);
          }}
          onChosen={() => {
            localStorage.setItem('genderModalDismissed', '1');
            setNeedGenderModal(false);
            reload?.();
          }}
        />
      </>
    </SafeStage>
  );
}

/** маленький элемент HUD: иконка + текст */
function HudItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <img src={icon} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
      <span style={{ fontWeight: 700 }}>{text}</span>
    </span>
  );
}

/** “умная” плитка Подземелья с плашкой ресурсов */
function DungeonSmartDungeonTile() {
  const nav = useNavigate();
  const { mine, claim, claiming } = useMine(2000);

  const [resOpen, setResOpen] = React.useState(false);
  const [manual, setManual] = React.useState<null | boolean>(null);

  const fmt = (n?: number | null) =>
    typeof n === 'number' && isFinite(n) ? n.toLocaleString() : '0';

  // автопоказ при >=50% буфера (пока пользователь не кликал вручную)
  React.useEffect(() => {
    if (!mine) return;
    if (manual !== null) return;
    const ratio = mine.bufferCap > 0 ? mine.buffer / mine.bufferCap : 0;
    setResOpen(ratio >= 0.5);
  }, [mine, manual]);

  const toggle = () => {
    setResOpen((o) => !o);
    setManual((prev) => (prev === null ? true : !prev));
  };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <IconTile
                title="ПОДЗЕМЕЛЬЕ"
                icon="/icons/dungeon.png"
                variant="compact"
                iconSize="50px"
                labelSize="clamp(11px,3vw,13px)"
                labelOffsetY={-4}
                uppercase
                floatIdle={false}
                onClick={() => nav('/mine')}
            />

            {/* кнопка-стрелка */}
            <button
                onClick={toggle}
                aria-label="Свернуть/развернуть ресурсы"
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: 25,
                    transform: 'translateY(-50%)',
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,.25)',
                    background: 'rgba(0,0,0,.38)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    padding: 0,
                }}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 12 12"
                    style={{
                        transform: resOpen ? 'rotate(90deg)' : 'rotate(-90deg)', // закрыто ←, открыто →
                        transition: 'transform .18s ease',
                        display: 'block',
                    }}
                >
                    <path
                        d="M4 2 L8 6 L4 10"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {mine && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 70,
                        transform: resOpen ? "translate(-50%, 0) scale(1)" : "translate(-50%, 12px) scale(0.92)",
                        transformOrigin: "50% 100%",            // растём из низа
                        transition: "transform .28s cubic-bezier(.2,.8,.2,1), opacity .18s ease, left .18s ease",
                        willChange: "transform",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,.45)",
                        border: "1px solid rgba(255,255,255,.12)",
                        backdropFilter: "blur(3px)",
                        boxShadow: "0 4px 10px rgba(0,0,0,.25)",
                        opacity: resOpen ? 1 : 0,
                        pointerEvents: resOpen ? "auto" : "none",
                        zIndex: 2,
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: 13,
                            textShadow: "0 1px 2px rgba(0,0,0,.5)",
                            minWidth: 86,
                            textAlign: "center",
                        }}
                    >
                        {fmt(mine?.buffer)} / {fmt(mine?.bufferCap)}
                    </span>

                    <button
                        onClick={claim}
                        disabled={claiming || !mine || (mine.buffer ?? 0) <= 0}
                        style={{
                            height: 26,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: "none",
                            fontWeight: 800,
                            fontSize: 12,
                            color: "#0b1220",
                            background: mine && (mine.buffer ?? 0) > 0 ? "#ffd54a" : "rgba(255,255,255,.25)",
                            cursor: claiming || !mine || (mine.buffer ?? 0) <= 0 ? "default" : "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                        }}
                        title="Забрать из буфера в склад"
                    >
                        {claiming ? "..." : "СОБРАТЬ"}
                    </button>
                </div>
            )}

        </div>
    );
}