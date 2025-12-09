export default function TestOutputPage({ output }) {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Ответ от сервера</h1>

      <div
        style={{
          width: '1000px',
          padding: '16px',
          borderRadius: '12px',
          background: '#f0f0f0',
          fontSize: '22px',
          minHeight: '80px',
          whiteSpace: 'pre-wrap',
        }}>
        {output || 'Пока нет данных'}
      </div>
    </div>
  );
}
