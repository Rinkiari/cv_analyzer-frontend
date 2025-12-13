import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('uploadedFile', file);

      const response = await fetch('http://localhost:8080/cv/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        return rejectWithValue(text || 'Ошибка загрузки');
      }

      const dataText = await response.text();
      return dataText;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    responseText: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearResumeState(state) {
      state.responseText = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadResume.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.responseText = action.payload;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearResumeState } = resumeSlice.actions;
export default resumeSlice.reducer;
