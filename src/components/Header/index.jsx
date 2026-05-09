import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import styles from './Header.module.scss';
import { logout, selectAuth, fetchUserInfo } from '../../redux/slices/authSlice';
import {
  clearGeneratedLetter,
  clearStoredGeneratedLetter,
  dismissAnalysisCta,
} from '../../redux/slices/resumeSlice';
import { routeSteps, routeBackTargets } from '../../config/routeSteps';
import accountpic from '../../assets/portrait2.png';

// ----- nav -----
// `to` — навигация через react-router (страница или страница+якорь);
// `href` — обычный якорь в текущей странице. FAQ живёт на /about,
// контакты — на главной (#contacts). useLocation().hash в HomePage и
// AboutPage сам скроллит к нужной секции — react-router этого не делает.
const NAV_ITEMS = [
  { label: 'О сервисе', to: '/about' },
  { label: 'ЧАВО', to: '/about#faq' },
  { label: 'Контакты', to: '/#contacts' },
];

// ----- step labels (для контекстной полосы внутри потока) -----
// numeric step из routeSteps[pathname] -> человекочитаемое имя шага
const STEP_LABELS = {
  1: 'Главная',
  2: 'Загрузка резюме',
  3: 'Загрузка вакансии',
  4: 'Сопроводительное письмо',
  5: 'Готовый отчёт',
};
const TOTAL_STEPS = 5;

// маршруты, на которых уместен прогресс-бар (внутри потока).
// На "/" мы не показываем прогресс — там свой hero, а не пошаговый процесс.
const FLOW_ROUTES = new Set(['/uploadresume', '/uploadvacancy', '/generateletter', '/resultspage']);

// ============================================================
// chooseContext — единственное место, где решается, что рисовать
// в нижней (контекстной) строке. Возвращает либо null (скрыть),
// либо объект с тэгом и набором полей.
// ============================================================
function chooseContext({
  pathname,
  isAuthenticated,
  firstName,
  cvId,
  analysisId,
  analysisViewed,
  analysisCtaDismissed,
}) {
  // 1. Внутри потока (1/5 … 5/5) — прогресс-бар + back
  if (FLOW_ROUTES.has(pathname)) {
    const step = routeSteps[pathname];
    if (step) {
      return {
        kind: 'progress',
        step,
        total: TOTAL_STEPS,
        label: STEP_LABELS[step] || `Шаг ${step}`,
        backTo: routeBackTargets[pathname] || null,
      };
    }
  }

  // 2. На главной — состояния продвижения по resume
  if (pathname === '/') {
    // Полностью завершённый поток: пользователь хотя бы раз был на /resultspage
    // (ResultsPage диспатчит markAnalysisViewed на mount). Зовём обратно к
    // готовому отчёту. Сбрасывается через uploadResume/clearResumeState/logout.
    //
    // Копия разведена по статусу авторизации, чтобы не противоречить hero
    // trustLine: для гостя отчёт лежит только в sessionStorage этой вкладки
    // и исчезнет при её закрытии — слово "сохранён" звучало бы как обещание,
    // которого мы не даём. Для авторизованного — наоборот, отчёт реально
    // привязан к его истории.
    if (analysisId && analysisViewed) {
      // Пользователь скрыл крестиком — на главной нижнюю строку вообще не
      // рисуем, иначе следующая ветка (cvId → "Продолжите проверку") дала бы
      // чужеродный CTA сразу после явного "скрыть".
      if (analysisCtaDismissed) return null;
      return {
        kind: 'cta',
        tone: 'analysis',
        kicker: isAuthenticated ? 'Анализ готов' : 'Последний отчёт',
        title: isAuthenticated
          ? 'Откройте отчёт — он сохранён'
          : 'Вернитесь к последнему отчёту',
        ctaTo: '/resultspage',
        ctaLabel: 'Открыть отчёт',
        dismissable: true,
      };
    }
    // Mid-flow: резюме и вакансия уже отправлены (analysisId есть), но
    // пользователь ещё не доходил до /resultspage. analysisId выставляется
    // сразу после /uploadvacancy, поэтому звать в /resultspage сейчас нельзя —
    // ведём дальше по шагам, в /generateletter.
    if (analysisId && !analysisViewed) {
      return {
        kind: 'cta',
        tone: 'resume',
        kicker: 'Почти готово',
        title: 'Продолжите проверку — резюме и вакансия уже у нас',
        ctaTo: '/generateletter',
        ctaLabel: 'Продолжить',
      };
    }
    // Резюме загружено, но анализ ещё не запускался
    if (cvId) {
      return {
        kind: 'cta',
        tone: 'resume',
        kicker: 'Резюме загружено',
        title: 'Продолжите проверку — резюме уже у нас',
        ctaTo: '/uploadvacancy',
        ctaLabel: 'Продолжить',
      };
    }
    // Авторизованный без активного резюме — приветствие + ссылка в профиль
    if (isAuthenticated) {
      return {
        kind: 'greeting',
        firstName,
      };
    }
    // Гость на главной без cvId — контекст-полосу не показываем:
    // hero уже несёт кикер/H1/CTA, дублировать их в шапке нет смысла.
    return null;
  }

  // По умолчанию — ничего: страница может рендерить свой контекст
  return null;
}

