import { Link } from 'react-router';
import styles from './ErrorPage.module.scss';

import error3 from '../../assets/404_error3.png';

const ErrorPage = () => {
  return (
    <div className={styles.icon_container}>
      <img src={error3} alt="404 error" />
      <h1 className={styles.title}>Страница не найдена</h1>
      <p className={styles.subtitle}>
        Похоже, такой страницы нет или ссылка устарела.
      </p>
      <Link to="/" className={styles.homeLink}>
        На главную
      </Link>
    </div>
  );
};

export default ErrorPage;
