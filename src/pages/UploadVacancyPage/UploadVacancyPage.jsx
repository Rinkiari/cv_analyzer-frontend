import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { startAnalysis } from '../../redux/slices/resumeSlice';
import styles from './UploadVacancyPage.module.scss';
import TextArea from '../../components/TextArea/TextArea';

const UploadVacancyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cvId = useSelector((state) => state.resume.cvId);

  const [link, setLink] = useState('');

  // const handleClick = () => {
  //   navigate('/uploadletter');
  // };

  const handleSubmit = async () => {
    try {
      if (!cvId) {
        alert('Сначала загрузите резюме');
        return;
      }

      const result = await dispatch(
        startAnalysis({
          cvId,
          link: link || undefined, // важно
        }),
      ).unwrap();
      localStorage.setItem('analysisId', result);

      console.log('analysisId:', result);

      navigate('/resultspage');
    } catch (e) {
      console.error(e);
      alert('Ошибка анализа');
    }
  };

  //link or text
  const [active, setActive] = useState('link');

  return (
    <>
      <h1 className={styles.h1_text}>Вставьте ссылку на вакансию или добавьте текст</h1>
      <div className={styles.buttons_wrapper}>
        <button
          className={`${styles.btn} ${active === 'link' ? styles.active : ''}`}
          onClick={() => setActive('link')}>
          Вставить ссылку
        </button>

        <button
          className={`${styles.btn} ${active === 'text' ? styles.active : ''}`}
          onClick={() => setActive('text')}>
          Добавить текст
        </button>
      </div>
      {active === 'link' ? (
        <div className={styles.manual_wrapper}>
          <div className={styles.fio_field}>
            <p>Ссылка</p>
            <input
              className={styles.editable}
              value={link}
              onChange={(e) => setLink(e.target.value)}
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
        <button className={styles.upload_button} onClick={handleSubmit}>
          Пропустить
        </button>
      </div>
    </>
  );
};

export default UploadVacancyPage;
