import { useNavigate } from 'react-router';
import styles from './BackButton.module.scss';

const BackButton = ({ to }) => {
  const navigate = useNavigate();
  return (
    <button className={styles.back_btn} onClick={() => navigate(to)}>
      ← Назад
    </button>
  );
};

export default BackButton;
