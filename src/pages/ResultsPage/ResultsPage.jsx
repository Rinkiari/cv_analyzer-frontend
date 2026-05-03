import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ResultsPage.module.scss';
import attentionpng from '../../assets/attention.png';
import ReactMarkdown from 'react-markdown';
import Loader from '../../components/Loader/Loader';
import BackButton from '../../components/BackButton/BackButton';
import { API_URL } from '../../config/api';

// иконки категорий (inline SVG — лёгкие и красятся через currentColor)
const Icon = {
  structure: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  technologies: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  relevance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  another: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.6 1 2.5V18h6v-.8c0-.9.3-1.8 1-2.5A7 7 0 0 0 12 2z" />
    </svg>
  ),
  vacancyComparison: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  ),
};

const OPTIONS = [
  { id: 'structure', label: 'Структура и корректность', accent: '#4A90E2', icon: Icon.structure },
  { id: 'technologies', label: 'Технологии', accent: '#9B6BFF', icon: Icon.technologies },
  { id: 'relevance', label: 'Релевантность', accent: '#2EAC78', icon: Icon.relevance },
  { id: 'another', label: 'Прочие рекомендации', accent: '#F5A623', icon: Icon.another },
  { id: 'vacancyComparison', label: 'Сравнение с вакансией', accent: '#E94E77', icon: Icon.vacancyComparison },
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

  const currentOption = useMemo(
    () => OPTIONS.find((o) => o.id === activeTab) || OPTIONS[0],
    [activeTab],
  );

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

      <div className={styles.layout}>
        {/* левая колонка — навигация по категориям */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarKicker}>Категории</p>
          <nav className={styles.tabs}>
            {OPTIONS.map((option) => {
              const isActive = activeTab === option.id;
              return (
                <button
                  key={option.id}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                  style={isActive ? { '--accent': option.accent } : { '--accent': option.accent }}
                  onClick={() => setActiveTab(option.id)}>
                  <span className={styles.tabIcon} style={{ color: option.accent }}>
                    {option.icon}
                  </span>
                  <span className={styles.tabLabel}>{option.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* правая колонка — контент текущей категории */}
        <article className={styles.content} style={{ '--accent': currentOption.accent }}>
          <header className={styles.contentHeader}>
            <span className={styles.contentIcon} style={{ color: currentOption.accent, background: `${currentOption.accent}14` }}>
              {currentOption.icon}
            </span>
            <div>
              <p className={styles.contentKicker}>Раздел анализа</p>
              <h2 className={styles.contentTitle}>{currentOption.label}</h2>
            </div>
          </header>

          <div className={styles.markdown}>
            <ReactMarkdown>{renderResponse()}</ReactMarkdown>
          </div>
        </article>
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
