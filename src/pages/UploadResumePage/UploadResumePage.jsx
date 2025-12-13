import { useState } from 'react';
import styles from './UploadResumePage.module.scss';
import Dropzone from '../../components/Dropzone/Dropzone';
import ManualFields from '../../components/ManualFields/ManualFields';
import { Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { uploadResume } from '../../slices/resumeSlice';

const UploadResumePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState('pdf_docx');
  const [file, setFile] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const handleUploadAndNext = async () => {
    if (!file) {
      alert('Выберите файл перед загрузкой!');
      return;
    }

    setIsLoading(true);

    try {
      const result = await dispatch(uploadResume(file)).unwrap();
      console.log('Ответ сервера (сохранён в стор):', result);

      navigate('/uploadvacancy');

      alert('Файл успешно загружен!');
    } catch (err) {
      console.error('Ошибка при загрузке через thunk:', err);
      alert('Не удалось загрузить файл: ' + (err || 'Unknown error'));
    } finally {
      setIsLoading(false);
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
        <button className={styles.upload_button} onClick={handleUploadAndNext} disabled={isLoading}>
          {isLoading ? (
            <>
              Загрузка...
              <Spinner size="sm" thickness="3px" speed="0.65s" ml="8px" color="white" />
            </>
          ) : (
            'Загрузить'
          )}
        </button>
      </div>
    </>
  );
};

export default UploadResumePage;
