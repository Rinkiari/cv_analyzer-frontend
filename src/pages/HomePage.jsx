import styles from './HomePage.module.scss';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { ANALYSIS_CATEGORIES } from '../config/analysisCategories';
import { clearResumeState } from '../redux/slices/resumeSlice';
import folderpic from '../assets/folder.png';
import servicepic from '../assets/service.png';
import dashboardpic from '../assets/dashboard.png';

const STEPS = [
  {
    n: '01',
    img: folderpic,
    title: 'Загрузите резюме',
    text: 'Прикрепите PDF или DOCX — либо заполните поля вручную.',
  },
  {
    n: '02',
    img: servicepic,
    title: 'Мы анализируем',
    text: 'AI разбирает резюме по 5 категориям и сверяет с вакансией.',
  },
  {
    n: '03',
    img: dashboardpic,
    title: 'Получите отчёт',
    text: 'Подробный разбор с рекомендациями и сопроводительное письмо.',
  },
];

const CATEGORY_DESCRIPTIONS = {
  structure: 'Обязательные блоки, разделы и форматирование резюме.',
  technologies: 'Стек технологий, фреймворков и инструментов в вашем опыте.',
  relevance: 'Соответствие желаемой позиции и рынку труда.',
  another: 'Дополнительные советы по стилю, ясности и акцентам.',
  vacancyComparison: 'Совпадения и пробелы между вашим резюме и текстом вакансии.',
};

const FAQ_ITEMS = [
  {
    q: 'Сохраняется ли моё резюме?',
    a: 'Без авторизации файл обрабатывается анонимно и не привязывается к профилю — мы используем его только чтобы построить отчёт. Если вы вошли в аккаунт, анализ попадает в вашу историю, чтобы можно было вернуться к нему позже.',
  },
  {
    q: 'Кто видит мои данные?',
    a: 'Файл уходит только на наш сервер анализа. Мы не передаём резюме третьим лицам и не используем его для обучения сторонних моделей.',
  },
  {
    q: 'Это правда бесплатно?',
    a: 'Да. Сервис без оплаты и без скрытых лимитов на количество проверок. Аккаунт нужен только если хотите сохранять историю и генерировать сопроводительное письмо.',
  },
  {
    q: 'Какие форматы поддерживаются?',
    a: 'PDF и DOCX — или можно заполнить данные вручную, если файла под рукой нет. Текст вакансии добавляется ссылкой или копированием.',
  },
];

