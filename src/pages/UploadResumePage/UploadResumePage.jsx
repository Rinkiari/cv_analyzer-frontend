import { useState } from 'react';
import styles from './UploadResumePage.module.scss';
import Dropzone from '../../components/Dropzone/Dropzone';
import ManualFields from '../../components/ManualFields/ManualFields';
import BackButton from '../../components/BackButton/BackButton';
import { Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { uploadResume, uploadManualResume } from '../../redux/slices/resumeSlice';

const UploadResumePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const existingCvId = useSelector((state) => state.resume.cvId);

  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState('pdf_docx');
  const [file, setFile] = useState(null);
  // если резюме уже есть — показываем баннер; иначе сразу форму загрузки
  const [showUploadForm, setShowUploadForm] = useState(!existingCvId);

  const handleSubmit = async () => {
    if (active === 'pdf_docx') {
      await handleUploadAndNext();
    } else {
      await handleManualUpload();
    }
  };

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
    }
  };

  const handleManualUpload = async () => {
    setIsLoading(true);
    try {
      await dispatch(uploadManualResume()).unwrap();
      navigate('/uploadvacancy');
    } catch (e) {
      console.log(e);
      alert('Ошибка отправки данных');
    } finally {
      setIsLoading(false);
    }
  };

  // баннер «резюме уже загружено»
  if (!showUploadForm && existingCvId) {
    return (
      <>
        <BackButton to="/" />
        <h1 className={styles.h1_text}>Загрузите резюме в удобном формате</h1>

        <div className={styles.already_card}>
          <span className={styles.already_icon}>✓</span>
          <div>
            <p className={styles.already_title}>Резюме уже загружено</p>
            <p className={styles.already_sub}>Можно продолжить или загрузить другое</p>
          </div>
        </div>

        <div className={styles.uploadButton_div}>
          <button className={styles.upload_button} onClick={() => navigate('/uploadvacancy')}>
            Продолжить
          </button>
          <button
            className={`${styles.upload_button} ${styles.upload_button_ghost}`}
            onClick={() => setShowUploadForm(true)}>
            Загрузить другое
          </button>
        </div>
      </>
    );
  }

  // обычная форма загрузки
  return (
    <>
      <BackButton to="/" />
      <h1 className={styles.h1_text}>
        {active === 'pdf_docx' ? 'Загрузите резюме в удобном формате' : 'Заполните резюме вручную'}
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
        <button className={styles.upload_button} onClick={handleSubmit} disabled={isLoading}>
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
