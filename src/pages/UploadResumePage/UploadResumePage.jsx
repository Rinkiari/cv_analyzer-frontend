import { useState } from 'react';
import styles from './UploadResumePage.module.scss';
import cloud_pic from '../../assets/cloud.png';

const UploadResumePage = () => {
  const [active, setActive] = useState('pdf_docx');
  return (
    <>
      <h1 className={styles.h1_text}>Загрузите резюме в удобном формате</h1>
      <div className={styles.buttons_wrapper}>
        <button
          className={`${styles.btn} ${active === 'pdf_docx' ? styles.active : ''}`}
          onClick={() => setActive('pdf_docx')}>
          PDF / DOCX
        </button>

        <button
          className={`${styles.btn} ${active === 'manual' ? styles.active : ''}`}
          onClick={() => setActive('manual')}>
          Ввести вручную
        </button>
      </div>
      <div className={styles.upload_wrapper}>
        <img src={cloud_pic} alt="cloud" />
        <h3>Выберите файл в формате PDF или DOCX</h3>
        <p>или перетащите его сюда</p>
      </div>
      <div className={styles.uploadButton_div}>
        <button className={styles.upload_button}>Загрузить</button>
      </div>
    </>
  );
};

export default UploadResumePage;
