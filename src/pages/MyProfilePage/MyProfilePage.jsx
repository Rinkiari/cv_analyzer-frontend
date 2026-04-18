import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spinner } from '@chakra-ui/react';
import styles from './MyProfilePage.module.scss';
import { fetchAnalysesHistory, selectProfile } from '../../redux/slices/profileSlice';
import { selectAuth } from '../../redux/slices/authSlice';

function getStoredUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_userId');
}

function getStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_accessToken');
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'Нет данных';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value).replace(/\n/g, '\n');
}

function getStatusMessage(error) {
  if (!error) return '';
  if (error.status === 401) return 'Сессия неактивна. Пожалуйста, войдите в аккаунт снова.';
  if (error.status === 404) return 'История анализов не найдена.';
  if (error.status === 500) return 'Ошибка сервера. Попробуйте позже.';
  return error.message || 'Не удалось загрузить историю анализов.';
}

export default function MyProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector(selectProfile);
  const auth = useSelector(selectAuth);

  const storedUserId = getStoredUserId();
  const storedAccessToken = getStoredAccessToken();

  const userId = auth?.userId || storedUserId;
  const isLoggedIn = Boolean((auth?.accessToken || storedAccessToken) && userId);
  const userLabel = useMemo(() => userId || 'Гость', [userId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    dispatch(fetchAnalysesHistory());
  }, [dispatch, isLoggedIn]);

  const errorMessage = getStatusMessage(profile.error);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <p className={styles.kicker}>Личный кабинет</p>
          <h1>История анализов</h1>
          <p className={styles.subtitle}>Здесь собраны все проверки резюме и их рекомендации.</p>
        </div>

        <div className={styles.profileCard}>
          <div>
            <p className={styles.cardLabel}>Пользователь</p>
            <h2>{userLabel}</h2>
          </div>
          <div className={styles.cardActions}>
            {isLoggedIn ? (
              <Button
                onClick={() => navigate('/uploadresume')}
                height="44px"
                borderRadius="14px"
                bg="#000"
                color="#FBC02D"
                _hover={{ bg: '#161616' }}>
                Новый анализ
              </Button>
            ) : (
              <Button
                asChild
                height="44px"
                borderRadius="14px"
                bg="#000"
                color="#FBC02D"
                _hover={{ bg: '#161616' }}>
                <Link to="/login">Войти</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className={styles.content}>
        {!isLoggedIn ? (
          <div className={styles.emptyState}>
            <h2>Чтобы открыть личный кабинет, нужно войти в аккаунт.</h2>
            <p>После входа здесь появится полная история анализов.</p>
          </div>
        ) : profile.status === 'loading' ? (
          <div className={styles.loadingState}>
            <Spinner size="lg" thickness="4px" speed="0.65s" color="#FBC02D" />
            <p>Загружаем историю анализов...</p>
          </div>
        ) : errorMessage ? (
          <div className={styles.errorState}>
            <h2>Не удалось загрузить историю</h2>
            <p>{errorMessage}</p>
            <div className={styles.errorActions}>
              <Button
                onClick={() => dispatch(fetchAnalysesHistory())}
                height="44px"
                borderRadius="14px"
                bg="#000"
                color="#FBC02D"
                _hover={{ bg: '#161616' }}>
                Повторить
              </Button>
            </div>
          </div>
        ) : profile.analyses.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Пока нет анализов</h2>
            <p>Загрузите резюме, чтобы первая проверка появилась здесь.</p>
          </div>
        ) : (
          <div className={styles.analysesGrid}>
            {profile.analyses.map((analysis, index) => {
              const entries = Object.entries(analysis || {});
              return (
                <article
                  key={analysis?.id || analysis?.analysisId || index}
                  className={styles.analysisCard}>
                  <div className={styles.analysisHeader}>
                    <div>
                      <p className={styles.analysisIndex}>Анализ #{index + 1}</p>
                      <h3>
                        {analysis?.title ||
                          analysis?.name ||
                          analysis?.cvName ||
                          'Результат анализа'}
                      </h3>
                    </div>
                    <p className={styles.analysisMeta}>
                      {analysis?.createdAt || analysis?.date || analysis?.timestamp || 'Без даты'}
                    </p>
                  </div>

                  <div className={styles.sections}>
                    {entries.map(([key, value]) => (
                      <div key={key} className={styles.section}>
                        <h4>{key}</h4>
                        <pre>{formatValue(value)}</pre>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
