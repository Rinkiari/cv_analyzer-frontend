import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshTokens, logout, selectAuth } from '../redux/slices/authSlice';

// за сколько миллисекунд до истечения начинаем обновлять токен (ща 5 минут)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// как часто проверяем (ща каждую минуту)
const CHECK_INTERVAL_MS = 60 * 1000;

export function useTokenRefresh() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessTokenExpiresAt, refreshTokenExpiresAt } = useSelector(selectAuth);
  const isRefreshing = useRef(false);

  useEffect(() => {
    // если не залогинен , то не сработает
    if (!isAuthenticated) return;

    async function checkAndRefresh() {
      // если уже обновляем — то скип
      if (isRefreshing.current) return;

      const now = Date.now();

      // если рефреш токен тоже истёк — разлогиниваем
      if (refreshTokenExpiresAt && now >= refreshTokenExpiresAt) {
        dispatch(logout());
        return;
      }

      // если до истечения access токена осталось меньше порога — обновляем
      const shouldRefresh =
        !accessTokenExpiresAt || now >= accessTokenExpiresAt - REFRESH_THRESHOLD_MS;

      if (shouldRefresh) {
        isRefreshing.current = true;
        try {
          await dispatch(refreshTokens()).unwrap();
        } catch {
          // refreshTokens сам сделает clearStoredAuth при ошибке,
          // но isAuthenticated станет false и этот эффект больше не запустится
        } finally {
          isRefreshing.current = false;
        }
      }
    }

    // проверяем сразу при монтировании (на случай если открыли вкладку спустя время)
    checkAndRefresh();

    // и потом раз в минуту
    const intervalId = setInterval(checkAndRefresh, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, accessTokenExpiresAt, refreshTokenExpiresAt, dispatch]);
}
