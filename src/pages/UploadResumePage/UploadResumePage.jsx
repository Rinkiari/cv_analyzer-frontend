import { useState } from 'react';
import styles from './UploadResumePage.module.scss';
import { toast } from 'react-toastify';
import Dropzone from '../../components/Dropzone/Dropzone';
import ManualFields from '../../components/ManualFields/ManualFields';
import { Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { uploadResume, uploadManualResume } from '../../redux/slices/resumeSlice';
import cvpng from '../../assets/cv.png';

const UploadResumePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const existingCvId = useSelector((state) => state.resume.cvId);
  const manualForm = useSelector((state) => state.resume.manualForm);

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
      toast.warn('Выберите файл перед загрузкой');
      return;
    }
    setIsLoading(true);
    try {
      const result = await dispatch(uploadResume(file)).unwrap();
      console.log('Ответ сервера (сохранён в стор):', result);
      navigate('/uploadvacancy');
      toast.success('Файл успешно загружен!');
    } catch (err) {
      console.error('Ошибка при загрузке через thunk:', err);
      toast.error('Не удалось загрузить файл: ' + (err || 'Неизвестная ошибка'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualUpload = async () => {
    const isEmpty = Object.values(manualForm).some((v) => !v || !v.toString().trim());
    if (isEmpty) {
      toast.warn('Заполните все поля резюме');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(uploadManualResume()).unwrap();
      navigate('/uploadvacancy');
    } catch (e) {
      console.log(e);
      toast.error('Не удалось загрузить файл: ' + (e || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        {/* левый блок — описание шага.
            Номер шага рисует Header (контекстная полоса), здесь не дублируем. */}
        <div className={styles.titleBlock}>
          <h1 className={styles.cardTitle}>Загрузите ваше резюме</h1>
          <p className={styles.subtitle}>
            Загрузите готовый файл или заполните резюме вручную — мы разберём его и подготовим
            персональный анализ.
          </p>
          <div className={styles.infoCard}>
            <img src={cvpng} alt="cv icon" />
            <div>
              <h3>Поддерживаемые форматы</h3>
              <p>
                PDF и DOCX — самые распространённые форматы резюме. Можно также заполнить вручную.
              </p>
            </div>
          </div>

          <div className={styles.featuresCard}>
            <h4>Что мы извлечём</h4>
            <ul>
              <li>ФИО и желаемую позицию</li>
              <li>Опыт работы и проекты</li>
              <li>Навыки и технологии</li>
              <li>Образование и сертификаты</li>
            </ul>
          </div>
        </div>

        {/* правый блок — форма или баннер «уже загружено» */}
        <div className={styles.actionCard}>
          {/* баннер «резюме уже загружено» */}
          {!showUploadForm && existingCvId ? (
            <>
              <div className={styles.alreadyBlock}>
                <div className={styles.alreadyIcon}>✓</div>
                <div>
                  <p className={styles.alreadyTitle}>Резюме уже загружено</p>
                  <p className={styles.alreadySub}>Можно продолжить или загрузить другое</p>
                </div>
              </div>
              <div className={styles.buttonsRow}>
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
          ) : (
            /* обычная форма загрузки */
            <>
              <div>
                <p className={styles.kicker}>Источник резюме</p>
                <div className={styles.segmentedControl}>
                  <span
                    className={styles.slider}
                    style={{
                      transform: active === 'pdf_docx' ? 'translateX(0%)' : 'translateX(100%)',
                    }}
                  />
                  <button
                    className={`${styles.segBtn} ${active === 'pdf_docx' ? styles.segActive : ''}`}
                    onClick={() => setActive('pdf_docx')}>
                    PDF / DOCX
                  </button>
                  <button
                    className={`${styles.segBtn} ${active === 'manual' ? styles.segActive : ''}`}
                    onClick={() => setActive('manual')}>
                    Вручную
                  </button>
                </div>

                <div className={styles.inputWrapper}>
                  {active === 'pdf_docx' ? <Dropzone onFileSelect={setFile} /> : <ManualFields />}
                </div>
              </div>

              <div className={styles.buttonsRow}>
                <button
                  className={styles.upload_button}
                  onClick={handleSubmit}
                  disabled={isLoading}>
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
          )}
        </div>
      </section>
    </main>
  );
};

export default UploadResumePage;
