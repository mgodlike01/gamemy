import './styles/tg.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import Mine from './pages/Mine';
import Raids from './pages/Raids';
import ProfilePage from './pages/Profile';
import Home from './pages/Home';

import { ensureAuth } from './shared/api';

function Layout() {
    return (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <Outlet />
        </div>
    );
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'home', element: <Home /> },
            { path: 'mine', element: <Mine /> },
            { path: 'raids', element: <Raids /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: '*', element: <Home /> },
        ],
    },
]);

// Telegram UI
const tg = (window as any)?.Telegram?.WebApp;
try {
    tg?.ready();
    tg?.expand();
} catch { }

async function boot() {
    await ensureAuth();
    // можно не ждать, UI всё равно отрендерится
}
boot();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
