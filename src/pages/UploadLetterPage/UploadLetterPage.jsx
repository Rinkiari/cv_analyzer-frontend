import { useState } from 'react';
import styles from './UploadLetterPage.module.scss';
import Dropzone from '../../components/Dropzone/Dropzone';
import TextArea from '../../components/TextArea/TextArea';
import { useNavigate } from 'react-router';

const UploadLetterPage = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/tetetetete');
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
        {active === 'pdf_docx'
          ? 'Загрузите сопроводительное письмо в удобном формате'
          : 'Введите текст сопроводительного письма'}
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
      {active === 'pdf_docx' ? <Dropzone onFileSelect={setFile} /> : <TextArea />}
      <div className={styles.uploadButton_div}>
        <button className={styles.upload_button}>Загрузить</button>
        <button className={styles.upload_button} onClick={handleClick}>
          Пропустить
        </button>
      </div>
    </>
  );
};

export default UploadLetterPage;
