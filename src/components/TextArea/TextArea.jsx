import styles from './TextArea.module.scss';

export default function TextArea() {
  return (
    <div className={styles.textarea_wrapper}>
      <textarea placeholder="Введите текст..." />
    </div>
  );
}
