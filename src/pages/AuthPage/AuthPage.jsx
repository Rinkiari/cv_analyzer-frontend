import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spinner } from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import styles from './AuthPage.module.scss';
import { toast } from 'react-toastify';
import { clearAuthError, loginUser, registerUser, selectAuth } from '../../redux/slices/authSlice';
import cvIllustration from '../../assets/cv.png';

const initialLoginForm = { login: '', password: '' };
const initialRegisterForm = { name: '', login: '', password: '', confirmPassword: '' };

// Минимум для регистрации: 8 символов И минимум 2 разных типа (буквы/цифры/спецсимволы).
// Это «защита от дурака», а не PCI-DSS — но мешает '12345' и 'qwerty'.
function evaluatePassword(pw) {
  if (!pw) return { tone: null, label: '', accepted: false, score: 0 };
  const classes =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/\d/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  const longEnough = pw.length >= 8;

  if (!longEnough || classes < 2) {
    return {
      tone: 'weak',
      label: 'Слабый — минимум 8 символов и сочетание букв и цифр',
      accepted: false,
      score: 1,
    };
  }
  if (classes >= 3 || pw.length >= 12) {
    return { tone: 'strong', label: 'Надёжный', accepted: true, score: 3 };
  }
  return { tone: 'medium', label: 'Средний', accepted: true, score: 2 };
}

export default function AuthPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  // Стартовый таб берём из ?mode=register|login — это позволяет шапке вести
  // отдельные ссылки "Регистрация" и "Войти" на одну и ту же страницу,
  // открывая её в нужном табе. При неизвестном/отсутствующем значении — login.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCapsLock, setPasswordCapsLock] = useState(false);
  const [confirmCapsLock, setConfirmCapsLock] = useState(false);

  const isLoading = auth.status === 'loading';
  // synchronous-страж от двойного submit: auth.status переключается на
  // 'loading' только в pending-reducer, а до его прохождения и rerender'а
  // кнопки между двумя подряд нажатиями Enter укладывается ещё один submit.
  const isSubmittingRef = useRef(false);

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setIsAnimating(true);
    setTimeout(() => {
      setMode(nextMode);
      dispatch(clearAuthError());
      setIsAnimating(false);
      // держим URL в синке — чтобы перезагрузка / sharing ссылки сохраняли таб
      setSearchParams(
        nextMode === 'register' ? { mode: 'register' } : {},
        { replace: true },
      );
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

  const handleLoginChange = (field) => (e) =>
    setLoginForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleRegisterChange = (field) => (e) =>
    setRegisterForm((prev) => ({ ...prev, [field]: e.target.value }));

  const passwordStrength = useMemo(
    () => evaluatePassword(registerForm.password),
    [registerForm.password],
  );

  const handleCapsLockProbe = (setter) => (e) => {
    if (typeof e.getModifierState === 'function') {
      setter(e.getModifierState('CapsLock'));
    }
  };

  const getReadableAuthError = (error) => {
    if (!error) return 'Ошибка авторизации';
    if (typeof error === 'string' && error.includes('Invalid login or password'))
      return 'Неверный логин или пароль';
    return error;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    dispatch(clearAuthError());

    try {
      if (mode === 'login') {
        if (!loginForm.login.trim() || !loginForm.password.trim()) {
          toast.warn('Заполните логин и пароль');
          return;
        }
        await dispatch(
          loginUser({ login: loginForm.login.trim(), password: loginForm.password }),
        ).unwrap();
      } else {
        if (!registerForm.name.trim() || !registerForm.login.trim() || !registerForm.password) {
          toast.warn('Заполните имя, логин и пароль');
          return;
        }
        if (!passwordStrength.accepted) {
          toast.warn(
            'Пароль слишком простой: минимум 8 символов и сочетание букв и цифр (или спецсимволов)',
          );
          return;
        }
        if (registerForm.password !== registerForm.confirmPassword) {
          toast.warn('Пароли не совпадают');
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
      // навигацию после успешного логина делает useEffect выше — он же
      // отрабатывает guard для уже залогиненных, заходящих на /login
    } catch (error) {
      toast.error(getReadableAuthError(error));
    } finally {
      isSubmittingRef.current = false;
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
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={mode === 'login' ? loginForm.password : registerForm.password}
                  onChange={
                    mode === 'login'
                      ? handleLoginChange('password')
                      : handleRegisterChange('password')
                  }
                  onKeyDown={handleCapsLockProbe(setPasswordCapsLock)}
                  onKeyUp={handleCapsLockProbe(setPasswordCapsLock)}
                  onBlur={() => setPasswordCapsLock(false)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className={styles.toggleVisibility}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordCapsLock && (
                <span className={styles.capsLockHint}>Включён Caps Lock</span>
              )}
              {mode === 'register' && registerForm.password && (
                <div
                  className={styles.strengthMeter}
                  data-tone={passwordStrength.tone}>
                  <div className={styles.strengthBar}>
                    <span
                      className={styles.strengthFill}
                      style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                    />
                  </div>
                  <span className={styles.strengthLabel}>{passwordStrength.label}</span>
                </div>
              )}
            </label>
            {mode === 'register' && (
              <label className={styles.field}>
                <span>Повторите пароль</span>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange('confirmPassword')}
                    onKeyDown={handleCapsLockProbe(setConfirmCapsLock)}
                    onKeyUp={handleCapsLockProbe(setConfirmCapsLock)}
                    onBlur={() => setConfirmCapsLock(false)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.toggleVisibility}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {confirmCapsLock && (
                  <span className={styles.capsLockHint}>Включён Caps Lock</span>
                )}
              </label>
            )}

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
