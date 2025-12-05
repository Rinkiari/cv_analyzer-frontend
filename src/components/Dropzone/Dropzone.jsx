import { useState, useRef } from 'react';
import styles from './Dropzone.module.scss';

export default function Dropzone({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    validateAndSend(file);
  };

  const validateAndSend = (file) => {
    if (!file) return;

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowed.includes(file.type)) {
      alert('Разрешены только PDF и DOCX файлы.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    validateAndSend(file);
  };

  return (
    <div
      className={`${styles.upload_wrapper} ${isDragging ? styles.dragging : ''}`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}>
      <img src="../../assets/cloud.png" alt="cloud" />
      <h3>Выберите файл в формате PDF или DOCX</h3>
      <p>или перетащите его сюда</p>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        ref={inputRef}
        className={styles.hidden_input}
        onChange={handleSelectFile}
      />
    </div>
  );
}
