import styles from './GenerateLetterPage.module.scss';
import { useNavigate } from 'react-router';

import { API_URL } from '../../config/api';

const GenerateLetterPage = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/resultspage');
  };

  return (
    <>
      <h1 className={styles.h1_text}>Сгенерируйте сопроводительное письмо</h1>
      <div className={styles.buttons_wrapper}></div>
      <div className={styles.uploadButton_div}>
        <button className={styles.upload_button}>Сгенерировать</button>
        <button className={styles.upload_button}>Пропустить</button>
      </div>
    </>
  );
};

export default GenerateLetterPage;
