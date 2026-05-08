import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import styles from './ResultsPage.module.scss';
import attentionpng from '../../assets/attention.png';
import ReactMarkdown from 'react-markdown';
import Loader from '../../components/Loader/Loader';
import { API_URL } from '../../config/api';
import { ANALYSIS_CATEGORIES, LETTER_CATEGORY } from '../../config/analysisCategories';
import { markAnalysisViewed } from '../../redux/slices/resumeSlice';

// минус базовый markdown-синтаксис, только читаемый plain text
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

const OPTIONS = ANALYSIS_CATEGORIES;

const LOADING_MESSAGES_ANALYSIS = [
  'Анализируем структуру резюме...',
  'Проверяем технологии и навыки...',
  'Сравниваем с вакансией...',
  'Формируем рекомендации...',
];

const LOADING_MESSAGES_LETTER = [
  'Готовим сопроводительное письмо...',
  'Подбираем формулировки под вакансию...',
  'Расставляем акценты на ваших навыках...',
  'Финализируем текст...',
];

function ResultsPage() {
  const dispatch = useDispatch();
  const reduxAnalysisId = useSelector((state) => state.resume.analysisId);
  const reduxGeneratedLetter = useSelector((state) => state.resume.generatedLetter);
  const letterStatus = useSelector((state) => state.resume.letterStatus);
  const letterError = useSelector((state) => state.resume.letterError);

  // отмечаем что пользователь увидел готовый отчёт — шапка убирает CTA "Анализ готов"
  useEffect(() => {
    dispatch(markAnalysisViewed());
  }, [dispatch]);

  const analysisId = reduxAnalysisId || localStorage.getItem('analysisId');
  const generatedLetter =
    reduxGeneratedLetter?.analysisId === analysisId ? reduxGeneratedLetter?.text : null;

  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [activeTab, setActiveTab] = useState('structure');
  const [loadingStep, setLoadingStep] = useState(0);

  const analysisLoading = Boolean(analysisId) && !result && !errorState;
  const letterLoading = letterStatus === 'pending';
  const loading = analysisLoading || letterLoading;
  const phase = analysisLoading ? 'analysis' : letterLoading ? 'letter' : 'done';

  useEffect(() => {
    if (!analysisLoading) return;

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
  }, [analysisId, analysisLoading]);

  // при смене фазы (анализ → письмо) сбрасываем счётчик сообщений, чтобы не прыгал на середину
  useEffect(() => {
    setLoadingStep(0);
  }, [phase]);

  useEffect(() => {
    if (!loading) return;

    const total =
      phase === 'letter' ? LOADING_MESSAGES_LETTER.length : LOADING_MESSAGES_ANALYSIS.length;
    const messageInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % total);
    }, 1800);

    return () => clearInterval(messageInterval);
  }, [loading, phase]);

  // если поллинг письма завершился ошибкой — кидаем тост, чтобы пользователь понял, почему вкладка с письмом не появилась
  useEffect(() => {
    if (letterStatus === 'failed' && letterError) {
      toast.error(letterError);
    }
  }, [letterStatus, letterError]);

  const LETTER_OPTION = LETTER_CATEGORY;

  const renderResponse = () => {
    if (activeTab === 'letter') return generatedLetter || 'Нет данных';
    if (!result) return null;
    return result[activeTab] || 'Нет данных';
  };

  const loadingMessage = useMemo(() => {
    const messages =
      phase === 'letter' ? LOADING_MESSAGES_LETTER : LOADING_MESSAGES_ANALYSIS;
    return messages[loadingStep % messages.length];
  }, [loadingStep, phase]);

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
    const loadingTitle =
      phase === 'letter' ? 'Готовим сопроводительное письмо...' : 'Анализируем резюме...';
    const loadingHint =
      phase === 'letter'
        ? 'Письмо готовится после анализа, это может занять до минуты'
        : 'Обычно это занимает 5–10 секунд';
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <p className={styles.loadingKicker}>ResumeIQ</p>
          <h2 className={styles.loadingTitle}>{loadingTitle}</h2>
          <p className={styles.loadingSubtitle}>{loadingMessage}</p>
          <Loader />
          <p className={styles.loadingHint}>{loadingHint}</p>
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
                  className={`${styles.tab} ${styles.tabBonus} ${
                    activeTab === 'letter' ? styles.tabActive : ''
                  }`}
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
            <span
              className={styles.contentIcon}
              style={{ color: currentOption.accent, background: `${currentOption.accent}14` }}>
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Копировать</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={handleDownloadLetter}
                  title="Скачать как .txt">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
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
