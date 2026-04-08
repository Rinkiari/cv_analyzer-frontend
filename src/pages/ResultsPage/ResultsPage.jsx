import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styles from './ResultsPage.module.scss';
import ReactMarkdown from 'react-markdown';

const OPTIONS = [
  { id: 'structure', label: 'Структура и корректность' },
  { id: 'technologies', label: 'Технологии' },
  { id: 'relevance', label: 'Релевантность' },
  { id: 'another', label: 'Прочие рекомендации' },
  { id: 'vacancyComparison', label: 'Сравнение с вакансией' },
];

function ResultsPage() {
  const reduxAnalysisId = useSelector((state) => state.resume.analysisId);

  const analysisId = reduxAnalysisId || localStorage.getItem('analysisId');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [activeTab, setActiveTab] = useState('structure');

  // polling
  useEffect(() => {
    if (!analysisId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8080/analysis?analysisId=${analysisId}`);

        // ГОТОВО
        if (res.status === 200) {
          const data = await res.json();

          setResult(data);
          setLoading(false);
          clearInterval(interval);
        }

        // ЕЩЁ ОБРАБАТЫВАЕТСЯ
        if (res.status === 202) {
          console.log('Анализ ещё не готов...');
        }

        // ОШИБКА
        if (res.status === 500) {
          setErrorState('Ошибка анализа');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (e) {
        setErrorState(e.message);
        setLoading(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [analysisId]);

  const renderResponse = () => {
    if (!result) return null;
    return result[activeTab] || 'Нет данных';
  };

  if (!analysisId) {
    return <h2>Нет данных для анализа</h2>;
  }

  if (loading) {
    return <h2>Анализируем резюме...</h2>;
  }

  if (errorState) {
    return <h2>Ошибка: {errorState}</h2>;
  }

  return (
    <>
      <h1>Результаты анализа</h1>

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
        <div className={styles.textarea_p}>
          <ReactMarkdown>{renderResponse()}</ReactMarkdown>
        </div>
      </div>
    </>
  );
}

export default ResultsPage;
