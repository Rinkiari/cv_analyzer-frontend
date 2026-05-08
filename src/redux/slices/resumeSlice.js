import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../../config/api';
import { logout } from './authSlice';

const GENERATED_LETTER_KEY = 'analysis_generated_letter';
const PENDING_LETTER_KEY = 'analysis_pending_letter';
const ANALYSIS_HAS_VACANCY_KEY = 'analysis_has_vacancy';
const ANALYSIS_VIEWED_KEY = 'analysis_viewed';
const ANALYSIS_CTA_DISMISSED_KEY = 'analysis_cta_dismissed';
const CV_ID_KEY = 'cvId';
const ANALYSIS_ID_KEY = 'analysisId';
const AUTH_ACCESS_TOKEN_KEY = 'auth_accessToken';
const LETTER_POLL_INTERVAL_MS = 2500;

function canUseStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  );
}

// Гостевое состояние мастера (cvId, analysisId, флаги анализа, письмо) живёт в
// sessionStorage — оно исчезает при закрытии вкладки. У залогиненных
// пользователей — в localStorage, чтобы переживать перезапуск браузера и
// логично сочеталось с историей анализов в /myprofile.
//
// Признак авторизации читаем синхронно из localStorage: authSlice сохраняет
// токен туда до того, как любой код этого слайса обращается к storage,
// поэтому проверка надёжна и при init слайса, и при последующих read/write.
function isAuthenticatedSync() {
  if (!canUseStorage()) return false;
  return Boolean(window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY));
}

function getResumeStorage() {
  if (!canUseStorage()) return null;
  return isAuthenticatedSync() ? window.localStorage : window.sessionStorage;
}

// Удаляем из обеих storage сразу. Это нужно потому, что момент очистки может
// прийтись либо до, либо после смены auth_accessToken (clearResumeState
// дёргается из loginUser ПОСЛЕ persistAuth, а logout extra-reducer — ПОСЛЕ
// clearStoredAuth). Чтобы не оставить хвостов «не в той» storage, чистим везде.
function removeFromBothStorages(key) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

export function readStoredCvId() {
  const storage = getResumeStorage();
  if (!storage) return null;
  return storage.getItem(CV_ID_KEY) || null;
}
function persistCvId(cvId) {
  const storage = getResumeStorage();
  if (!storage) return;
  storage.setItem(CV_ID_KEY, String(cvId));
}
function clearStoredCvId() {
  removeFromBothStorages(CV_ID_KEY);
}

export function readStoredAnalysisId() {
  const storage = getResumeStorage();
  if (!storage) return null;
  return storage.getItem(ANALYSIS_ID_KEY) || null;
}
export function persistAnalysisId(analysisId) {
  const storage = getResumeStorage();
  if (!storage || !analysisId) return;
  storage.setItem(ANALYSIS_ID_KEY, String(analysisId));
}
function clearStoredAnalysisId() {
  removeFromBothStorages(ANALYSIS_ID_KEY);
}

const getAccessToken = (getState) => {
  const tokenFromRedux = getState()?.auth?.accessToken;
  if (tokenFromRedux) return tokenFromRedux;
  if (canUseStorage()) return window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY) || null;
  return null;
};

const getCurrentAnalysisId = (getState) => {
  const analysisIdFromRedux = getState()?.resume?.analysisId;
  if (analysisIdFromRedux) return analysisIdFromRedux;
  return readStoredAnalysisId();
};

const buildHeaders = (token, extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

function readStoredGeneratedLetter() {
  const storage = getResumeStorage();
  if (!storage) return null;
  const raw = storage.getItem(GENERATED_LETTER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.text !== 'string') return null;
    return { analysisId: parsed.analysisId || null, text: parsed.text };
  } catch {
    return null;
  }
}
function persistGeneratedLetter(payload) {
  const storage = getResumeStorage();
  if (!storage) return;
  storage.setItem(GENERATED_LETTER_KEY, JSON.stringify(payload));
}
export function clearStoredGeneratedLetter() {
  removeFromBothStorages(GENERATED_LETTER_KEY);
}

