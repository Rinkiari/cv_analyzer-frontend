import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ResultsPage.module.scss';
import ReactMarkdown from 'react-markdown';

const OPTIONS = [
  { id: 'structure', label: 'Структура и корректность' },
  { id: 'technologies', label: 'Технологии' },
  { id: 'relevance', label: 'Релевантность' },
  { id: 'another', label: 'Прочие рекомендации' },
  // { id: 'letter', label: 'Письмо' },
];

function ResultsPage() {
  // берем сразу весь слайс, чтобы видеть форму данных
  const resume = useSelector((state) => state.resume);
  const { responseText, status, error } = resume;

  const [activeTab, setActiveTab] = useState('structure');

  const renderResponse = () => {
    if (!responseText) return null;

    if (typeof responseText === 'string') {
      return responseText;
    }

    if (typeof responseText === 'object') {
      return responseText[activeTab] || 'Нет данных для этого раздела';
    }

    return String(responseText);
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
        {status === 'succeeded' && responseText ? (
          <div className={styles.textarea_p}>
            <ReactMarkdown>{renderResponse()}</ReactMarkdown>
          </div>
        ) : (
          status === 'idle' && <p className={styles.textarea_p}>Результат ещё не получен.</p>
        )}
      </div>
    </>
  );
}

export default ResultsPage;
