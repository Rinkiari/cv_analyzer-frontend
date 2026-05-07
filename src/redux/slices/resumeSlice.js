import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../../config/api';
import { logout } from './authSlice';

const GENERATED_LETTER_KEY = 'analysis_generated_letter';
const PENDING_LETTER_KEY = 'analysis_pending_letter';
const ANALYSIS_HAS_VACANCY_KEY = 'analysis_has_vacancy';
const CV_ID_KEY = 'cvId';
const LETTER_POLL_INTERVAL_MS = 2500;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredCvId() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(CV_ID_KEY) || null;
}
function persistCvId(cvId) {
  if (!canUseStorage()) return;
  localStorage.setItem(CV_ID_KEY, String(cvId));
}
function clearStoredCvId() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CV_ID_KEY);
}

const getAccessToken = (getState) => {
  const tokenFromRedux = getState()?.auth?.accessToken;
  if (tokenFromRedux) return tokenFromRedux;
  if (canUseStorage()) return localStorage.getItem('auth_accessToken') || null;
  return null;
};

const getCurrentAnalysisId = (getState) => {
  const analysisIdFromRedux = getState()?.resume?.analysisId;
  if (analysisIdFromRedux) return analysisIdFromRedux;
  if (canUseStorage()) return localStorage.getItem('analysisId') || null;
  return null;
};

const buildHeaders = (token, extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

function readStoredGeneratedLetter() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(GENERATED_LETTER_KEY);
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
  if (!canUseStorage()) return;
  localStorage.setItem(GENERATED_LETTER_KEY, JSON.stringify(payload));
}
function clearStoredGeneratedLetter() {
  if (!canUseStorage()) return;
  localStorage.removeItem(GENERATED_LETTER_KEY);
}

function readStoredAnalysisHasVacancy() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(ANALYSIS_HAS_VACANCY_KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}
function persistAnalysisHasVacancy(value) {
  if (!canUseStorage()) return;
  localStorage.setItem(ANALYSIS_HAS_VACANCY_KEY, String(Boolean(value)));
}
function clearStoredAnalysisHasVacancy() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ANALYSIS_HAS_VACANCY_KEY);
}

function readStoredPendingLetter() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(PENDING_LETTER_KEY);
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
  if (!canUseStorage()) return;
  localStorage.setItem(PENDING_LETTER_KEY, JSON.stringify(payload));
}
function clearStoredPendingLetter() {
  if (!canUseStorage()) return;
  localStorage.removeItem(PENDING_LETTER_KEY);
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

const storedGeneratedLetter = readStoredGeneratedLetter();
const storedPendingLetter = readStoredPendingLetter();
const storedAnalysisHasVacancy = readStoredAnalysisHasVacancy();

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    cvId: readStoredCvId(),
    analysisId: null,
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
      if (canUseStorage()) localStorage.removeItem('analysisId');
      state.cvId = null;
      state.analysisId = null;
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
      })
      .addCase(uploadManualResume.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(startAnalysis.fulfilled, (state, action) => {
        const hasVacancy = Boolean(action.meta.arg?.link);
        clearStoredPendingLetter();
        persistAnalysisHasVacancy(hasVacancy);
        state.analysisId = action.payload;
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
        if (canUseStorage()) localStorage.removeItem('analysisId');
        state.cvId = null;
        state.analysisId = null;
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
} = resumeSlice.actions;

export default resumeSlice.reducer;
