import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../../config/api';
import { logout } from './authSlice';

const GENERATED_LETTER_KEY = 'analysis_generated_letter';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const getAccessToken = (getState) => {
  const tokenFromRedux = getState()?.auth?.accessToken;
  if (tokenFromRedux) return tokenFromRedux;

  if (canUseStorage()) {
    const tokenFromStorage = localStorage.getItem('auth_accessToken');
    return tokenFromStorage || null;
  }

  return null;
};

const getCurrentAnalysisId = (getState) => {
  const analysisIdFromRedux = getState()?.resume?.analysisId;
  if (analysisIdFromRedux) return analysisIdFromRedux;

  if (canUseStorage()) {
    return localStorage.getItem('analysisId') || null;
  }

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
    return {
      analysisId: parsed.analysisId || null,
      text: parsed.text,
    };
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

async function parseLetterResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();

    if (typeof data === 'string') return data;
    if (data?.text) return String(data.text);
    if (data?.letter?.text) return String(data.letter.text);
    if (data?.content) return String(data.content);

    return JSON.stringify(data, null, 2);
  }

  return response.text();
}

export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async (file, { getState, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('uploadedFile', file);

      let url = `${API_URL}/cv/pdf`;

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        url = `${API_URL}/cv/docx`;
      }

      if (file.name.toLowerCase().endsWith('.docx')) {
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

      return await response.json();
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
        headers: buildHeaders(token, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(manualForm),
      });

      if (!response.ok) {
        const text = await response.text();
        return rejectWithValue(text || 'Ошибка загрузки');
      }

      return await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        return rejectWithValue(text);
      }

      clearStoredGeneratedLetter();
      dispatch(clearGeneratedLetter());

      return await response.json(); // analysisId
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

export const generateLetter = createAsyncThunk(
  'resume/generateLetter',
  async (_, { getState, rejectWithValue }) => {
    try {
      const analysisId = getCurrentAnalysisId(getState);
      if (!analysisId) {
        return rejectWithValue('Отсутствует analysisId');
      }

      const token = getAccessToken(getState);
      if (!token) {
        return rejectWithValue('Для генерации сопроводительного письма нужно войти в аккаунт');
      }

      const response = await fetch(`${API_URL}/letters?analysisId=${encodeURIComponent(analysisId)}`, {
        method: 'POST',
        headers: buildHeaders(token),
      });

      if (!response.ok) {
        return rejectWithValue(await parseErrorMessage(response, 'Ошибка генерации письма'));
      }

      const letterRaw = await parseLetterResponse(response);
      const letterText = String(letterRaw || '').trim() || 'Сопроводительное письмо не получено';
      persistGeneratedLetter({ analysisId, text: letterText });

      return {
        analysisId,
        text: letterText,
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

const storedGeneratedLetter = readStoredGeneratedLetter();

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    cvId: null,
    analysisId: null,
    analysisResult: null,
    responseText: null,
    generatedLetter: storedGeneratedLetter,
    status: 'idle',
    error: null,
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
      state.cvId = null;
      state.analysisId = null;
      state.analysisResult = null;
      state.responseText = null;
      state.generatedLetter = null;
      state.status = 'idle';
      state.error = null;
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
    clearGeneratedLetter(state) {
      state.generatedLetter = null;
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
        state.analysisId = action.payload;
        state.generatedLetter = null;
      })
      .addCase(generateLetter.fulfilled, (state, action) => {
        state.generatedLetter = action.payload;
      })
      .addCase(logout, (state) => {
        state.cvId = null;
        state.analysisId = null;
        state.analysisResult = null;
        state.responseText = null;
        state.generatedLetter = null;
        state.status = 'idle';
        state.error = null;
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

export const { clearResumeState, updateManualField, clearGeneratedLetter } = resumeSlice.actions;

export default resumeSlice.reducer;