function readStoredAnalysisHasVacancy() {
  const storage = getResumeStorage();
  if (!storage) return null;
  const raw = storage.getItem(ANALYSIS_HAS_VACANCY_KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}
function persistAnalysisHasVacancy(value) {
  const storage = getResumeStorage();
  if (!storage) return;
  storage.setItem(ANALYSIS_HAS_VACANCY_KEY, String(Boolean(value)));
}

// флаг "пользователь уже видел готовый анализ" — нужен шапке,
// чтобы CTA "Анализ готов" исчезал после первого визита на /resultspage
function readStoredAnalysisViewed() {
  const storage = getResumeStorage();
  if (!storage) return false;
  return storage.getItem(ANALYSIS_VIEWED_KEY) === 'true';
}
function persistAnalysisViewed(value) {
  const storage = getResumeStorage();
  if (!storage) return;
  storage.setItem(ANALYSIS_VIEWED_KEY, String(Boolean(value)));
}
function clearStoredAnalysisViewed() {
  removeFromBothStorages(ANALYSIS_VIEWED_KEY);
}

// флаг "пользователь скрыл CTA 'Анализ готов' крестиком" — отдельный от
// analysisViewed, потому что обнуление analysisViewed уведёт пользователя на
// другую CTA ("Продолжите проверку"), а нам нужно именно скрыть подсказку.
// Сбрасывается при старте нового анализа / clearResumeState / logout /
// загрузке нового резюме (resetAnalysisDerivedState).
function readStoredAnalysisCtaDismissed() {
  const storage = getResumeStorage();
  if (!storage) return false;
  return storage.getItem(ANALYSIS_CTA_DISMISSED_KEY) === 'true';
}
function persistAnalysisCtaDismissed(value) {
  const storage = getResumeStorage();
  if (!storage) return;
  storage.setItem(ANALYSIS_CTA_DISMISSED_KEY, String(Boolean(value)));
}
function clearStoredAnalysisCtaDismissed() {
  removeFromBothStorages(ANALYSIS_CTA_DISMISSED_KEY);
}

function clearStoredAnalysisHasVacancy() {
  removeFromBothStorages(ANALYSIS_HAS_VACANCY_KEY);
}

function readStoredPendingLetter() {
  const storage = getResumeStorage();
  if (!storage) return null;
  const raw = storage.getItem(PENDING_LETTER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.letterId || !parsed?.analysisId) return null;
    return { analysisId: String(parsed.analysisId), letterId: String(parsed.letterId) };
  } catch {
    return null;
  }
}
function persistPendingLetter(payload) {
  const storage = getResumeStorage();
  if (!storage) return;
  storage.setItem(PENDING_LETTER_KEY, JSON.stringify(payload));
}
function clearStoredPendingLetter() {
  removeFromBothStorages(PENDING_LETTER_KEY);
}

async function parseErrorMessage(response, fallbackPrefix = 'Ошибка') {
  const fallback = `${fallbackPrefix} (${response.status})`;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (typeof data === 'string') return data;
      return data?.message || data?.error || data?.detail || JSON.stringify(data) || fallback;
    }
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

async function parseLetterIdResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (typeof data === 'string') return data.trim() || null;
    if (data?.id) return String(data.id);
    if (data?.letterId) return String(data.letterId);
    return null;
  }
  // backend may return a quoted JSON string or a bare uuid
  const raw = (await response.text()).trim();
  if (!raw) return null;
  return raw.replace(/^"(.*)"$/s, '$1') || null;
}

async function pollLetterUntilReady({ letterId, token, signal }) {
  // 200 — готово, 202 — продолжаем поллить, 404/500 — ошибка.
  // backend начинает генерацию письма только после готовности результата анализа,
  // поэтому первые ответы могут долго быть 202.
  while (true) {
    if (signal?.aborted) {
      const abortErr = new Error('Генерация прервана');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    const response = await fetch(
      `${API_URL}/letters?letterId=${encodeURIComponent(letterId)}`,
      { method: 'GET', headers: buildHeaders(token), signal },
    );
    if (response.status === 200) {
      const data = await response.json();
      return String(data?.text || '').trim();
    }
    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, LETTER_POLL_INTERVAL_MS));
      continue;
    }
    if (response.status === 404) {
      throw new Error('Письмо не найдено');
    }
    if (response.status === 500) {
      throw new Error('Внутренняя ошибка сервера при генерации письма');
    }
    throw new Error(await parseErrorMessage(response, 'Ошибка получения письма'));
  }
}

export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async (file, { getState, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('uploadedFile', file);

      let url = `${API_URL}/cv/pdf`;
      if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx')
      ) {
        url = `${API_URL}/cv/docx`;
      }

      const token = getAccessToken(getState);
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        return rejectWithValue(text || 'Ошибка загрузки');
      }

      const result = await response.json();
      persistCvId(result);
      return result;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

