import { Navigate, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../redux/slices/authSlice';

// Гард для приватных маршрутов. Если refresh-токен в localStorage уже протух,
// authSlice.readStoredAuth (см. фикс #5) почистит storage и initialState
// придёт с isAuthenticated=false — гард тут же кинет на /login без 60-секунд
// «фантомной» авторизации.
export default function RequireAuth({ children }) {
  const { isAuthenticated, accessToken } = useSelector(selectAuth);
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
