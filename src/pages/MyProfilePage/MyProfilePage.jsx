import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Button, Spinner } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import styles from './MyProfilePage.module.scss';
import { fetchAnalysesHistory, selectProfile } from '../../redux/slices/profileSlice';
import { fetchUserInfo, selectAuth } from '../../redux/slices/authSlice';
import { ANALYSIS_CATEGORIES, LETTER_CATEGORY } from '../../config/analysisCategories';

function getStoredUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_userId');
}

function getStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_accessToken');
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

function formatShortDate(value) {
  if (!value) return 'Без даты';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusMessage(error) {
  if (!error) return '';
  if (error.status === 401) return 'Сессия неактивна. Пожалуйста, войдите в аккаунт снова.';
  if (error.status === 404) return 'История анализов не найдена.';
  if (error.status === 500) return 'Ошибка сервера. Попробуйте позже.';
  return error.message || 'Не удалось загрузить историю анализов.';
}

const stripMarkdown = (md) =>
  md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

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
  const firstName = auth?.firstName;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('structure');
  const [exporting, setExporting] = useState(null); // 'pdf' | 'docx' | null

  useEffect(() => {
    if (isLoggedIn && !firstName && auth.userInfoStatus === 'idle') {
      dispatch(fetchUserInfo());
    }
  }, [dispatch, isLoggedIn, firstName, auth.userInfoStatus]);

  useEffect(() => {
    if (!isLoggedIn) return;
    dispatch(fetchAnalysesHistory());
  }, [dispatch, isLoggedIn]);

  // когда меняется выбранный анализ, сбрасываем активный таб на первый
  useEffect(() => {
    setActiveTab('structure');
  }, [selectedIndex]);

  const errorMessage = getStatusMessage(profile.error);
  const analyses = profile.analyses || [];
  const selectedItem = analyses[selectedIndex] || null;
  const selectedAnalysis = selectedItem?.analysis || {};
  const selectedLetter = selectedItem?.letter?.text || null;

  const currentCategory = useMemo(() => {
    if (activeTab === 'letter') return LETTER_CATEGORY;
    return ANALYSIS_CATEGORIES.find((c) => c.id === activeTab) || ANALYSIS_CATEGORIES[0];
  }, [activeTab]);

  const renderDetailContent = () => {
    if (activeTab === 'letter') return selectedLetter || 'Письмо не сгенерировано.';
    return selectedAnalysis?.[activeTab] || 'Нет данных';
  };

  const handleDownloadLetter = () => {
    if (!selectedLetter) return;
    const text = stripMarkdown(selectedLetter);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${selectedAnalysis?.id?.toString().slice(0, 8) || 'letter'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAnalysis = async (format) => {
    if (!selectedItem || exporting) return;
    setExporting(format);
    try {
      // лениво подтягиваем jspdf/docx — те же чанки, что и на странице результатов
      const mod =
        format === 'pdf'
          ? await import('../../utils/exportAnalysisPdf')
          : await import('../../utils/exportAnalysisDocx');
      const exporter = format === 'pdf' ? mod.exportAnalysisPdf : mod.exportAnalysisDocx;
      await exporter({
        result: selectedAnalysis,
        analysisId: selectedAnalysis?.id,
        options: ANALYSIS_CATEGORIES,
      });
    } catch (err) {
      toast.error(err?.message || 'Не удалось сформировать файл');
    } finally {
      setExporting(null);
    }
  };

  const handleCopyLetter = async () => {
    if (!selectedLetter) return;
    try {
      await navigator.clipboard.writeText(stripMarkdown(selectedLetter));
      toast.success('Письмо скопировано в буфер обмена');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <main className={styles.page}>
      {/* Hero — профиль пользователя */}
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <p className={styles.kicker}>Личный кабинет</p>
          <h1 className={styles.heroTitle}>История анализов</h1>
          <p className={styles.subtitle}>
            Здесь собраны все проверки резюме и сопроводительные письма.
          </p>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <p className={styles.statValue}>{analyses.length}</p>
              <p className={styles.statLabel}>анализов</p>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <p className={styles.statValue}>
                {analyses.filter((a) => a?.letter?.text).length}
              </p>
              <p className={styles.statLabel}>писем</p>
            </div>
          </div>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatar}>
              {(firstName?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <p className={styles.cardLabel}>Пользователь</p>
              <h2 className={styles.profileName}>
                {firstName || 'Без имени'}
              </h2>
              <p className={styles.profileId}>ID: {userLabel}</p>
            </div>
          </div>

          <div className={styles.cardActions}>
            {isLoggedIn ? (
              <Button
                onClick={() => navigate('/uploadresume')}
                width="100%"
                height="48px"
                borderRadius="14px"
                bg="#000"
                color="#FBC02D"
                fontSize="17px"
                _hover={{ bg: '#161616' }}>
                Новый анализ
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                width="100%"
                height="48px"
                borderRadius="14px"
                bg="#000"
                color="#FBC02D"
                fontSize="17px"
                _hover={{ bg: '#161616' }}>
                Войти
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Состояния: not logged in / loading / error / empty / data */}
      {!isLoggedIn ? (
        <section className={styles.stateCard}>
          <h2>Войдите в аккаунт</h2>
          <p>Чтобы увидеть историю анализов и сгенерированные письма, войдите в систему.</p>
        </section>
      ) : profile.status === 'loading' ? (
        <section className={styles.stateCard}>
          <Spinner size="lg" thickness="4px" speed="0.65s" color="#FBC02D" />
          <p>Загружаем историю анализов...</p>
        </section>
      ) : errorMessage ? (
        <section className={styles.stateCard}>
          <h2>Не удалось загрузить историю</h2>
          <p>{errorMessage}</p>
          <Button
            onClick={() => dispatch(fetchAnalysesHistory())}
            height="44px"
            borderRadius="14px"
            bg="#000"
            color="#FBC02D"
            _hover={{ bg: '#161616' }}>
            Повторить
          </Button>
        </section>
      ) : analyses.length === 0 ? (
        <section className={styles.stateCard}>
          <h2>Пока нет анализов</h2>
          <p>Загрузите резюме, чтобы первая проверка появилась здесь.</p>
          <Button
            onClick={() => navigate('/uploadresume')}
            height="44px"
            borderRadius="14px"
            bg="#000"
            color="#FBC02D"
            _hover={{ bg: '#161616' }}>
            Создать первый анализ
          </Button>
        </section>
      ) : (
        <div className={styles.layout}>
          {/* левая колонка — список анализов */}
          <aside className={styles.analysesList}>
            <p className={styles.listKicker}>Все анализы</p>
            <div className={styles.listInner}>
              {analyses.map((item, index) => {
                const a = item?.analysis || {};
                const hasLetter = Boolean(item?.letter?.text);
                const isActive = index === selectedIndex;
                return (
                  <button
                    key={a?.id || index}
                    className={`${styles.analysisItem} ${isActive ? styles.analysisItemActive : ''}`}
                    onClick={() => setSelectedIndex(index)}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemNumber}>#{analyses.length - index}</span>
                      <span className={styles.itemDate}>{formatShortDate(a?.createdAt)}</span>
                    </div>
                    <p className={styles.itemTitle}>Анализ резюме</p>
                    <div className={styles.itemBadges}>
                      <span className={styles.itemBadge}>Анализ</span>
                      {hasLetter ? (
                        <span className={`${styles.itemBadge} ${styles.itemBadgeBonus}`}>
                          Письмо
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* центральная колонка — категории */}
          <aside className={styles.sidebar}>
            <p className={styles.sidebarKicker}>Категории</p>
            <nav className={styles.tabs}>
              {ANALYSIS_CATEGORIES.map((option) => {
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

              {selectedLetter ? (
                <>
                  <div className={styles.tabDivider} />
                  <button
                    className={`${styles.tab} ${activeTab === 'letter' ? styles.tabActive : ''}`}
                    style={{ '--accent': LETTER_CATEGORY.accent }}
                    onClick={() => setActiveTab('letter')}>
                    <span className={styles.tabIcon} style={{ color: LETTER_CATEGORY.accent }}>
                      {LETTER_CATEGORY.icon}
                    </span>
                    <span className={styles.tabLabel}>{LETTER_CATEGORY.label}</span>
                    <span className={styles.tabBadge}>Бонус</span>
                  </button>
                </>
              ) : null}
            </nav>
          </aside>

          {/* правая колонка — контент выбранной категории */}
          <article className={styles.content} style={{ '--accent': currentCategory.accent }}>
            <header className={styles.contentHeader}>
              <span
                className={styles.contentIcon}
                style={{ color: currentCategory.accent, background: `${currentCategory.accent}14` }}>
                {currentCategory.icon}
              </span>
              <div className={styles.contentHeaderText}>
                <p className={styles.contentKicker}>
                  {currentCategory.isLetter ? 'Готово к отправке' : 'Раздел анализа'}
                  {' • '}
                  {formatDate(selectedAnalysis?.createdAt)}
                </p>
                <h2 className={styles.contentTitle}>{currentCategory.label}</h2>
              </div>

              {currentCategory.isLetter ? (
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
              ) : (
                <div className={styles.headerActions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                    onClick={() => handleDownloadAnalysis('pdf')}
                    disabled={Boolean(exporting)}
                    title="Скачать этот анализ в PDF">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{exporting === 'pdf' ? 'Готовим…' : 'PDF'}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                    onClick={() => handleDownloadAnalysis('docx')}
                    disabled={Boolean(exporting)}
                    title="Скачать этот анализ в DOCX">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{exporting === 'docx' ? 'Готовим…' : 'DOCX'}</span>
                  </button>
                </div>
              )}
            </header>

            <div className={styles.markdown}>
              <ReactMarkdown>{renderDetailContent()}</ReactMarkdown>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
