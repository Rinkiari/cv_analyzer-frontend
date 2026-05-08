import { useEffect } from 'react';
import { useLocation } from 'react-router';
import styles from './AboutPage.module.scss';

// FAQ перенесён сюда с HomePage — поэтому навигация в шапке ведёт
// "О сервисе" → /about и "FAQ" → /about#faq.
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

const TECH_BLOCKS = [
  {
    title: 'Frontend',
    items: [
      'React 19 + Vite',
      'Redux Toolkit, react-router',
      'Chakra UI v3, SCSS-модули',
      'Сборка через bun, упаковка в Docker-образ за nginx',
    ],
  },
  {
    title: 'Backend',
    items: [
      'ASP.NET Core 9 (C#)',
      'Entity Framework Core + Microsoft SQL Server',
      'JWT-аутентификация, BCrypt для хэширования паролей',
      'PdfPig — парсинг PDF, DocumentFormat.OpenXml — парсинг DOCX',
      'MassTransit + RabbitMQ — асинхронная очередь для анализа и генерации писем',
      'RestSharp — HTTP-клиент к GigaChat API',
      'Swagger / Swashbuckle — документация REST API',
    ],
  },
  {
    title: 'AI',
    items: [
      'GigaChat API от Сбера. Российская LLM-инфраструктура — данные не уходят за границу. Модель разбирает резюме по 5 категориям и сравнивает его с текстом вакансии, если он есть.',
    ],
  },
];

const DISCLAIMERS = [
  {
    title: 'Не коммерция',
    text: 'Сервис некоммерческий и развивается в рамках учебной работы.',
  },
  {
    title: 'Данные не продаются',
    text: 'Резюме и тексты вакансий не передаются третьим лицам.',
  },
  {
    title: 'Не используются для тренировки моделей',
    text: 'Файлы нужны только чтобы построить отчёт — на них не дообучаются модели.',
  },
  {
    title: 'Анонимная обработка для гостей',
    text: 'Без авторизации файл не привязывается к аккаунту, а после закрытия вкладки браузера — теряется.',
  },
  {
    title: 'Без SLA и гарантий',
    text: 'AI-модель может ошибаться — отчёт стоит читать как одно из мнений, а не как финальный приговор.',
  },
];

