import { useDispatch } from 'react-redux';
import { updateManualField } from '../../slices/resumeSlice';
import styles from './ManualFields.module.scss';

function ManualFields() {
  const dispatch = useDispatch();

  const handleInput = (field) => (e) => {
    dispatch(
      updateManualField({
        field,
        value: e.currentTarget.innerText,
      }),
    );
  };

  return (
    <div className={styles.manual_wrapper}>
      <div className={styles.fio_field}>
        <p>ФИО</p>
        <div
          className={styles.editable}
          contentEditable
          onInput={handleInput('fullName')}
          suppressContentEditableWarning
        />
      </div>

      <div className={styles.fio_field}>
        <p>Позиция</p>
        <div
          className={styles.editable}
          contentEditable
          onInput={handleInput('position')}
          suppressContentEditableWarning
        />
      </div>

      <div className={styles.fio_field}>
        <p>Навыки</p>
        <div
          className={styles.editable}
          contentEditable
          onInput={handleInput('skills')}
          suppressContentEditableWarning
        />
      </div>

      <div className={styles.fio_field}>
        <p>Опыт</p>
        <div
          className={styles.editable}
          contentEditable
          onInput={handleInput('experience')}
          suppressContentEditableWarning
        />
      </div>
      <div className={styles.fio_field}>
        <p>Образование</p>
        <div
          className={styles.editable}
          contentEditable
          onInput={handleInput('education')}
          suppressContentEditableWarning
        />
      </div>

      <div className={styles.fio_field}>
        <p>О себе</p>
        <div
          className={styles.editable}
          contentEditable
          onInput={handleInput('aboutYourself')}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}

export default ManualFields;
