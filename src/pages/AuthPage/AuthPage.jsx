import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spinner } from '@chakra-ui/react';
import styles from './AuthPage.module.scss';
import { clearAuthError, loginUser, registerUser, selectAuth } from '../../redux/slices/authSlice';
import cvIllustration from '../../assets/cv.png';

const initialLoginForm = {
  login: '',
  password: '',
};

const initialRegisterForm = {
  name: '',
  login: '',
  password: '',
  confirmPassword: '',
};

export default function AuthPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  const [isAnimating, setIsAnimating] = useState(false);

  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [localError, setLocalError] = useState('');
  const errorMessage = localError || auth.error || '';

  const isLoading = auth.status === 'loading';

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;

    setIsAnimating(true);

    setTimeout(() => {
      setMode(nextMode);
      setLocalError('');
      dispatch(clearAuthError());
      setIsAnimating(false);
    }, 200);
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.accessToken) {
      navigate('/uploadresume', { replace: true });
    }
  }, [auth.isAuthenticated, auth.accessToken, navigate]);

  const title = useMemo(() => (mode === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'), [mode]);

  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Войдите, чтобы воспользоваться дополнительным функционалом'
        : 'Создайте аккаунт и сохраните доступ к результатам и сессии.',
    [mode],
  );

  const handleLoginChange = (field) => (event) => {
    setLoginForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRegisterChange = (field) => (event) => {
    setRegisterForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const getReadableAuthError = (error) => {
    if (!error) return 'Ошибка авторизации';

    if (typeof error === 'string' && error.includes('Invalid login or password')) {
      return 'Неверный логин или пароль';
    }

    return error;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLocalError('');
    dispatch(clearAuthError());

    try {
      if (mode === 'login') {
        if (!loginForm.login.trim() || !loginForm.password.trim()) {
          setLocalError('Заполните логин и пароль');
          return;
        }

        await dispatch(
          loginUser({
            login: loginForm.login.trim(),
            password: loginForm.password,
          }),
        ).unwrap();
      } else {
        if (!registerForm.name.trim() || !registerForm.login.trim() || !registerForm.password) {
          setLocalError('Заполните имя, логин и пароль');
          return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
          setLocalError('Пароли не совпадают');
          return;
        }

        await dispatch(
          registerUser({
            name: registerForm.name.trim(),
            login: registerForm.login.trim(),
            password: registerForm.password,
          }),
        ).unwrap();
      }

      navigate('/', { replace: true });
    } catch (error) {
      setLocalError(getReadableAuthError(error));
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.hero} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>ResumeIQ</p>
          <h1>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>

          <div className={styles.heroCard}>
            <img src={cvIllustration} alt="resume illustration" />
            <div>
              <h2>Один аккаунт для всего сервиса</h2>
              <p>Вход, регистрация и обновление сессии без повторного логина.</p>
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.switcher}>
            <button
              type="button"
              className={`${styles.switchButton} ${mode === 'login' ? styles.active : ''}`}
              onClick={() => switchMode('login')}>
              Вход
            </button>
            <button
              type="button"
              className={`${styles.switchButton} ${mode === 'register' ? styles.active : ''}`}
              onClick={() => switchMode('register')}>
              Регистрация
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  value={registerForm.name}
                  onChange={handleRegisterChange('name')}
                  placeholder="Александр"
                  autoComplete="name"
                />
              </label>
            )}

            <label className={styles.field}>
              <span>Логин</span>
              <input
                value={mode === 'login' ? loginForm.login : registerForm.login}
                onChange={
                  mode === 'login' ? handleLoginChange('login') : handleRegisterChange('login')
                }
                placeholder="Alex"
                autoComplete="username"
              />
            </label>

            <label className={styles.field}>
              <span>Пароль</span>
              <input
                type="password"
                value={mode === 'login' ? loginForm.password : registerForm.password}
                onChange={
                  mode === 'login'
                    ? handleLoginChange('password')
                    : handleRegisterChange('password')
                }
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            {mode === 'register' && (
              <label className={styles.field}>
                <span>Повторите пароль</span>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange('confirmPassword')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </label>
            )}

            {errorMessage && <div className={styles.error}>{errorMessage}</div>}

            <Button
              type="submit"
              height="48px"
              borderRadius="16px"
              bg="#000"
              color="#FBC02D"
              fontSize="18px"
              _hover={{ bg: '#161616' }}
              isDisabled={isLoading}
              width="100%">
              {isLoading ? (
                <>
                  <Spinner size="sm" thickness="3px" speed="0.65s" mr="8px" />
                  {mode === 'login' ? 'Входим...' : 'Регистрируем...'}
                </>
              ) : mode === 'login' ? (
                'Войти'
              ) : (
                'Создать аккаунт'
              )}
            </Button>
          </form>

          <div className={styles.footerRow}>
            <p>
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
            <Link to="/" className={styles.backLink}>
              На главную
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
