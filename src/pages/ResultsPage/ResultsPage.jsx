import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ResultsPage.module.scss';
import attentionpng from '../../assets/attention.png';
import ReactMarkdown from 'react-markdown';
import Loader from '../../components/Loader/Loader';
import BackButton from '../../components/BackButton/BackButton';
import { API_URL } from '../../config/api';

const OPTIONS = [
  { id: 'structure', label: 'Структура и корректность' },
  { id: 'technologies', label: 'Технологии' },
  { id: 'relevance', label: 'Релевантность' },
  { id: 'another', label: 'Прочие рекомендации' },
  { id: 'vacancyComparison', label: 'Сравнение с вакансией' },
];

const LOADING_MESSAGES = [
  'Анализируем структуру резюме...',
  'Проверяем технологии и навыки...',
  'Сравниваем с вакансией...',
  'Формируем рекомендации...',
];

function ResultsPage() {
  const reduxAnalysisId = useSelector((state) => state.resume.analysisId);
  const reduxGeneratedLetter = useSelector((state) => state.resume.generatedLetter);

  const analysisId = reduxAnalysisId || localStorage.getItem('analysisId');
  const generatedLetter =
    reduxGeneratedLetter?.analysisId === analysisId ? reduxGeneratedLetter?.text : null;

  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [activeTab, setActiveTab] = useState('structure');
  const [loadingStep, setLoadingStep] = useState(0);

  const loading = Boolean(analysisId) && !result && !errorState;

  useEffect(() => {
    if (!loading) return;

    let cancelled = false;
    let timeoutId = null;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/analysis?analysisId=${analysisId}`);

        if (cancelled) return;

        if (res.status === 200) {
          const data = await res.json();
          setResult(data);
          return;
        }

        if (res.status === 202) {
          timeoutId = setTimeout(poll, 2000);
          return;
        }

        if (res.status === 500) {
          setErrorState('Ошибка анализа');
          return;
        }

        const text = await res.text();
        setErrorState(text || `Ошибка анализа (${res.status})`);
      } catch (e) {
        if (cancelled) return;
        setErrorState(e.message);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [analysisId, loading]);

  useEffect(() => {
    if (!loading) return;

    const messageInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);

    return () => clearInterval(messageInterval);
  }, [loading]);

  const renderResponse = () => {
    if (!result) return null;
    return result[activeTab] || 'Нет данных';
  };

  const loadingMessage = useMemo(() => LOADING_MESSAGES[loadingStep], [loadingStep]);

  if (!analysisId) {
    return <h2 className={styles.centerMessage}>Нет данных для анализа</h2>;
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <p className={styles.loadingKicker}>ResumeIQ</p>
          <h2 className={styles.loadingTitle}>Анализируем резюме...</h2>
          <p className={styles.loadingSubtitle}>{loadingMessage}</p>
          <Loader />
          <p className={styles.loadingHint}>Обычно это занимает 5–10 секунд</p>
        </div>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorContent}>
          <img src={attentionpng} className={styles.errorIcon} alt="attention" />
          <h2>Что-то пошло не так</h2>
          <p>{errorState}</p>
          <button className={styles.errorButton} onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <BackButton to="/generateletter" />
      <h1 className={styles.pageTitle}>Результаты анализа</h1>

      <div className={styles.options_div}>
        {OPTIONS.map((option) => (
          <p
            key={option.id}
            className={`${styles.option_item} ${activeTab === option.id ? styles.active : ''}`}
            onClick={() => setActiveTab(option.id)}>
            {option.label}
          </p>
        ))}
      </div>

      <div className={styles.textarea_div}>
        <div className={styles.textarea_p}>
          <ReactMarkdown>{renderResponse()}</ReactMarkdown>
        </div>
      </div>

      {generatedLetter ? (
        <section className={styles.letterCard}>
          <div className={styles.letterHeader}>
            <div>
              <p className={styles.letterKicker}>Сопроводительное письмо</p>
              <h2>Готовый вариант для отклика</h2>
            </div>
            <p className={styles.letterMeta}>Сгенерировано для текущего анализа</p>
          </div>

          <div className={styles.letterBody}>
            <ReactMarkdown>{generatedLetter}</ReactMarkdown>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ResultsPage;
