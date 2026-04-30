import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { startAnalysis, updateVacancyInput } from '../../redux/slices/resumeSlice';
import BackButton from '../../components/BackButton/BackButton';
import styles from './UploadVacancyPage.module.scss';
import { toast } from 'react-toastify';
import TextArea from '../../components/TextArea/TextArea';
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
      return 'Ссылка должна быть с hh.ru или hh.kz и вести на вакансию (например: https://hh.ru/vacancy/123456)';
    }
    return null; // всё ок
  }

  const handleSubmit = async () => {
    try {
      if (!cvId) {
        toast.warn('Сначала загрузите резюме');
        return;
      }

      const link = vacancyInput.mode === 'link' ? vacancyInput.link : vacancyInput.text;

      if (vacancyInput.mode === 'link') {
        const linkError = validateHhLink(link);
        if (linkError) {
          if (!link || !link.trim()) {
            toast.warn(linkError); // стандартный
          } else {
            toast.warn(linkError, {
              // кастомный — только для неверного формата
              autoClose: 8000,
              closeButton: true,
              hideProgressBar: false,
            });
          }
          return;
        }
      }

      const result = await dispatch(startAnalysis({ cvId, link: link || undefined })).unwrap();

      localStorage.setItem('analysisId', result);
      console.log('analysisId:', result);

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
      const result = await dispatch(startAnalysis({ cvId })).unwrap();
      localStorage.setItem('analysisId', result);
      navigate('/generateletter');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка загрузки: ' + (e || 'Неизвестная ошибка'));
    }
  };

  return (
    <>
      <BackButton to="/uploadresume" />
      <h1 className={styles.h1_text}>Вставьте ссылку на вакансию или добавьте текст</h1>
      <div className={styles.buttons_wrapper}>
        <button
          className={`${styles.btn} ${vacancyInput.mode === 'link' ? styles.active : ''}`}
          onClick={() => dispatch(updateVacancyInput({ field: 'mode', value: 'link' }))}>
          Вставить ссылку
        </button>
        <button
          disabled
          className={`${styles.btn} ${vacancyInput.mode === 'text' ? styles.active : ''}`}
          onClick={() => dispatch(updateVacancyInput({ field: 'mode', value: 'text' }))}>
          Добавить текст
        </button>
      </div>

      {vacancyInput.mode === 'link' ? (
        <div className={styles.manual_wrapper}>
          <div className={styles.fio_field}>
            <p>Ссылка</p>
            <input
              className={styles.editable}
              value={vacancyInput.link}
              onChange={(e) =>
                dispatch(updateVacancyInput({ field: 'link', value: e.target.value }))
              }
              placeholder="Введите ссылку с HeadHunter"
            />
          </div>
        </div>
      ) : (
        <TextArea />
      )}

      <div>
        <img src={bulbpng} alt="bulb" />
        <p>
          Укажите ссылку на вакансию — и на следующем шаге вы сможете сгенерировать сопроводительное
          письмо. Доступно зарегистрированным пользователям.
        </p>
      </div>

      <div className={styles.uploadButton_div}>
        <button className={styles.upload_button} onClick={handleSubmit}>
          Загрузить
        </button>
        <button className={styles.upload_button} onClick={handleSkip}>
          Пропустить
        </button>
      </div>
    </>
  );
};

export default UploadVacancyPage;
