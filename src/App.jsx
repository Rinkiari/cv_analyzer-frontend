import { Routes, Route } from 'react-router';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import UploadResumePage from './pages/UploadResumePage/UploadResumePage';
import UploadVacancyPage from './pages/UploadVacancyPage/UploadVacancyPage';
import GenerateLetterPage from './pages/GenerateLetterPage/GenerateLetterPage';
import ResultsPage from './pages/ResultsPage/ResultsPage';
import MyProfilePage from './pages/MyProfilePage/MyProfilePage';
import AuthPage from './pages/AuthPage/AuthPage';
import AboutPage from './pages/AboutPage/AboutPage';
import Header from './components/Header';
import { useTokenRefresh } from './hooks/Usetokenrefresh';

function App() {
  useTokenRefresh();

  return (
    <div className="global_container">
      <Header />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="uploadresume" element={<UploadResumePage />} />
          <Route path="uploadvacancy" element={<UploadVacancyPage />} />
          <Route path="generateletter" element={<GenerateLetterPage />} />
          <Route path="resultspage" element={<ResultsPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="myprofile" element={<MyProfilePage />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
