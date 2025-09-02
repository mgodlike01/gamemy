import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom"; // Для Mini App безопаснее HashRouter
import App from "./App";
import { LoadingScreen } from "./components/LoadingScreen";
import { preloadImages, waitForFonts, waitForStylesheet } from "./shared/bootstrap";

// 🔹 ЧАНКИ страниц, которые хотим прогреть перед стартом
const PAGE_CHUNKS = [
    () => import("./pages/Home"),
    () => import("./pages/Mine"),
    () => import("./pages/Profile"),
    () => import("./pages/Raids"),
];

// 🔹 КРИТИЧНЫЕ КАРТИНКИ/ФОНЫ — заполни своими путями
const IMAGE_ASSETS = [
    "/public/scenes/home_bg.png",
    "/public/scenes/dungeon_bg.png",
    "/public/bg/profile.jpg",
    "/assets/bg/raids.jpg",
    "/assets/hero/body.png",
    "/assets/ui/panel.png",
    "public/hero_parts/male/body.png",
    "public/hero_parts/male/head.png",
    "public/hero_parts/male/arm_left.png",
    "public/hero_parts/male/arm_right.png",
    "public/hero_parts/male/leg_left.png",
    "public/hero_parts/male/leg_right.png",
];

// Общая загрузка всего перед монтированием App, с прогрессом 0..100
async function loadBeforeApp(onProgress: (p: number) => void) {
    let completed = 0;
    const TASKS = 4; // chunks + images + fonts + css

    const step = () => {
        completed++;
        onProgress(Math.round((completed / TASKS) * 100));
    };

    // 1) Чанки страниц (ленивые импорты)
    await Promise.all(PAGE_CHUNKS.map((f) => f()));
    step();

    // 2) Картинки (внутри обновляем долю шага)
    await preloadImages(IMAGE_ASSETS, (done, total) => {
        onProgress(Math.round(((completed + done / Math.max(1, total)) / TASKS) * 100));
    });
    step();

    // 3) Шрифты
    await waitForFonts();
    step();

    // 4) Стили
    await waitForStylesheet();
    step();
}

function Root() {
    const [ready, setReady] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                await loadBeforeApp((p) => {
                    if (alive) setProgress(p);
                });
            } finally {
                if (alive) setReady(true);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    if (!ready) {
        return <LoadingScreen progress={progress} />;
    }

    return (
        <HashRouter>
            <App />
        </HashRouter>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
);
