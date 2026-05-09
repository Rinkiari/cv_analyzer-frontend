import { useDispatch, useSelector } from 'react-redux';
import { updateManualField } from '../../redux/slices/resumeSlice';
import styles from './ManualFields.module.scss';

const FIELDS = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'position', label: 'Позиция' },
  { key: 'skills', label: 'Навыки' },
  { key: 'experience', label: 'Опыт' },
  { key: 'education', label: 'Образование' },
  { key: 'aboutYourself', label: 'О себе' },
];

function ManualFields() {
  const dispatch = useDispatch();
  const manualForm = useSelector((state) => state.resume.manualForm);

  const handleChange = (field) => (e) => {
    dispatch(updateManualField({ field, value: e.target.value }));
  };

  return (
    <div className={styles.manual_wrapper}>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className={styles.fio_field}>
          <p>{label}</p>
          <input
            type="text"
            className={styles.editable}
            value={manualForm[key] ?? ''}
            onChange={handleChange(key)}
          />
        </div>
      ))}
    </div>
  );
}

export default ManualFields;
