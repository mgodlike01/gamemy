import './styles/tg.css';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ProfileButton } from './components/ProfileButton';
import { createBrowserRouter, RouterProvider, Link, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Mine from './pages/Mine';
import Raids from './pages/Raids';
import ProfilePage from './pages/Profile';
import Home from './pages/Home';


// ↓ добавляем хук профиля и модалку ника
import { useProfile } from './shared/useProfile';
import { NicknameModal } from './components/NicknameModal';

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
      { index: true, element: <Home /> },        // ← теперь главная
      { path: 'home', element: <Home /> },       // ← прямой маршрут
      { path: 'mine', element: <Mine /> },
      { path: 'raids', element: <Raids /> },
      { path: 'profile', element: <ProfilePage /> }, // если есть
      { path: '*', element: <Home /> },          // ← на всякий случай
    ],
  },
]);

const tg = (window as any)?.Telegram?.WebApp;
try {
  tg?.ready();
  tg?.expand(); // чтобы занять всю высоту
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
