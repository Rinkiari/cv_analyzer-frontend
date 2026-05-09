import { Navigate } from 'react-router';
import { useSelector } from 'react-redux';
import { readStoredAnalysisId, readStoredCvId } from '../../redux/slices/resumeSlice';

// Гард для шагов после старта анализа (/generateletter, /resultspage):
// без analysisId — отправляем пользователя на ближайший осмысленный шаг,
// а не в "тупик с лоадером навсегда". Если cvId уже есть — на вакансию,
// иначе в самое начало.
export default function RequireAnalysisId({ children }) {
  const analysisIdFromState = useSelector((state) => state.resume.analysisId);
  const cvIdFromState = useSelector((state) => state.resume.cvId);

  const analysisId = analysisIdFromState || readStoredAnalysisId();
  const cvId = cvIdFromState || readStoredCvId();

  if (!analysisId) {
    return <Navigate to={cvId ? '/uploadvacancy' : '/uploadresume'} replace />;
  }

  return children;
}
