import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import styles from './ResultsPage.module.scss';
import attentionpng from '../../assets/attention.png';
import ReactMarkdown from 'react-markdown';
import Loader from '../../components/Loader/Loader';
import BackButton from '../../components/BackButton/BackButton';
import { API_URL } from '../../config/api';

// убирает базовый markdown-синтаксис, оставляя читаемый plain text
const stripMarkdown = (md) =>
  md
    .replace(/^#{1,6}\s+/gm, '') // заголовки
    .replace(/\*\*(.+?)\*\*/g, '$1') // **жирный**
    .replace(/\*(.+?)\*/g, '$1') // *курсив*
    .replace(/__(.+?)__/g, '$1') // __жирный__
    .replace(/_(.+?)_/g, '$1') // _курсив_
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1') // код
    .replace(/^\s*[-*+]\s+/gm, '• ') // списки
    .replace(/^\s*>\s+/gm, '') // цитаты
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [текст](ссылка)
    .replace(/\n{3,}/g, '\n\n') // лишние переносы
    .trim();

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
  letter: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
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

  const LETTER_OPTION = {
    id: 'letter',
    label: 'Сопроводительное письмо',
    accent: '#FBC02D',
    icon: Icon.letter,
    isLetter: true,
  };

  const renderResponse = () => {
    if (activeTab === 'letter') return generatedLetter || 'Нет данных';
    if (!result) return null;
    return result[activeTab] || 'Нет данных';
  };

  const loadingMessage = useMemo(() => LOADING_MESSAGES[loadingStep], [loadingStep]);

  const currentOption = useMemo(() => {
    if (activeTab === 'letter') return LETTER_OPTION;
    return OPTIONS.find((o) => o.id === activeTab) || OPTIONS[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDownloadLetter = () => {
    if (!generatedLetter) return;
    const text = stripMarkdown(generatedLetter);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${String(analysisId).slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLetter = async () => {
    if (!generatedLetter) return;
    try {
      await navigator.clipboard.writeText(stripMarkdown(generatedLetter));
      toast.success('Письмо скопировано в буфер обмена');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

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
                  style={{ '--accent': option.accent }}
                  onClick={() => setActiveTab(option.id)}>
                  <span className={styles.tabIcon} style={{ color: option.accent }}>
                    {option.icon}
                  </span>
                  <span className={styles.tabLabel}>{option.label}</span>
                </button>
              );
            })}

            {generatedLetter ? (
              <>
                <div className={styles.tabDivider} />
                <button
                  className={`${styles.tab} ${styles.tabBonus} ${activeTab === 'letter' ? styles.tabActive : ''}`}
                  style={{ '--accent': LETTER_OPTION.accent }}
                  onClick={() => setActiveTab('letter')}>
                  <span className={styles.tabIcon} style={{ color: LETTER_OPTION.accent }}>
                    {LETTER_OPTION.icon}
                  </span>
                  <span className={styles.tabLabel}>{LETTER_OPTION.label}</span>
                  <span className={styles.tabBadge}>Бонус</span>
                </button>
              </>
            ) : null}
          </nav>
        </aside>

        {/* правая колонка — контент текущей категории */}
        <article className={styles.content} style={{ '--accent': currentOption.accent }}>
          <header className={styles.contentHeader}>
            <span className={styles.contentIcon} style={{ color: currentOption.accent, background: `${currentOption.accent}14` }}>
              {currentOption.icon}
            </span>
            <div className={styles.contentHeaderText}>
              <p className={styles.contentKicker}>
                {currentOption.isLetter ? 'Готово к отправке' : 'Раздел анализа'}
              </p>
              <h2 className={styles.contentTitle}>{currentOption.label}</h2>
            </div>

            {currentOption.isLetter ? (
              <div className={styles.headerActions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                  onClick={handleCopyLetter}
                  title="Скопировать в буфер обмена">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Копировать</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={handleDownloadLetter}
                  title="Скачать как .txt">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Скачать</span>
                </button>
              </div>
            ) : null}
          </header>

          <div className={styles.markdown}>
            <ReactMarkdown>{renderResponse()}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}

export default ResultsPage;
