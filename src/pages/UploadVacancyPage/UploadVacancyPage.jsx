import { useState } from 'react';
import styles from './UploadVacancyPage.module.scss';
import ManualFields from '../../components/ManualFields/ManualFields';

const UploadVacancyPage = () => {
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
      {active === 'link' ? <input type="text" placeholder="вставьте ссылку" /> : <ManualFields />}
      <div className={styles.uploadButton_div}>
        <button className={styles.upload_button}>Загрузить</button>
        <button className={styles.upload_button}>Пропустить</button>
      </div>
    </>
  );
};

export default UploadVacancyPage;
