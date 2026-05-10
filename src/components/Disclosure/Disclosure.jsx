import { useEffect, useId, useRef, useState } from 'react';
import styles from './Disclosure.module.scss';

// Брейкпойнт «телефонов» — совпадает с проектным @media (max-width: 560px),
// который уже используется в Header / Dropzone / page-styles. Согласованность
// важна: всё, что мы прячем под этот disclosure, на той же ширине уже
// перекрашивается в «мобильный» режим в соседних местах.
const MOBILE_BREAKPOINT = '(max-width: 560px)';

// chevron-down — поворачивается на 180° когда disclosure раскрыт
const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Хук «совпадает ли текущий вьюпорт с media query». Initializer читает
// matchMedia синхронно, поэтому первый рендер уже знает корректное значение —
// нет flash-of-disclosure на десктопе и не моргает контент.
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    // addEventListener — современный API; на совсем древних Safari fallback
    // на addListener не закладываем, у нас Vite/современный билд.
    mql.addEventListener('change', onChange);
    // переснимаем при mount: между init и effect возможен resize
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// Универсальный «раскрывашка»: чип-триггер + плавно растущий вниз контент.
// Используется на uploadresume / uploadvacancy / generateletter, чтобы
// справочные карточки (infoCard, featuresCard) на телефонах не занимали место
// по умолчанию. На десктопе (≥561px) компонент НЕ рисует ни триггер, ни
// обёртку — просто отдаёт children наружу, так что карточки выглядят
// ровно так же, как до появления disclosure.
//
// Высоту контента (для мобильной анимации) меряем через ResizeObserver от
// scrollHeight внутреннего узла — при изменении ширины окна (карточки
// переносятся, меняют высоту) max-height пересчитывается, и анимация в
// открытом состоянии остаётся корректной.
export default function Disclosure({
  label = 'Подробнее',
  defaultOpen = false,
  children,
}) {
  // Хуки вызываем безусловно, ДО любого early return — иначе нарушится
  // правило «одинаковый порядок хуков на каждом рендере».
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [open, setOpen] = useState(defaultOpen);
  const [height, setHeight] = useState(0);
  const innerRef = useRef(null);
  const reactId = useId();
  const contentId = `disclosure-${reactId}`;

  useEffect(() => {
    // На десктопе мы не рендерим .inner, ref.current === null — эффект
    // безопасно short-circuit'ится. При ресайзе в mobile компонент
    // перемонтируется и эффект перевыполнится.
    const node = innerRef.current;
    if (!node) return;

    const measure = () => setHeight(node.scrollHeight);
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [isMobile]);

  // Десктоп / планшеты: возвращаем детей как есть. Их собственные стили
  // (например, .infoCard { margin-top: 20px } у страниц) дают точно такой же
  // отступ от subtitle, как было до введения Disclosure — пиксель-в-пиксель.
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={styles.disclosure}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}>
        <span className={styles.label}>{label}</span>
        <span className={styles.chevron} aria-hidden="true">
          <Chevron />
        </span>
      </button>

      <div
        id={contentId}
        className={styles.content}
        style={{ maxHeight: open ? `${height}px` : 0 }}
        aria-hidden={!open}>
        <div ref={innerRef} className={styles.inner}>
          {children}
        </div>
      </div>
    </div>
  );
}
