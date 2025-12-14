import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const uploadResume = createAsyncThunk(
  'resume/uploadResume',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('uploadedFile', file);

      let url = 'http://localhost:8080/cv/pdf';

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        url = 'http://localhost:8080/cv/docx';
      }

      if (file.name.toLowerCase().endsWith('.docx')) {
        url = 'http://localhost:8080/cv/docx';
      }

      const response = await fetch(url, {
        method: 'POST',
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

      const response = await fetch('http://localhost:8080/cv/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
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
      state.responseText = null;
      state.status = 'idle';
      state.error = null;
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
        state.status = 'succeeded';
        state.responseText = action.payload;
      })
      .addCase(uploadManualResume.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearResumeState, updateManualField } = resumeSlice.actions;

export default resumeSlice.reducer;