const HomePage = () => {
  const dispatch = useDispatch();
  const cvId = useSelector((s) => s.resume.cvId);
  const analysisId = useSelector((s) => s.resume.analysisId);

  // analysisId важнее: если запущен анализ — ведём в отчёт;
  // иначе если есть только cvId — на шаг с вакансией.
  const resumeProgress = analysisId
    ? {
        to: '/resultspage',
        kicker: 'Анализ запущен',
        title: 'Вернитесь к отчёту — мы сохранили ваш анализ',
        cta: 'Перейти к отчёту',
      }
    : cvId
    ? {
        to: '/uploadvacancy',
        kicker: 'Резюме загружено',
        title: 'Продолжите проверку — резюме уже у нас',
        cta: 'Продолжить',
      }
    : null;

  return (
    <main className={styles.page}>
      {resumeProgress && (
        <section className={styles.resumeBanner}>
          <span className={styles.resumeBannerIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div className={styles.resumeBannerText}>
            <p className={styles.resumeBannerKicker}>{resumeProgress.kicker}</p>
            <p className={styles.resumeBannerTitle}>{resumeProgress.title}</p>
          </div>
          <div className={styles.resumeBannerActions}>
            <button
              type="button"
              className={styles.resumeBannerReset}
              onClick={() => dispatch(clearResumeState())}>
              Начать заново
            </button>
            <Link to={resumeProgress.to} className={styles.resumeBannerCta}>
              {resumeProgress.cta}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* === HERO === */}
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <p className={styles.kicker}>Сервис анализа резюме</p>
          <h1 className={styles.heroTitle}>
            Проверь своё резюме перед&nbsp;отправкой работодателю
          </h1>
          <p className={styles.subtitle}>
            Загрузите файл или вставьте текст — получите подробный разбор и сопроводительное
            письмо за ~10 секунд.
          </p>

          <div className={styles.ctaRow}>
            <Link to="/uploadresume" className={styles.btnPrimary}>
              Проверить резюме
            </Link>
            <a href="#how-it-works" className={styles.btnGhost}>
              Как это работает
            </a>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <p className={styles.statValue}>~10 сек</p>
              <p className={styles.statLabel}>на анализ</p>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <p className={styles.statValue}>PDF · DOCX</p>
              <p className={styles.statLabel}>или вручную</p>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <p className={styles.statValue}>Бесплатно</p>
              <p className={styles.statLabel}>без регистрации</p>
            </div>
          </div>
        </div>

        {/* mock-карточка результата */}
        <div className={styles.previewCard} aria-hidden="true">
          <div className={styles.previewHeader}>
            <span className={styles.previewDot} style={{ background: '#ff5f57' }} />
            <span className={styles.previewDot} style={{ background: '#febc2e' }} />
            <span className={styles.previewDot} style={{ background: '#28c840' }} />
            <span className={styles.previewTitle}>Результаты анализа</span>
          </div>

          <div className={styles.previewBody}>
            <div className={styles.previewSidebar}>
              {ANALYSIS_CATEGORIES.map((cat, i) => (
                <div
                  key={cat.id}
                  className={`${styles.previewTab} ${i === 0 ? styles.previewTabActive : ''}`}
                  style={{ '--accent': cat.accent }}>
                  <span className={styles.previewTabIcon}>{cat.icon}</span>
                  <span className={styles.previewTabLabel}>{cat.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.previewContent} style={{ '--accent': ANALYSIS_CATEGORIES[0].accent }}>
              <p className={styles.previewKicker}>Категория · Структура</p>
              <h4 className={styles.previewH}>Сильные стороны</h4>
              <ul className={styles.previewList}>
                <li>Чёткие блоки с опытом и навыками</li>
                <li>Понятная хронология проектов</li>
              </ul>
              <h4 className={styles.previewH}>Что улучшить</h4>
              <ul className={styles.previewList}>
                <li>Добавить краткое summary в начало</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className={styles.section} id="how-it-works">
        <p className={styles.kicker}>Как это работает</p>
        <h2 className={styles.sectionTitle}>Три шага до готового отчёта</h2>

        <div className={styles.stepsGrid}>
          {STEPS.map((s) => (
            <div key={s.n} className={styles.stepCard}>
              <span className={styles.stepNumber}>{s.n}</span>
              <div className={styles.stepIconWrap}>
                <img src={s.img} alt="" />
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepText}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === WHAT WE CHECK === */}
      <section className={styles.section}>
        <p className={styles.kicker}>Что мы проверяем</p>
        <h2 className={styles.sectionTitle}>5 категорий анализа</h2>

        <div className={styles.featuresGrid}>
          {ANALYSIS_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={styles.featureCard}
              style={{ '--accent': cat.accent }}>
              <span className={styles.featureIcon}>{cat.icon}</span>
              <h3 className={styles.featureTitle}>{cat.label}</h3>
              <p className={styles.featureText}>{CATEGORY_DESCRIPTIONS[cat.id]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === FAQ / TRUST === */}
      <section className={styles.section}>
        <p className={styles.kicker}>Часто спрашивают</p>
        <h2 className={styles.sectionTitle}>Без скрытых условий</h2>

        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                <span>{item.q}</span>
                <span className={styles.faqChevron} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <p className={styles.finalKicker}>Готовы начать?</p>
          <h2 className={styles.finalTitle}>Загрузите резюме — получите отчёт через минуту</h2>
          <p className={styles.finalSubtitle}>
            Без регистрации, без оплаты, без долгих форм.
          </p>
          <Link to="/uploadresume" className={styles.btnPrimary}>
            Загрузить резюме
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
