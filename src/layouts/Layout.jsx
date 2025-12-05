// src/layouts/Layout.jsx
import { Outlet, useLocation } from 'react-router';
import ProgressBar from '../components/ProgressBar';
import { routeSteps } from '../config/routeSteps';

export default function Layout() {
  const { pathname } = useLocation();
  const step = routeSteps[pathname];

  return (
    <>
      {step && <ProgressBar step={step} maxSteps={5} />}
      <Outlet />
    </>
  );
}
