import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { startAnalysis, updateVacancyInput } from '../../redux/slices/resumeSlice';
import styles from './UploadVacancyPage.module.scss';
import { toast } from 'react-toastify';
import Disclosure from '../../components/Disclosure/Disclosure';
import bulbpng from '../../assets/bulb.png';

const UploadVacancyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cvId = useSelector((state) => state.resume.cvId);
  const vacancyInput = useSelector((state) => state.resume.vacancyInput);

  const HH_VACANCY_REGEX = /^https?:\/\/([a-z]+\.)?hh\.(ru|kz)\/vacancy\/\d+/;

  function validateHhLink(link) {
    if (!link || !link.trim()) {
      return 'Введите ссылку на вакансию';
    }
    if (!HH_VACANCY_REGEX.test(link.trim())) {
      return 'Ссылка должна быть с hh.ru или hh.kz и вести на вакансию.';
    }
    return null;
  }

  const handleSubmit = async () => {
    try {
      if (!cvId) {
        toast.warn('Сначала загрузите резюме');
        return;
      }

      // бекенд больше не принимает текст вакансии — режим всегда «ссылка»
      const link = vacancyInput.link;
      const linkError = validateHhLink(link);
      if (linkError) {
        if (!link || !link.trim()) {
          toast.warn(linkError);
        } else {
          toast.warn(linkError, {
            autoClose: 8000,
            closeButton: true,
            hideProgressBar: false,
          });
        }
        return;
      }

      await dispatch(startAnalysis({ cvId, link: link || undefined })).unwrap();
      navigate('/generateletter');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка загрузки: ' + (e || 'Неизвестная ошибка'));
    }
  };

  const handleSkip = async () => {
    try {
      if (!cvId) {
        toast.warn('Сначала загрузите резюме');
        return;
      }
      await dispatch(startAnalysis({ cvId })).unwrap();
      navigate('/generateletter');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка загрузки: ' + (e || 'Неизвестная ошибка'));
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        {/* левая карточка — подсказка */}
        <div className={styles.titleBlock}>
          <p className={styles.kicker}>Необязательно, но полезно</p>
          <h1 className={styles.cardTitle}>Укажите вакансию — получите больше</h1>
          <p className={styles.subtitle}>
            Анализ резюме без вакансии — это общие рекомендации. С вакансией — точное сравнение
            навыков и требований.
          </p>
          <Disclosure label="Подробнее о шаге">
            <div className={styles.infoCard}>
              <img src={bulbpng} alt="bulb icon" />
              <div>
                <h3>Бонус для зарегистрированных</h3>
                <p>
                  Укажите ссылку — и на следующем шаге вы сможете сгенерировать сопроводительное
                  письмо под эту вакансию.
                </p>
              </div>
            </div>

            <div className={styles.featuresCard}>
              <h4>Что вы получите с вакансией</h4>
              <ul>
                <li>Точный анализ совпадения навыков</li>
                <li>Пробелы между резюме и требованиями</li>
                <li>Сопроводительное письмо под вакансию</li>
                <li>Конкретные советы по доработке резюме</li>
              </ul>
            </div>
          </Disclosure>
        </div>

        {/* правая карточка — инпут и кнопки */}
        <div className={styles.actionCard}>
          <div>
            <p className={styles.kicker}>Источник вакансии</p>
            {/*
              Раньше тут был segmented control «Ссылка / Текст». Бекенд перестал
              принимать сырой текст, поэтому оставлен только «Ссылка» — но в виде
              одиночного full-width бейджа с теми же размерами и жёлтой заливкой,
              что и активный сегмент переключателя. Так после предыдущего шага
              ритм карточки не ломается: на месте полосы — полоса.
            */}
            <div className={styles.sourceBadge} role="status">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true">
                <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
              </svg>
              <span>Ссылка с hh.ru / hh.kz</span>
            </div>

            <div className={styles.inputWrapper}>
              <div className={styles.fio_field}>
                <p>Ссылка</p>
                <input
                  className={styles.editable}
                  value={vacancyInput.link}
                  onChange={(e) =>
                    dispatch(updateVacancyInput({ field: 'link', value: e.target.value }))
                  }
                  placeholder="https://hh.ru/vacancy/..."
                />
              </div>
            </div>

            <div className={styles.hintCard}>
              <p className={styles.hintKicker}>Пример ссылки</p>
              <code className={styles.hintExample}>https://hh.ru/vacancy/12345678</code>
              <p className={styles.hintText}>
                Откройте вакансию на hh.ru или hh.kz и скопируйте URL из адресной строки браузера.
              </p>
            </div>
          </div>

          <div className={styles.buttonsRow}>
            <button className={styles.upload_button} onClick={handleSubmit}>
              Загрузить
            </button>
            <button
              className={`${styles.upload_button} ${styles.upload_button_skip}`}
              onClick={handleSkip}>
              Пропустить
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default UploadVacancyPage;