export const uploadManualResume = createAsyncThunk(
  'resume/uploadManualResume',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { manualForm } = getState().resume;
      const token = getAccessToken(getState);

      const response = await fetch(`${API_URL}/cv/manual`, {
        method: 'POST',
        headers: buildHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(manualForm),
      });

      if (!response.ok) {
        const text = await response.text();
        return rejectWithValue(text || 'Ошибка загрузки');
      }

      const result = await response.json();
      persistCvId(result);
      return result;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

export const startAnalysis = createAsyncThunk(
  'resume/startAnalysis',
  async ({ cvId, link }, { dispatch, rejectWithValue }) => {
    try {
      const body = { cvId };
      if (link) body.link = link;

      const response = await fetch(`${API_URL}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        return rejectWithValue(text);
      }

      clearStoredGeneratedLetter();
      dispatch(clearGeneratedLetter());

      return await response.json();
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

export const generateLetter = createAsyncThunk(
  'resume/generateLetter',
  async (_, { getState, dispatch, rejectWithValue, signal }) => {
    try {
      const analysisId = getCurrentAnalysisId(getState);
      if (!analysisId) return rejectWithValue('Отсутствует analysisId');

      const token = getAccessToken(getState);
      if (!token)
        return rejectWithValue('Для генерации сопроводительного письма нужно войти в аккаунт');

      // переиспользуем letterId, если есть незавершённое поллинг-задание для этого же анализа
      const stored = getState().resume.pendingLetter || readStoredPendingLetter();
      let letterId = stored && stored.analysisId === analysisId ? stored.letterId : null;

      if (!letterId) {
        const response = await fetch(
          `${API_URL}/letters?analysisId=${encodeURIComponent(analysisId)}`,
          { method: 'POST', headers: buildHeaders(token), signal },
        );

        if (!response.ok) {
          return rejectWithValue(await parseErrorMessage(response, 'Ошибка генерации письма'));
        }

        letterId = await parseLetterIdResponse(response);
        if (!letterId) return rejectWithValue('Сервер не вернул идентификатор письма');

        const pending = { analysisId, letterId };
        persistPendingLetter(pending);
        dispatch(setPendingLetter(pending));
      }

      const letterText = await pollLetterUntilReady({ letterId, token, signal });
      const text = letterText || 'Сопроводительное письмо не получено';

      persistGeneratedLetter({ analysisId, text });
      clearStoredPendingLetter();

      return { analysisId, letterId, text };
    } catch (err) {
      clearStoredPendingLetter();
      if (err?.name === 'AbortError') return rejectWithValue('Генерация прервана');
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

// Сбрасывает всё, что было производным от старого analysisId, не трогая
// сам cvId и vacancyInput. Используется в reducers, когда пользователь
// загрузил новое резюме — старый анализ привязан к прошлой паре (cvId, link)
// и больше не валиден.
function resetAnalysisDerivedState(state) {
  clearStoredPendingLetter();
  clearStoredGeneratedLetter();
  clearStoredAnalysisHasVacancy();
  clearStoredAnalysisViewed();
  clearStoredAnalysisCtaDismissed();
  clearStoredAnalysisId();
  state.analysisId = null;
  state.analysisViewed = false;
  state.analysisCtaDismissed = false;
  state.analysisHasVacancy = null;
  state.analysisResult = null;
  state.generatedLetter = null;
  state.pendingLetter = null;
  state.letterStatus = 'idle';
  state.letterError = null;
}

const storedGeneratedLetter = readStoredGeneratedLetter();
const storedPendingLetter = readStoredPendingLetter();
const storedAnalysisHasVacancy = readStoredAnalysisHasVacancy();

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    cvId: readStoredCvId(),
    // Раньше тут стоял хардкод null, из-за чего после перезагрузки шапка не
    // видела "сохранённый" анализ (analysisViewed подгружался, а analysisId — нет)
    // и CTA "Анализ готов" пропадал. Теперь читаем из storage синхронно.
    analysisId: readStoredAnalysisId(),
    analysisViewed: readStoredAnalysisViewed(),
    analysisCtaDismissed: readStoredAnalysisCtaDismissed(),
    analysisHasVacancy: storedAnalysisHasVacancy,
    analysisResult: null,
    responseText: null,
    generatedLetter: storedGeneratedLetter,
    pendingLetter: storedPendingLetter,
    letterStatus: 'idle',
    letterError: null,
    status: 'idle',
    error: null,
    vacancyInput: {
      mode: 'link',
      link: '',
      text: '',
    },
    manualForm: {
      fullName: '',
      position: '',
      skills: '',
      experience: '',
      education: '',
      aboutYourself: '',
    },
  },

  reducers: {
    clearResumeState(state) {
      clearStoredCvId();
      clearStoredGeneratedLetter();
      clearStoredPendingLetter();
      clearStoredAnalysisHasVacancy();
      clearStoredAnalysisViewed();
      clearStoredAnalysisCtaDismissed();
      clearStoredAnalysisId();
      state.cvId = null;
      state.analysisId = null;
      state.analysisViewed = false;
      state.analysisCtaDismissed = false;
      state.analysisHasVacancy = null;
      state.analysisResult = null;
      state.responseText = null;
      state.generatedLetter = null;
      state.pendingLetter = null;
      state.letterStatus = 'idle';
      state.letterError = null;
      state.status = 'idle';
      state.error = null;
      state.vacancyInput = { mode: 'link', link: '', text: '' };
      state.manualForm = {
        fullName: '',
        position: '',
        skills: '',
        experience: '',
        education: '',
        aboutYourself: '',
      };
    },
    updateManualField(state, action) {
      const { field, value } = action.payload;
      state.manualForm[field] = value;
    },
    updateVacancyInput(state, action) {
      const { field, value } = action.payload;
      state.vacancyInput[field] = value;
    },
    clearGeneratedLetter(state) {
      state.generatedLetter = null;
    },
    setPendingLetter(state, action) {
      state.pendingLetter = action.payload || null;
    },
    clearPendingLetter(state) {
      clearStoredPendingLetter();
      state.pendingLetter = null;
    },
    // ResultsPage диспатчит это на mount — после первого визита
    // шапка перестаёт показывать CTA "Анализ готов"
    markAnalysisViewed(state) {
      if (state.analysisViewed) return;
      state.analysisViewed = true;
      persistAnalysisViewed(true);
    },
    // Пользователь скрыл крестиком CTA "Анализ готов" в шапке.
    // Флаг живёт до старта нового анализа / выхода из аккаунта /
    // загрузки нового резюме — там он сбрасывается.
    dismissAnalysisCta(state) {
      if (state.analysisCtaDismissed) return;
      state.analysisCtaDismissed = true;
      persistAnalysisCtaDismissed(true);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(uploadResume.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.cvId = action.payload;
        state.status = 'succeeded';
        state.responseText = action.payload;
        // новое резюме инвалидирует прошлый анализ: analysisId был привязан
        // к предыдущей паре (cvId, link). Если этого не сбросить — шапка
        // на главной решит, что и резюме, и вакансия уже у нас, хотя для
        // нового cvId никакого анализа ещё не запускалось.
        resetAnalysisDerivedState(state);
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadManualResume.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadManualResume.fulfilled, (state, action) => {
        state.cvId = action.payload;
        state.status = 'succeeded';
        state.responseText = action.payload;
        // см. uploadResume.fulfilled — ручное резюме тоже инвалидирует
        // предыдущий анализ
        resetAnalysisDerivedState(state);
      })
      .addCase(uploadManualResume.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(startAnalysis.fulfilled, (state, action) => {
        const hasVacancy = Boolean(action.meta.arg?.link);
        clearStoredPendingLetter();
        persistAnalysisId(action.payload);
        persistAnalysisHasVacancy(hasVacancy);
        // новый анализ — снова требуется "познакомить" пользователя с готовым отчётом
        persistAnalysisViewed(false);
        // и снова показываем CTA в шапке, даже если предыдущий был скрыт крестиком
        persistAnalysisCtaDismissed(false);
        state.analysisId = action.payload;
        state.analysisViewed = false;
        state.analysisCtaDismissed = false;
        state.analysisHasVacancy = hasVacancy;
        state.generatedLetter = null;
        state.pendingLetter = null;
        state.letterStatus = 'idle';
        state.letterError = null;
      })
      .addCase(generateLetter.pending, (state) => {
        state.letterStatus = 'pending';
        state.letterError = null;
      })
      .addCase(generateLetter.fulfilled, (state, action) => {
        state.generatedLetter = {
          analysisId: action.payload.analysisId,
          text: action.payload.text,
        };
        state.pendingLetter = null;
        state.letterStatus = 'succeeded';
        state.letterError = null;
      })
      .addCase(generateLetter.rejected, (state, action) => {
        state.pendingLetter = null;
        state.letterStatus = 'failed';
        state.letterError = action.payload || action.error?.message || 'Ошибка генерации письма';
      })
      .addCase(logout, (state) => {
        clearStoredCvId();
        clearStoredGeneratedLetter();
        clearStoredPendingLetter();
        clearStoredAnalysisHasVacancy();
        clearStoredAnalysisViewed();
        clearStoredAnalysisCtaDismissed();
        clearStoredAnalysisId();
        state.cvId = null;
        state.analysisId = null;
        state.analysisViewed = false;
        state.analysisCtaDismissed = false;
        state.analysisHasVacancy = null;
        state.analysisResult = null;
        state.responseText = null;
        state.generatedLetter = null;
        state.pendingLetter = null;
        state.letterStatus = 'idle';
        state.letterError = null;
        state.status = 'idle';
        state.error = null;
        state.vacancyInput = { mode: 'link', link: '', text: '' };
        state.manualForm = {
          fullName: '',
          position: '',
          skills: '',
          experience: '',
          education: '',
          aboutYourself: '',
        };
      });
  },
});

export const {
  clearResumeState,
  updateManualField,
  updateVacancyInput,
  clearGeneratedLetter,
  setPendingLetter,
  clearPendingLetter,
  markAnalysisViewed,
  dismissAnalysisCta,
} = resumeSlice.actions;

export default resumeSlice.reducer;
