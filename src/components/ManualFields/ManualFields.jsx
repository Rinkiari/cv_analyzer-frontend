import styles from './ManualFields.module.scss';

function ManualFields() {
  return (
    <div className={styles.manual_wrapper}>
      <div className={styles.fio_field}>
        <p>ФИО</p>
        <div
          className={styles.editable}
          contentEditable
          suppressContentEditableWarning={true}></div>
      </div>
      <div className={styles.fio_field}>
        <p>Возраст</p>
        <div
          className={styles.editable}
          contentEditable
          suppressContentEditableWarning={true}></div>
      </div>
      <div className={styles.fio_field}>
        <p>Навыки</p>
        <div
          className={styles.editable}
          contentEditable
          suppressContentEditableWarning={true}></div>
      </div>
      <div className={styles.fio_field}>
        <p>Опыт</p>
        <div
          className={styles.editable}
          contentEditable
          suppressContentEditableWarning={true}></div>
      </div>
      <div className={styles.fio_field}>
        <p>Образование</p>
        <div
          className={styles.editable}
          contentEditable
          suppressContentEditableWarning={true}></div>
      </div>
      <div className={styles.fio_field}>
        <p>О себе</p>
        <div
          className={styles.editable}
          contentEditable
          suppressContentEditableWarning={true}></div>
      </div>
    </div>
  );
}

export default ManualFields;
