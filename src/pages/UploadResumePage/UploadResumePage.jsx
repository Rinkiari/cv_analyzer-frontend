import { useState } from 'react';
import styles from './UploadResumePage.module.scss';
import Dropzone from '../../components/Dropzone/Dropzone';
import ManualFields from '../../components/ManualFields/ManualFields';
import { useNavigate } from 'react-router';

const UploadResumePage = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/uploadvacancy');
  };

  const [active, setActive] = useState('pdf_docx');

  const [file, setFile] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const handleUpload = async () => {
    if (!file) {
      alert('Выберите файл перед загрузкой!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('uploadedFile', file);

      const response = await fetch('http://localhost:8080/cv/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Ошибка загрузки');

      // const data = await response.json();
      const dataText = await response.text();

      console.log('Ответ сервера:', dataText);

      alert('Файл успешно загружен!');
    } catch (err) {
      console.error(err);
      alert('Не удалось загрузить файл.');
    } finally {
      console.log('proccess end');
    }
  };

  return (
    <>
      <h1 className={styles.h1_text}>
        {active === 'pdf_docx' ? 'Загрузите резюме в удобном формате' : 'Заполните резюме вручную'}{' '}
      </h1>
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
      {active === 'pdf_docx' ? <Dropzone onFileSelect={setFile} /> : <ManualFields />}
      <div className={styles.uploadButton_div}>
        <button
          className={styles.upload_button}
          // onClick={handleUpload}
          onClick={handleClick}>
          Загрузить
        </button>
      </div>
    </>
  );
};

export default UploadResumePage;
