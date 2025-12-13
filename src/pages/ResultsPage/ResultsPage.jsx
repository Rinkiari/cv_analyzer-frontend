import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ResultsPage.module.scss';

const OPTIONS = [
  { id: 'structure', label: 'Структура и корректность' },
  { id: 'tech', label: 'Технологии' },
  { id: 'relevance', label: 'Релевантность' },
  { id: 'other', label: 'Прочие рекомендации' },
  { id: 'letter', label: 'Письмо' },
];

function ResultsPage() {
  // берем сразу весь слайс, чтобы видеть форму данных
  const resume = useSelector((state) => state.resume);
  const { responseText, status, error } = resume;

  const [activeTab, setActiveTab] = useState('structure');

  const renderResponse = () => {
    if (!responseText) return null;

    // if это string - рендерим как есть
    if (typeof responseText === 'string') return responseText;

    // Если это объект/массив — аккуратно сериализуем для отображения
    try {
      return JSON.stringify(responseText, null, 2);
    } catch (e) {
      console.log(e);
      return String(responseText);
    }
  };

  return (
    <>
      <h1>Результаты анализа</h1>

      <p className={styles.podzagolovok_p}>
        {status === 'idle' && 'Вы ещё не загрузили резюме...'}
        {status === 'loading' && 'Загрузка результата...'}
        {status === 'failed' && `Ошибка: ${error}`}
      </p>

      <div className={styles.options_div}>
        {OPTIONS.map((option) => (
          <p
            key={option.id}
            className={`${styles.option_item} ${activeTab === option.id ? styles.active : ''}`}
            onClick={() => setActiveTab(option.id)}>
            {option.label}
          </p>
        ))}
      </div>

      <div className={styles.textarea_div}>
        {/* if ответ — многострочный json, лучше использовать <pre> для сохранения форматирования */}
        {status === 'succeeded' && responseText ? (
          <p className={styles.textarea_p}>
            {renderResponse()} {/* позже здесь будет логика по activeTab */}
          </p>
        ) : (
          status === 'idle' && <p className={styles.textarea_p}>Результат ещё не получен.</p>
        )}
      </div>
    </>
  );
}

export default ResultsPage;
