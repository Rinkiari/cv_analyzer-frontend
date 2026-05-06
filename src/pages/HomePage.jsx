import styles from './HomePage.module.scss';
import { Link } from 'react-router';

import { ANALYSIS_CATEGORIES } from '../config/analysisCategories';
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

const HomePage = () => {
  return (
    <main className={styles.page}>
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
              <p className={styles.statValue}>5</p>
              <p className={styles.statLabel}>категорий</p>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <p className={styles.statValue}>PDF · DOCX</p>
              <p className={styles.statLabel}>или вручную</p>
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
