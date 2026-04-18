import styles from './Header.module.scss';
import { Link, useNavigate } from 'react-router';
import { Button } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectAuth } from '../../redux/slices/authSlice';
import accountpic from '../../assets/portrait2.png';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.header_container}>
      <Link to="/">
        <p className={styles.header_logo}>ResumeIQ</p>
      </Link>
      <div className={styles.header_inner_container}>
        <p>о сервисе</p>
        <p>контакты</p>
        {auth?.isAuthenticated ? (
          <div className={styles.auth_actions}>
            <Link to="/myprofile">
              <img src={accountpic} alt="account" />
            </Link>

            <Button
              className={styles.login_button}
              onClick={handleLogout}
              height="35.1px"
              width="135px"
              borderRadius="16px"
              variant="subtle"
              bg="#000"
              color="#FBC02D"
              _hover={{ bg: '#161616' }}>
              выйти
            </Button>
          </div>
        ) : (
          <Button
            asChild
            height="35.1px"
            width="135px"
            borderRadius="16px"
            variant="subtle"
            bg="#000">
            <Link to="/login" className={styles.login_button}>
              войти
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
export default Header;