const AboutPage = () => {
  const location = useLocation();

  // react-router сам не скроллит к якорю при переходе на новый pathname.
  // Если пришли на /about#faq — найдём элемент и скроллнем вручную.
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'auto' : 'auto' });
      return;
    }
    const id = location.hash.replace(/^#/, '');
    // даём React сначала отрендерить секцию, потом скроллим
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <main className={styles.page}>
      {/* === HERO === */}
      {/* hero без CTA-кнопок и без декоративной карточки — это вступление,
          а не конверсионный экран. Геометрически совпадает по ширине с остальными
          секциями (max-width задан в .section), чтобы вертикаль читалась ровно. */}
      <section className={styles.hero}>
        <p className={styles.kicker}>О сервисе</p>
        <h1 className={styles.heroTitle}>
          AI-разбор резюме и сравнение с&nbsp;вакансией — для&nbsp;IT-рынка
        </h1>
        <p className={styles.heroLead}>
          ResumeIQ разбирает ваше резюме по пяти категориям и, если добавить ссылку или
          текст вакансии, сравнивает резюме с её требованиями. Можно использовать
          «вслепую» — без вакансии — и получить общий разбор; можно с вакансией —
          увидеть совпадения и пробелы под конкретный отклик.
        </p>
        <p className={styles.heroLead}>
          Сервис бесплатный и работает без регистрации. Аккаунт нужен только если хотите
          хранить историю проверок и получать сопроводительное письмо как бонус. Под
          капотом — GigaChat от Сбера: данные обрабатываются на российской
          LLM-инфраструктуре, без выезда за границу.
        </p>
        {/*
          Подставьте свою специальность из диплома вместо "Программная инженерия".
          Намеренно одной строкой и неярко — детальные оговорки лежат ниже,
          в блоке "Учебный проект".
        */}
        <p className={styles.heroNote}>
          Дипломный проект по специальности «Программная инженерия».
        </p>
      </section>

      {/* === ЗАЧЕМ ЭТО (friendly) === */}
      <section className={styles.section}>
        <p className={styles.kicker}>Зачем это</p>
        <h2 className={styles.sectionTitle}>Объективный взгляд на резюме за 10 секунд</h2>
        <div className={styles.proseBlock}>
          <p>
            Большинство откликов уходит молча: кандидат не знает, что прочитали — структуру,
            стек, релевантность опыта. На самом деле рекрутер тратит на резюме считанные секунды
            и редко возвращается, чтобы объяснить отказ.
          </p>
          <p>
            ResumeIQ берёт ваше резюме и текст вакансии, прогоняет их через языковую модель и
            возвращает разбор по 5 категориям: структура, технологии, релевантность,
            дополнительные советы и сравнение с вакансией. Дополнительно — генерирует
            сопроводительное письмо под конкретный отклик.
          </p>
        </div>
      </section>

      {/* === ТЕХНОЛОГИИ (neutral) === */}
      <section className={styles.section}>
        <p className={styles.kicker}>Технологии</p>
        <h2 className={styles.sectionTitle}>Что под капотом</h2>
        <div className={styles.techGrid}>
          {TECH_BLOCKS.map((block) => (
            <div key={block.title} className={styles.techCard}>
              <h3 className={styles.techCardTitle}>{block.title}</h3>
              <ul className={styles.techCardList}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* === SELF-HOSTING (neutral) === */}
      <section className={styles.section}>
        <p className={styles.kicker}>Self-hosting</p>
        <h2 className={styles.sectionTitle}>На собственном VPS</h2>
        <div className={styles.proseBlock}>
          <p>
            Сервис размещён вручную на арендованном VPS, домен куплен и подключён напрямую.
            Не Vercel, не Netlify, не другой managed-хостинг с автодеплоем «по push в master» —
            фронт, бэкенд и база живут в собственных контейнерах на одном арендованном сервере.
          </p>
          <p>
            Это сознательное решение: для дипломной работы важно показать полный цикл —
            сборка фронта в Docker-образ через <code>bun</code>, контейнер с .NET 9 для
            бэкенда, очередь RabbitMQ, nginx перед всем этим, своя SSL-настройка. URL
            бэкенда задаётся переменной <code>VITE_API_URL</code>, так что код фронта не
            привязан к конкретной площадке — при желании всё разворачивается и в другом
            окружении без правок исходников.
          </p>
        </div>
      </section>

      {/* === УЧЕБНЫЙ ПРОЕКТ (neutral) === */}
      <section className={styles.section}>
        <p className={styles.kicker}>Учебный проект</p>
        <h2 className={styles.sectionTitle}>Несколько оговорок</h2>
        <p className={styles.sectionLead}>
          ResumeIQ — выпускная квалификационная работа. Это влияет на то, как стоит относиться
          к сервису и его данным.
        </p>
        <ul className={styles.disclaimerList}>
          {DISCLAIMERS.map((d) => (
            <li key={d.title} className={styles.disclaimerItem}>
              <span className={styles.disclaimerCheck} aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <polyline points="5 13 10 18 20 7" />
                </svg>
              </span>
              <span>
                <b>{d.title}.</b> {d.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* === FAQ (перенесено с HomePage) === */}
      <section className={styles.section} id="faq">
        <p className={styles.kicker}>Часто спрашивают</p>
        <h2 className={styles.sectionTitle}>Без скрытых условий</h2>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                <span>{item.q}</span>
                <span className={styles.faqChevron} aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* footer note — скромная подпись о ВКР, без отдельного блока-герой */}
      <p className={styles.footerNote}>Учебный проект · ВКР · 2026</p>
    </main>
  );
};

export default AboutPage;
