import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { API_URL } from '../../config/api';
import { Button, Spinner } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
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

function formatText(value) {
  if (value === null || value === undefined || value === '') return 'Нет данных';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function formatDate(value) {
  if (!value) return 'Без даты';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusMessage(error) {
  if (!error) return '';
  if (error.status === 401) return 'Сессия неактивна. Пожалуйста, войдите в аккаунт снова.';
  if (error.status === 404) return 'История анализов не найдена.';
  if (error.status === 500) return 'Ошибка сервера. Попробуйте позже.';
  return error.message || 'Не удалось загрузить историю анализов.';
}

const ANALYSIS_FIELDS = [
  ['structure', 'Структура и корректность'],
  ['technologies', 'Технологии'],
  ['relevance', 'Релевантность'],
  ['another', 'Прочие рекомендации'],
  ['vacancyComparison', 'Сравнение с вакансией'],
];

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

  const [name, setName] = useState('');

  useEffect(() => {
    const fetchNameInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/users?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${getStoredAccessToken()}`,
          },
        });

        if (res.status === 200) {
          const data = await res.json();
          setName(data);
          return;
        }
        if (res.status === 401) {
          return;
        }

        if (res.status === 404) {
          return;
        }

        if (res.status === 500) {
          return;
        }
      } catch (e) {
        console.log('e:', e);
      }
    };

    fetchNameInfo();
  }, []);

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
          <p className={styles.subtitle}>
            Здесь собраны все проверки резюме и сопроводительные письма.
          </p>
        </div>

        <div className={styles.profileCard}>
          <div>
            <p className={styles.cardLabel}>Пользователь</p>
            <h2 className={styles.h2_name}>{name.firstName}</h2>
            <h3>ID: {userLabel}</h3>
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
                onClick={() => navigate('/login')}
                height="44px"
                borderRadius="14px"
                bg="#000"
                color="#FBC02D"
                _hover={{ bg: '#161616' }}>
                Войти
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
            {profile.analyses.map((item, index) => {
              const analysis = item?.analysis || {};
              const letter = item?.letter || null;

              console.log('letter: ', letter);

              return (
                <article key={analysis?.id || index} className={styles.analysisCard}>
                  <div className={styles.analysisHeader}>
                    <div>
                      <p className={styles.analysisIndex}>Анализ #{index + 1}</p>
                      <h3>Результат анализа</h3>
                    </div>
                    <p className={styles.analysisMeta}>{formatDate(analysis?.createdAt)}</p>
                  </div>

                  <div className={styles.sections}>
                    <section className={styles.section}>
                      <h4>Параметры анализа</h4>
                      <div className={styles.analysisList}>
                        {ANALYSIS_FIELDS.map(([field, label]) => (
                          <div key={field} className={styles.analysisRow}>
                            <p className={styles.rowLabel}>{label}</p>
                            <pre className={styles.rowValue}>{formatText(analysis?.[field])}</pre>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className={`${styles.section} ${styles.letterSection}`}>
                      <h4>Сопроводительное письмо</h4>
                      {letter?.text ? (
                        <pre className={styles.letterText}>
                          <ReactMarkdown>{letter.text}</ReactMarkdown>
                        </pre>
                      ) : (
                        <p className={styles.emptyLetter}>Письмо не сгенерировано.</p>
                      )}
                    </section>
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
