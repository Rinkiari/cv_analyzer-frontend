import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_URL } from '../../config/api';
import { clearResumeState } from './resumeSlice';

const STORAGE_KEYS = {
  userId: 'auth_userId',
  accessToken: 'auth_accessToken',
  refreshToken: 'auth_refreshToken',
  accessTokenExpiresAt: 'auth_accessTokenExpiresAt',
  refreshTokenExpiresAt: 'auth_refreshTokenExpiresAt',
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emptyStoredAuth() {
  return {
    userId: null,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  };
}

function readStoredAuth() {
  if (!canUseStorage()) return emptyStoredAuth();

  const stored = {
    userId: localStorage.getItem(STORAGE_KEYS.userId),
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
    accessTokenExpiresAt: Number(localStorage.getItem(STORAGE_KEYS.accessTokenExpiresAt)) || null,
    refreshTokenExpiresAt: Number(localStorage.getItem(STORAGE_KEYS.refreshTokenExpiresAt)) || null,
  };

  // Если refresh-token уже протух, восстановить сессию нечем — без него и
  // /auth/refresh не сработает. Чистим storage, чтобы isAuthenticatedSync в
  // resumeSlice тоже видел гостя, а не считал его залогиненным.
  if (stored.refreshTokenExpiresAt && stored.refreshTokenExpiresAt <= Date.now()) {
    clearStoredAuth();
    return emptyStoredAuth();
  }

  return stored;
}

function persistAuth(payload) {
  if (!canUseStorage()) return;

  const { userId, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } =
    payload;

  if (userId) localStorage.setItem(STORAGE_KEYS.userId, userId);
  if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  if (accessTokenExpiresAt) {
    localStorage.setItem(STORAGE_KEYS.accessTokenExpiresAt, String(accessTokenExpiresAt));
  }
  if (refreshTokenExpiresAt) {
    localStorage.setItem(STORAGE_KEYS.refreshTokenExpiresAt, String(refreshTokenExpiresAt));
  }
}

function clearStoredAuth() {
  if (!canUseStorage()) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

function toExpiryTimestamp(expiresIn) {
  const value = Number(expiresIn);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Date.now() + value * 60 * 1000;
}

function normalizeAuthPayload(data) {
  return {
    userId: data?.userId ?? null,
    accessToken: data?.accessToken ?? null,
    refreshToken: data?.refreshToken ?? null,
    accessTokenExpiresAt: toExpiryTimestamp(data?.accessTokenExpiresIn),
    refreshTokenExpiresAt: toExpiryTimestamp(data?.refreshTokenExpiresIn),
  };
}

async function parseErrorMessage(response) {
  const fallback = `Ошибка авторизации (${response.status})`;

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data?.message || data?.error || data?.detail || JSON.stringify(data) || fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

async function authRequest(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ login, password }, { dispatch, rejectWithValue }) => {
    try {
      const data = await authRequest('/auth/login', { login, password });
      const auth = normalizeAuthPayload(data);
      persistAuth(auth);
      dispatch(clearResumeState());
      return auth;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось войти');
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, login, password }, { dispatch, rejectWithValue }) => {
    try {
      const data = await authRequest('/auth/register', { name, login, password });
      const auth = normalizeAuthPayload(data);
      persistAuth(auth);
      dispatch(clearResumeState());
      return auth;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось зарегистрироваться');
    }
  },
);

export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userId, accessToken } = getState().auth;
      if (!userId) return rejectWithValue('Отсутствует userId');

      const response = await fetch(`${API_URL}/users?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось загрузить пользователя');
    }
  },
);

export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().auth;
      const refreshToken = state.refreshToken || readStoredAuth().refreshToken;

      if (!refreshToken) {
        throw new Error('Отсутствует refresh token');
      }

      const data = await authRequest('/auth/refresh', { refreshToken });
      const auth = normalizeAuthPayload(data);
      persistAuth(auth);
      return auth;
    } catch (error) {
      clearStoredAuth();
      return rejectWithValue(error.message || 'Не удалось обновить токен');
    }
  },
);

const storedAuth = readStoredAuth();

const initialState = {
  userId: storedAuth.userId,
  accessToken: storedAuth.accessToken,
  refreshToken: storedAuth.refreshToken,
  accessTokenExpiresAt: storedAuth.accessTokenExpiresAt,
  refreshTokenExpiresAt: storedAuth.refreshTokenExpiresAt,
  firstName: null,
  lastName: null,
  userInfoStatus: 'idle',
  status: 'idle',
  error: null,
  isAuthenticated: Boolean(storedAuth.accessToken && storedAuth.refreshToken),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.userId = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.accessTokenExpiresAt = null;
      state.refreshTokenExpiresAt = null;
      state.firstName = null;
      state.lastName = null;
      state.userInfoStatus = 'idle';
      state.status = 'idle';
      state.error = null;
      state.isAuthenticated = false;
      clearStoredAuth();
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
    };

    const rejected = (state, action) => {
      state.status = 'failed';
      state.error = action.payload || action.error.message || 'Ошибка авторизации';
    };

    const fulfilled = (state, action) => {
      state.userId = action.payload.userId;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.accessTokenExpiresAt = action.payload.accessTokenExpiresAt;
      state.refreshTokenExpiresAt = action.payload.refreshTokenExpiresAt;
      state.status = 'succeeded';
      state.error = null;
      state.isAuthenticated = true;
      // userId сменился — старое имя больше не релевантно, пусть подгрузится заново
      state.firstName = null;
      state.lastName = null;
      state.userInfoStatus = 'idle';
    };

    builder
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, fulfilled)
      .addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, fulfilled)
      .addCase(registerUser.rejected, rejected)
      .addCase(refreshTokens.pending, pending)
      .addCase(refreshTokens.fulfilled, fulfilled)
      .addCase(refreshTokens.rejected, rejected)
      .addCase(fetchUserInfo.pending, (state) => {
        state.userInfoStatus = 'loading';
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.firstName = action.payload?.firstName || null;
        state.lastName = action.payload?.lastName || null;
        state.userInfoStatus = 'succeeded';
      })
      .addCase(fetchUserInfo.rejected, (state) => {
        state.userInfoStatus = 'failed';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export const selectAuth = (state) => state.auth;

export default authSlice.reducer;
