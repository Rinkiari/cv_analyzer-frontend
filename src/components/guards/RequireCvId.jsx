import { Navigate } from 'react-router';
import { useSelector } from 'react-redux';
import { readStoredCvId } from '../../redux/slices/resumeSlice';

// Гард для шага "вакансия": без cvId дальше делать нечего — сначала загрузка
// резюме. Читаем и из Redux, и из storage (на случай, если страница открыта
// после рефреша до того, как redux успел гидрироваться).
export default function RequireCvId({ children }) {
  const cvIdFromState = useSelector((state) => state.resume.cvId);
  const cvId = cvIdFromState || readStoredCvId();

  if (!cvId) {
    return <Navigate to="/uploadresume" replace />;
  }

  return children;
}
