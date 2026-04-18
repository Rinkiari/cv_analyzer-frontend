import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_URL } from '../../config/api';
import { logout } from './authSlice';

const STORAGE_KEYS = {
  userId: 'auth_userId',
  accessToken: 'auth_accessToken',
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredAuth() {
  if (!canUseStorage()) {
    return { userId: null, accessToken: null };
  }

  return {
    userId: localStorage.getItem(STORAGE_KEYS.userId),
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
  };
}

function getAuthSnapshot(getState) {
  const state = getState?.() || {};
  const userIdFromRedux = state?.auth?.userId;
  const accessTokenFromRedux = state?.auth?.accessToken;

  if (userIdFromRedux || accessTokenFromRedux) {
    return {
      userId: userIdFromRedux || null,
      accessToken: accessTokenFromRedux || null,
    };
  }

  return readStoredAuth();
}

async function parseErrorMessage(response) {
  const fallback = `Ошибка загрузки истории (${response.status})`;

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

export const fetchAnalysesHistory = createAsyncThunk(
  'profile/fetchAnalysesHistory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userId, accessToken } = getAuthSnapshot(getState);

      if (!userId) {
        return rejectWithValue({
          status: 401,
          message: 'Не найден userId. Войдите в аккаунт заново.',
        });
      }

      const url = `${API_URL}/users/analyses?userId=${encodeURIComponent(userId)}`;
      const headers = {};

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return rejectWithValue({
          status: response.status,
          message: await parseErrorMessage(response),
        });
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue({
        status: 500,
        message: error.message || 'Не удалось загрузить историю анализов',
      });
    }
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    analyses: [],
    status: 'idle',
    error: null,
    loaded: false,
  },
  reducers: {
    clearProfileState(state) {
      state.analyses = [];
      state.status = 'idle';
      state.error = null;
      state.loaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalysesHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAnalysesHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.analyses = action.payload;
        state.loaded = true;
      })
      .addCase(fetchAnalysesHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          status: 500,
          message: action.error.message || 'Не удалось загрузить историю анализов',
        };
        state.loaded = true;
      })
      .addCase(logout, (state) => {
        state.analyses = [];
        state.status = 'idle';
        state.error = null;
        state.loaded = false;
      });
  },
});

export const { clearProfileState } = profileSlice.actions;

export const selectProfile = (state) => state.profile;

export default profileSlice.reducer;
