import styles from './Header.module.scss';
import { Button } from '@chakra-ui/react';

const Header = () => {
  return (
    <div className={styles.header_container}>
      <p className={styles.header}>ResumeIQ</p>
      <p>о сервисе</p>
      <p>контакты</p>
      <Button asChild size="md" variant="solid" rounded="2xl">
        <a href="#">войти</a>
      </Button>
    </div>
  );
};
export default Header;
