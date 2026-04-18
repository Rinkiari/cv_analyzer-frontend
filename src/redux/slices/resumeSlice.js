import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../../config/api';
import { logout } from './authSlice';

const getAccessToken = (getState) => {
  const tokenFromRedux = getState()?.auth?.accessToken;
  if (tokenFromRedux) return tokenFromRedux;

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const tokenFromStorage = localStorage.getItem('auth_accessToken');
    return tokenFromStorage || null;
  }

  return null;
};

const buildHeaders = (token, extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

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
  async ({ cvId, link }, { rejectWithValue }) => {
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

      return await response.json(); // analysisId
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    cvId: null,
    analysisId: null,
    analysisResult: null,
    responseText: null,
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
      })
      .addCase(logout, (state) => {
        state.cvId = null;
        state.analysisId = null;
        state.analysisResult = null;
        state.responseText = null;
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

export const { clearResumeState, updateManualField } = resumeSlice.actions;

export default resumeSlice.reducer;
