import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spinner } from '@chakra-ui/react';
import styles from './GenerateLetterPage.module.scss';
import { toast } from 'react-toastify';
import letterIcon from '../../assets/letter.png';
import { generateLetter } from '../../redux/slices/resumeSlice';
import { selectAuth } from '../../redux/slices/authSlice';
import BackButton from '../../components/BackButton/BackButton';

const GenerateLetterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const analysisId =
    useSelector((state) => state.resume.analysisId) || localStorage.getItem('analysisId');

  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = Boolean(auth?.isAuthenticated && auth?.accessToken);

  const handleGenerate = async () => {
    if (!analysisId) {
      toast.error('Не найден analysisId. Сначала запустите анализ заново.');
      return;
    }
    if (!isLoggedIn) {
      toast.warn('Сначала войдите в аккаунт');
      navigate('/login');
      return;
    }
    setIsLoading(true);
    try {
      await dispatch(generateLetter()).unwrap();
      navigate('/resultspage', { replace: true });
    } catch (error) {
      toast.error(
        typeof error === 'string' ? error : error?.message || 'Не удалось сгенерировать письмо',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/resultspage', { replace: true });
  };

  return (
    <main className={styles.page}>
      <BackButton to="/uploadvacancy" />
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
        </div>

        <div className={styles.actionCard}>
          <div className={styles.statusBlock}>
            <p className={styles.statusLabel}>Статус</p>
            {isLoggedIn ? (
              <p className={styles.statusValue}>Вы вошли в аккаунт</p>
            ) : (
              <p className={`${styles.statusValue} ${styles.statusWarning}`}>
                Генерация доступна только зарегистрированным пользователям
              </p>
            )}
            {analysisId ? (
              <p className={styles.analysisHint}>
                Анализ: <span>{String(analysisId).slice(0, 8)}...</span>
              </p>
            ) : (
              <p className={styles.analysisHint}>AnalysisId не найден</p>
            )}
          </div>

          <div className={styles.buttonsRow}>
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
                  Генерируем...
                </>
              ) : (
                'Сгенерировать'
              )}
            </Button>
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
