import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { startAnalysis, updateVacancyInput } from '../../redux/slices/resumeSlice';
import BackButton from '../../components/BackButton/BackButton';
import styles from './UploadVacancyPage.module.scss';
import TextArea from '../../components/TextArea/TextArea';

const UploadVacancyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cvId = useSelector((state) => state.resume.cvId);
  const vacancyInput = useSelector((state) => state.resume.vacancyInput);

  const handleSubmit = async () => {
    try {
      if (!cvId) {
        alert('Сначала загрузите резюме');
        return;
      }

      const link = vacancyInput.mode === 'link' ? vacancyInput.link : vacancyInput.text;

      const result = await dispatch(
        startAnalysis({ cvId, link: link || undefined }),
      ).unwrap();

      localStorage.setItem('analysisId', result);
      console.log('analysisId:', result);

      navigate('/generateletter');
    } catch (e) {
      console.error(e);
      alert('Ошибка анализа');
    }
  };

  const handleSkip = async () => {
    try {
      if (!cvId) {
        alert('Сначала загрузите резюме');
        return;
      }
      const result = await dispatch(startAnalysis({ cvId })).unwrap();
      localStorage.setItem('analysisId', result);
      navigate('/generateletter');
    } catch (e) {
      console.error(e);
      alert('Ошибка анализа');
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
              placeholder="Введите ссылку"
            />
          </div>
        </div>
      ) : (
        <TextArea />
      )}

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
