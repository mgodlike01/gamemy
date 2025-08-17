import React from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    useNavigate,
    type Location,
} from "react-router-dom";

import { ensureAuth } from "./shared/api";

// страницы
import Home from "./pages/Home";
import Profile from "./pages/Profile";

// модалка
import ProfileModal from "./components/ProfileModal";
import Mine from "./pages/Mine";
import Raids from "./pages/Raids";

/**
 * Как открыть профиль как модалку:
 *   navigate('/profile', { state: { modal: true, backgroundLocation: location } })
 *   или <Link to="/profile" state={{ modal:true, backgroundLocation: location }} />
 *
 * Прямой переход на /profile без state.modal — покажет полную страницу.
 */
async function boot() {
    await ensureAuth();

    function AppRoutes() {
        const location = useLocation();
        const state = location.state as
            | { modal?: boolean; backgroundLocation?: Location }
            | undefined;

        const background =
            state?.modal && state.backgroundLocation ? state.backgroundLocation : location;

        const navigate = useNavigate();
        const onClose = () => {
            // если открывали модалкой — вернёмся ровно туда, откуда пришли
            if (state?.backgroundLocation) {
                navigate(state.backgroundLocation, { replace: true });
            } else {
                // если открыли /profile напрямую (без modal-state)
                navigate("/home", { replace: true });
            }
        };

        return (
            <>
                {/* Фоновый слой */}
                <Routes location={background}>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/raids" element={<Raids />} />
                    <Route path="/mine" element={<Mine />} />
                </Routes>

                {/* Модалка поверх */}
                {state?.modal && (
                    <ProfileModal onClose={onClose}>
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
