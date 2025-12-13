import styles from './ErrorPage.module.scss';

import error3 from '../../assets/404_error3.png';

const ErrorPage = () => {
  return (
    <>
      <div>Error page</div>
      <div className={styles.icon_container}>
        <img src={error3} alt="404 error" />
      </div>
    </>
  );
};

export default ErrorPage;
