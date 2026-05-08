import styles from './HomePage.module.scss';
import { Link } from 'react-router';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { ANALYSIS_CATEGORIES } from '../config/analysisCategories';
import { selectAuth } from '../redux/slices/authSlice';
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

// демо-контент для интерактивной превью-карточки в hero
const PREVIEW_CONTENT = {
  structure: {
    strengths: ['Чёткие блоки с опытом и навыками', 'Понятная хронология проектов'],
    improvements: ['Добавить краткое summary в начало'],
  },
  technologies: {
    strengths: ['React, TypeScript, Node.js — релевантны рынку', 'Указаны версии и контекст использования'],
    improvements: ['Сгруппировать стек: frontend / backend / tooling'],
  },
  relevance: {
    strengths: ['Опыт соответствует уровню Middle+', 'Доменные знания в e-commerce'],
    improvements: ['Уточнить, в каких проектах вели команду'],
  },
  another: {
    strengths: ['Достижения описаны через результат, а не процесс'],
    improvements: ['Сократить общие формулировки в «О себе»', 'Добавить ссылки на портфолио'],
  },
  vacancyComparison: {
    strengths: ['Совпадения: React, TypeScript, REST API'],
    improvements: ['В вакансии важен GraphQL — упомяните опыт', 'Добавить опыт с CI/CD'],
  },
};

// FAQ_ITEMS уехал на AboutPage (/about#faq) — на главной он дублировал
// дисклеймер и trustLine.

const HomePage = () => {
  // greeting и подгрузка имени теперь живут в Header — здесь хватает isAuthenticated
  // для условного рендера auth-only элементов (perkLine + ссылка в профиль).
  const { isAuthenticated } = useSelector(selectAuth);

  const [previewId, setPreviewId] = useState(ANALYSIS_CATEGORIES[0].id);
  const [previewHoveredId, setPreviewHoveredId] = useState(null);
  // hover показывает превью, click закрепляет выбор
  const displayedId = previewHoveredId || previewId;
  const previewCategory =
    ANALYSIS_CATEGORIES.find((c) => c.id === displayedId) || ANALYSIS_CATEGORIES[0];
  const previewData = PREVIEW_CONTENT[displayedId] || PREVIEW_CONTENT.structure;
  const previewDescription = CATEGORY_DESCRIPTIONS[displayedId];

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className={styles.page}>
      {/* === HERO === */}
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          {/* head: kicker + title + subtitle.
              greeting "С возвращением" ушёл в шапку (контекстная полоса) — здесь не дублируем. */}
          <div className={styles.titleHead}>
            <p className={styles.kicker}>Сервис анализа резюме</p>
            <h1 className={styles.heroTitle}>
              Проверь своё резюме перед&nbsp;отправкой работодателю
            </h1>
            <p className={styles.subtitle}>
              Загрузите файл или вставьте текст — получите подробный разбор и сопроводительное
              письмо за ~10 секунд.
            </p>
          </div>

          {/* benefits: смысловое наполнение середины блока вместо пустого пространства */}
          <ul className={styles.benefits}>
            <li className={styles.benefitItem}>
              <span className={styles.benefitCheck} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 13 10 18 20 7" />
                </svg>
              </span>
              <span>
                <b>Разбор по 5 категориям</b> — структура, стек, релевантность и не только
              </span>
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.benefitCheck} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 13 10 18 20 7" />
                </svg>
              </span>
              <span>
                <b>Сравнение с вакансией</b> — покажем совпадения и пробелы под конкретный отклик
              </span>
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.benefitCheck} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 13 10 18 20 7" />
                </svg>
              </span>
              <span>
                {isAuthenticated ? (
                  <>
                    <b>История в профиле</b> — возвращайтесь к прошлым отчётам и сравнивайте версии резюме
                  </>
                ) : (
                  <>
                    <b>Без регистрации</b> — анонимно, история не привязывается к аккаунту
                  </>
                )}
              </span>
            </li>
          </ul>

          {/* foot: CTA + (для авторизованных) персональная пилюля + trust-строка */}
          <div className={styles.titleFoot}>
            <div className={styles.ctaRow}>
              <Link to="/uploadresume" className={styles.btnPrimary}>
                Проверить резюме
              </Link>
              {isAuthenticated ? (
                <Link to="/myprofile" className={styles.btnGhost}>
                  Мой профиль
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={handleScrollToHowItWorks}>
                  Как это работает
                </button>
              )}
            </div>
            {isAuthenticated ? (
              <p className={styles.perkLine}>
                <span className={styles.perkCheck} aria-hidden="true">✓</span>
                Сопроводительное письмо в комплекте
              </p>
            ) : null}
            <p className={styles.trustLine}>
              <span>~10 секунд на анализ</span>
              <span className={styles.trustDot} aria-hidden="true">·</span>
              <span>PDF, DOCX или вручную</span>
              <span className={styles.trustDot} aria-hidden="true">·</span>
              <span>Полностью бесплатно</span>
            </p>
          </div>
        </div>

        {/* интерактивная превью-карточка результата */}
        <div className={styles.previewCard}>
          <div className={styles.previewWindowBar} aria-hidden="true">
            <span className={styles.previewDot} style={{ background: '#ff5f57' }} />
            <span className={styles.previewDot} style={{ background: '#febc2e' }} />
            <span className={styles.previewDot} style={{ background: '#28c840' }} />
          </div>

          <div className={styles.previewIntro}>
            <p className={styles.previewIntroKicker}>Живой пример отчёта</p>
            <h3 className={styles.previewIntroTitle}>Так выглядит ваш анализ</h3>
            <p className={styles.previewIntroHint}>
              Наведите на категорию слева — узнаете, что мы проверяем
            </p>
          </div>

          <div className={styles.previewBody}>
            <div className={styles.previewSidebar} role="tablist" aria-label="Категории превью">
              {ANALYSIS_CATEGORIES.map((cat) => {
                const isActive = cat.id === previewId;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.previewTab} ${isActive ? styles.previewTabActive : ''}`}
                    style={{ '--accent': cat.accent }}
                    onClick={() => setPreviewId(cat.id)}
                    onMouseEnter={() => setPreviewHoveredId(cat.id)}
                    onMouseLeave={() => setPreviewHoveredId(null)}
                    onFocus={() => setPreviewHoveredId(cat.id)}
                    onBlur={() => setPreviewHoveredId(null)}>
                    <span className={styles.previewTabIcon}>{cat.icon}</span>
                    <span className={styles.previewTabLabel}>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              key={displayedId}
              role="tabpanel"
              className={styles.previewContent}
              style={{ '--accent': previewCategory.accent }}>
              <p className={styles.previewKicker}>Категория · {previewCategory.label}</p>
              {previewDescription ? (
                <p className={styles.previewDescription}>{previewDescription}</p>
              ) : null}
              <h4 className={styles.previewH}>Сильные стороны</h4>
              <ul className={styles.previewList}>
                {previewData.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4 className={styles.previewH}>Что улучшить</h4>
              <ul className={styles.previewList}>
                {previewData.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
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

      {/* FAQ перенесён на /about#faq — здесь не дублируем */}

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
