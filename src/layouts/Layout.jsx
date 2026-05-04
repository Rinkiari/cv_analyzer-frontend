// src/layouts/Layout.jsx
import { Outlet, useLocation } from 'react-router';
import ProgressBar from '../components/ProgressBar';
import BackButton from '../components/BackButton/BackButton';
import { routeSteps, routeBackTargets } from '../config/routeSteps';
import styles from './Layout.module.scss';

export default function Layout() {
  const { pathname } = useLocation();
  const step = routeSteps[pathname];
  const backTo = routeBackTargets[pathname];

  return (
    <>
      {(backTo || step) && (
        <div className={styles.topBar}>
          {backTo ? <BackButton to={backTo} /> : null}
          {step ? <ProgressBar step={step} maxSteps={5} /> : null}
        </div>
      )}
      <Outlet />
    </>
  );
}
