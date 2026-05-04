import { useNavigate } from 'react-router';
import styles from './BackButton.module.scss';

const BackButton = ({ to }) => {
  const navigate = useNavigate();
  return (
    <button className={styles.back_btn} onClick={() => navigate(to)} aria-label="Назад">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <span>Назад</span>
    </button>
  );
};

export default BackButton;
