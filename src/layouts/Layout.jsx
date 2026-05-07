// src/layouts/Layout.jsx
import { Outlet } from 'react-router';

// прогресс по шагам и кнопка "Назад" теперь живут в Header
// (контекстная полоса). Layout остался формальной обёрткой
// под react-router <Outlet />.
export default function Layout() {
  return <Outlet />;
}
