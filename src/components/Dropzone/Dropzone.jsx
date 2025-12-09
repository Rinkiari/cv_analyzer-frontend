import { useState, useRef } from 'react';
import styles from './Dropzone.module.scss';
import cloudpic from '../../assets/cloud.png';
import clearIcon from '../../assets/fknbin.png';

export default function Dropzone({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
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

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    validateAndSend(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    inputRef.current.value = '';
  };

  return (
    <div
      className={`${styles.upload_wrapper} ${isDragging ? styles.dragging : ''}`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}>
      <img className={styles.cloud_picture} src={cloudpic} alt="cloud" />
      <h3>Выберите файл в формате PDF или DOCX</h3>
      <p className={styles.drugIt_text}>или перетащите его сюда</p>
      {selectedFile && (
        <div className={styles.fileBox}>
          <p className={styles.fileName}>{selectedFile.name}</p>
          <img src={clearIcon} alt="remove" className={styles.removeIcon} onClick={clearFile} />
        </div>
      )}

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
