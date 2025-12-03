import styles from './Header.module.scss';
import { Button } from '@chakra-ui/react';

const Header = () => {
  return (
    <div className={styles.header_container}>
      <p className={styles.header_logo}>ResumeIQ</p>
      <div className={styles.header_inner_container}>
        <p>о сервисе</p>
        <p>контакты</p>
        <Button
          asChild
          height="35.1px"
          width="135px"
          borderRadius="16px"
          variant="subtle"
          bg="#000">
          <a href="#" className={styles.login_button}>
            войти
          </a>
        </Button>
      </div>
    </div>
  );
};
export default Header;
