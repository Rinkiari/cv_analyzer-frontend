import { useState } from 'react';
import { useNavigate } from 'react-router';
import styles from './UploadVacancyPage.module.scss';
import TextArea from '../../components/TextArea/TextArea';

const UploadVacancyPage = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/uploadletter');
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
            <div
              className={styles.editable}
              contentEditable
              suppressContentEditableWarning={true}></div>
          </div>
        </div>
      ) : (
        <TextArea />
      )}
      <div className={styles.uploadButton_div}>
        <button className={styles.upload_button}>Загрузить</button>
        <button className={styles.upload_button} onClick={handleClick}>
          Пропустить
        </button>
      </div>
    </>
  );
};

export default UploadVacancyPage;
