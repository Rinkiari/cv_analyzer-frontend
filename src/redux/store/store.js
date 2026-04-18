import { configureStore } from '@reduxjs/toolkit';
import resumeReducer from '../slices/resumeSlice';
import authReducer from '../slices/authSlice';
import profileReducer from '../slices/profileSlice';

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
    auth: authReducer,
    profile: profileReducer,
  },
});

export default store;
