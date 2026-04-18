import { configureStore } from '@reduxjs/toolkit';
import resumeReducer from '../slices/resumeSlice';
import authReducer from '../slices/authSlice';

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
    auth: authReducer,
  },
});

export default store;
