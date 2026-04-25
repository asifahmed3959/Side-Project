import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import quotesReducer from './quotesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quotes: quotesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
