import { Routes, Route } from 'react-router';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import UploadResumePage from './pages/UploadResumePage/UploadResumePage';
import Header from './components/Header';

function App() {
  return (
    <div className="global_container">
      <Header />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/uploadresume" element={<UploadResumePage />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
