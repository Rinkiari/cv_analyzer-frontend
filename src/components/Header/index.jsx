import styles from './Header.module.scss';
import { Link, useNavigate } from 'react-router';
import { Button } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectAuth } from '../../redux/slices/authSlice';
import { clearGeneratedLetter } from '../../redux/slices/resumeSlice';
import accountpic from '../../assets/portrait2.png';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analysis_generated_letter');
    }
    dispatch(clearGeneratedLetter());
    dispatch(logout());
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.header_container}>
      <Link to="/" className={styles.logo} aria-label="ResumeIQ — на главную">
        <span className={styles.logoMark} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* документ */}
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            {/* галочка внутри */}
            <polyline points="9 14 11 16 15 12" />
          </svg>
        </span>
        <span className={styles.logoText}>
          Resume<span className={styles.logoTextAccent}>IQ</span>
        </span>
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
