import React from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { ensureAuth } from "./shared/api";

// страницы
import Home from "./pages/Home";
import Profile from "./pages/Profile";
// Если этих страниц нет — просто удали импорты и роуты ниже
// import Mine from "./pages/Mine";
// import Raids from "./pages/Raids";

import ProfileModal from "./components/ProfileModal";

async function boot() {
    // гарантируем токен (Telegram/DEV)
    await ensureAuth();

    function AppRoutes() {
        const location = useLocation();
        const state = location.state as
            | { modal?: boolean; backgroundLocation?: Location }
            | undefined;

        // фон для модалки: если пришли со state.modal === true
        const background = state?.modal && state.backgroundLocation
            ? state.backgroundLocation
            : location;

        const navigate = useNavigate();

        return (
            <>
                {/* Основной слой */}
                <Routes location={background}>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    {/* <Route path="/mine" element={<Mine />} />
          <Route path="/raids" element={<Raids />} /> */}
                    <Route path="/profile" element={<Profile />} />
                </Routes>

                {/* Модалка поверх (только если пришли через Link с state.modal) */}
                {state?.modal && (
                    <ProfileModal onClose={() => navigate(-1)}>
                        <Profile />
                    </ProfileModal>
                )}
            </>
        );
    }

    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </React.StrictMode>
    );
}

boot();