// ============================================================
// useScrolled — true, когда страница скроллнута дальше threshold.
// Подкручиваем CSS-переменные через state-классы, не на каждый rAF.
// ============================================================
function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > threshold);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return scrolled;
}

// ----- atoms -----

const LogoMark = () => (
  <span className={styles.logoMark} aria-hidden="true">
    <img src="/favicon.svg" alt="" />
  </span>
);

const CloseX = ({ size = 14 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </svg>
);

const ArrowRight = ({ size = 14 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ----- contextual strip components -----

const BackArrow = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ProgressContext = ({ step, total, label, backTo }) => {
  const pct = Math.max(0, Math.min(100, (step / total) * 100));
  return (
    <>
      <div className={styles.ctxLeft}>
        {backTo ? (
          <Link to={backTo} className={styles.ctxBack} aria-label="Назад">
            <BackArrow />
          </Link>
        ) : null}
        <span className={styles.ctxKickerYellow}>
          Шаг {step} из {total}
        </span>
        <span className={styles.ctxDivider} aria-hidden="true" />
        <span className={styles.ctxTitle}>{label}</span>
      </div>
      <div className={styles.ctxRight}>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressCount}>
          {step}/{total}
        </span>
      </div>
    </>
  );
};

const CtaContext = ({ kicker, title, ctaTo, ctaLabel, tone, onDismiss }) => (
  <>
    <div className={styles.ctxLeft}>
      <span
        className={`${styles.ctxKickerYellow} ${
          tone === 'analysis' ? styles.ctxKickerEmphasis : ''
        }`}>
        {kicker}
      </span>
      <span className={styles.ctxDivider} aria-hidden="true" />
      <span className={styles.ctxTitle}>{title}</span>
    </div>
    <div className={styles.ctxRight}>
      <Link to={ctaTo} className={styles.ctxCta}>
        {ctaLabel}
        <ArrowRight />
      </Link>
      {onDismiss ? (
        <button
          type="button"
          className={styles.ctxClose}
          onClick={onDismiss}
          aria-label="Скрыть напоминание">
          <CloseX />
        </button>
      ) : null}
    </div>
  </>
);

const GreetingContext = ({ firstName }) => (
  <>
    <div className={styles.ctxLeft}>
      <span className={styles.ctxKickerMuted}>С возвращением</span>
      <span className={styles.ctxDivider} aria-hidden="true" />
      <span className={styles.ctxTitle}>
        {firstName ? (
          <>
            Рады видеть, <b>{firstName}</b>
          </>
        ) : (
          'Готовы к новой проверке?'
        )}
      </span>
    </div>
    <div className={styles.ctxRight}>
      <Link to="/myprofile" className={styles.ctxLink}>
        Моя история
        <ArrowRight />
      </Link>
    </div>
  </>
);

// ============================================================
// Header
// ============================================================
const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const auth = useSelector(selectAuth);
  const cvId = useSelector((s) => s.resume?.cvId);
  const analysisId = useSelector((s) => s.resume?.analysisId);
  const analysisViewed = useSelector((s) => s.resume?.analysisViewed);
  const analysisCtaDismissed = useSelector((s) => s.resume?.analysisCtaDismissed);

  const scrolled = useScrolled(12);

  // Подгружаем имя один раз после логина — чтобы greeting в шапке тоже знал имя
  useEffect(() => {
    if (auth?.isAuthenticated && !auth.firstName && auth.userInfoStatus === 'idle') {
      dispatch(fetchUserInfo());
    }
  }, [auth?.isAuthenticated, auth?.firstName, auth?.userInfoStatus, dispatch]);

  const ctx = useMemo(
    () =>
      chooseContext({
        pathname: location.pathname,
        isAuthenticated: !!auth?.isAuthenticated,
        firstName: auth?.firstName || null,
        cvId,
        analysisId,
        analysisViewed,
        analysisCtaDismissed,
      }),
    [
      location.pathname,
      auth?.isAuthenticated,
      auth?.firstName,
      cvId,
      analysisId,
      analysisViewed,
      analysisCtaDismissed,
    ],
  );

  const handleLogout = () => {
    clearStoredGeneratedLetter();
    dispatch(clearGeneratedLetter());
    dispatch(logout());
    navigate('/', { replace: true });
  };

  // hasContext управляет высотой и сжатием полосы при скролле.
  // collapsed === true => нижняя строка визуально схлопывается в одну линию
  // (см. .contextRowCollapsed: убираем вертикальные паддинги, оставляем только тонкий
  // прогресс/строку — это и есть «sticky, сворачивается в одну строку»).
  const hasContext = !!ctx;
  const collapsed = scrolled && hasContext;

  const headerClass = [
    styles.header,
    hasContext ? styles.headerWithContext : '',
    scrolled ? styles.headerScrolled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClass}>
      <div className={styles.shell}>
        {/* ===== верхняя строка: логотип / навигация / auth ===== */}
        <div className={styles.topRow}>
          <Link to="/" className={styles.logo} aria-label="ResumeIQ — на главную">
            <LogoMark />
            <span className={styles.logoText}>
              Resume<span className={styles.logoTextAccent}>IQ</span>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Главное меню">
            {NAV_ITEMS.map((item) =>
              item.to ? (
                <Link key={item.label} to={item.to} className={styles.navLink}>
                  {item.label}
                </Link>
              ) : (
                <a key={item.label} href={item.href} className={styles.navLink}>
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className={styles.actions}>
            {auth?.isAuthenticated ? (
              <>
                <Link to="/myprofile" className={styles.accountLink} aria-label="Мой профиль">
                  <img src={accountpic} alt="" />
                </Link>
                <button type="button" className={styles.btnPrimary} onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login?mode=register" className={styles.btnGhost}>
                  Регистрация
                </Link>
                <Link to="/login" className={styles.btnPrimary}>
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ===== нижняя контекстная строка ===== */}
        {/* Скрываем целиком, если контекста нет (маршруты вне потока + нет состояний) */}
        {hasContext && (
          <div
            className={`${styles.contextRow} ${collapsed ? styles.contextRowCollapsed : ''}`}
            data-kind={ctx.kind}>
            {ctx.kind === 'progress' && <ProgressContext {...ctx} />}
            {ctx.kind === 'cta' && (
              <CtaContext
                {...ctx}
                onDismiss={
                  ctx.dismissable ? () => dispatch(dismissAnalysisCta()) : undefined
                }
              />
            )}
            {ctx.kind === 'greeting' && <GreetingContext {...ctx} />}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
