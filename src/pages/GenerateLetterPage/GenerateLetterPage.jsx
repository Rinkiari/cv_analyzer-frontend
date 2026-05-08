import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spinner } from '@chakra-ui/react';
import styles from './GenerateLetterPage.module.scss';
import { toast } from 'react-toastify';
import letterIcon from '../../assets/letter.png';
import { generateLetter, readStoredAnalysisId } from '../../redux/slices/resumeSlice';
import { selectAuth } from '../../redux/slices/authSlice';

const GenerateLetterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const analysisId =
    useSelector((state) => state.resume.analysisId) || readStoredAnalysisId();
  const pendingLetter = useSelector((state) => state.resume.pendingLetter);
  const letterStatus = useSelector((state) => state.resume.letterStatus);
  const analysisHasVacancy = useSelector((state) => state.resume.analysisHasVacancy);

  const isLoading = letterStatus === 'pending';
  const isLoggedIn = Boolean(auth?.isAuthenticated && auth?.accessToken);
  // null трактуем как «не уверены» (например, старый анализ в localStorage без флага) — лучше перестраховаться и попросить указать вакансию
  const hasVacancy = analysisHasVacancy === true;

  // если для текущего analysisId уже идёт (или висит после обновления) генерация письма —
  // сразу уходим на /resultspage, лоадер крутится там
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    if (!analysisId) return;
    const hasPending = pendingLetter && pendingLetter.analysisId === analysisId;
    if (letterStatus === 'pending' || hasPending) {
      resumedRef.current = true;
      if (letterStatus !== 'pending' && hasPending && isLoggedIn) {
        dispatch(generateLetter());
      }
      navigate('/resultspage', { replace: true });
    }
  }, [analysisId, pendingLetter, letterStatus, isLoggedIn, dispatch, navigate]);

  const handleGenerate = () => {
    if (!analysisId) {
      toast.error('Не найден analysisId. Сначала запустите анализ заново.');
      return;
    }
    if (!hasVacancy) {
      toast.warn('Сначала укажите ссылку на вакансию');
      navigate('/uploadvacancy');
      return;
    }
    if (!isLoggedIn) {
      toast.warn('Сначала войдите в аккаунт');
      navigate('/login');
      return;
    }
    // запускаем POST + поллинг письма в фоне и сразу уходим на страницу результатов —
    // там общий лоадер дождётся и анализ, и письмо
    dispatch(generateLetter());
    navigate('/resultspage', { replace: true });
  };

  const handleSkip = () => {
    navigate('/resultspage', { replace: true });
  };

  const handleAddVacancy = () => {
    navigate('/uploadvacancy');
  };

  const handleGoLogin = () => {
    navigate('/login');
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <p className={styles.kicker}>Бонус для зарегистрированных</p>
          <h1>Сгенерируйте сопроводительное письмо</h1>
          <p className={styles.subtitle}>
            Нажмите на кнопку правее, и мы подготовим письмо для отклика на основе текущего анализа.
          </p>
          <div className={styles.infoCard}>
            <img src={letterIcon} alt="letter icon" />
            <div>
              <h2>Письмо будет привязано к текущему анализу</h2>
              <p>
                После генерации оно появится на странице результатов и в личном кабинете рядом с
                вашим анализом.
              </p>
            </div>
          </div>

          <div className={styles.featuresCard}>
            <h4>Что будет в письме</h4>
            <ul>
              <li>Персональное обращение к работодателю</li>
              <li>Акцент на навыках под вакансию</li>
              <li>Мотивация и интерес к должности</li>
              <li>Готово к отправке без правок</li>
            </ul>
          </div>
        </div>

        <div className={styles.actionCard}>
          <div>
            <div className={styles.statusBlock}>
              <p className={styles.statusLabel}>Статус</p>
              <ul className={styles.checklist}>
                <li
                  className={`${styles.checkItem} ${
                    hasVacancy ? styles.checkOk : styles.checkBad
                  }`}>
                  <span className={styles.checkIcon} aria-hidden="true">
                    {hasVacancy ? '✓' : '✕'}
                  </span>
                  <span className={styles.checkLabel}>
                    {hasVacancy ? 'Вакансия указана' : 'Укажите вакансию на предыдущем шаге'}
                  </span>
                </li>
                <li
                  className={`${styles.checkItem} ${
                    isLoggedIn ? styles.checkOk : styles.checkBad
                  }`}>
                  <span className={styles.checkIcon} aria-hidden="true">
                    {isLoggedIn ? '✓' : '✕'}
                  </span>
                  <span className={styles.checkLabel}>
                    {isLoggedIn ? 'Вы вошли в аккаунт' : 'Войдите в аккаунт'}
                  </span>
                </li>
              </ul>
              {analysisId ? (
                <p className={styles.analysisHint}>
                  Анализ: <span>{String(analysisId).slice(0, 8)}...</span>
                </p>
              ) : (
                <p className={styles.analysisHint}>AnalysisId не найден</p>
              )}
            </div>

            <div className={styles.hintCard}>
              <p className={styles.hintKicker}>Как будет выглядеть письмо</p>
              <div className={styles.previewSnippet}>
                <p>
                  «Здравствуйте! Меня заинтересовала ваша вакансия. Опыт работы с нужным вам стеком
                  и релевантные проекты позволят мне быстро влиться в команду и принести
                  пользу...»
                </p>
              </div>
              <p className={styles.hintText}>
                Готовое письмо появится на странице результатов и в личном кабинете рядом с
                анализом.
              </p>
            </div>
          </div>

          <div className={styles.buttonsRow}>
            {!hasVacancy ? (
              <Button
                onClick={handleAddVacancy}
                height="50px"
                borderRadius="16px"
                bg="#000"
                color="#FBC02D"
                fontSize="18px"
                _hover={{ bg: '#161616' }}
                width="100%">
                Указать вакансию
              </Button>
            ) : !isLoggedIn ? (
              <Button
                onClick={handleGoLogin}
                height="50px"
                borderRadius="16px"
                bg="#000"
                color="#FBC02D"
                fontSize="18px"
                _hover={{ bg: '#161616' }}
                width="100%">
                Войти в аккаунт
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                isDisabled={isLoading || !analysisId}
                height="50px"
                borderRadius="16px"
                bg="#000"
                color="#FBC02D"
                fontSize="18px"
                _hover={{ bg: '#161616' }}
                width="100%">
                {isLoading ? (
                  <>
                    <Spinner size="sm" thickness="3px" speed="0.65s" mr="8px" />
                    Готовим письмо...
                  </>
                ) : (
                  'Сгенерировать'
                )}
              </Button>
            )}
            <Button
              onClick={handleSkip}
              height="50px"
              borderRadius="16px"
              bg="#8fddc1"
              color="#000"
              fontSize="18px"
              _hover={{ opacity: 0.9 }}
              width="100%">
              Пропустить
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default GenerateLetterPage;
