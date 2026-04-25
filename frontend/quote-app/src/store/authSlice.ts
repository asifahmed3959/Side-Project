import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginApi, registerApi, logoutApi } from '../api/authApi';
import type { User, LoginPayload, RegisterPayload } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await loginApi(payload);
      return res.data;
    } catch {
      return rejectWithValue('Invalid credentials');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await registerApi(payload);
      return res.data;
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = data ? Object.values(data).flat().join(' ') : 'Registration failed';
      return rejectWithValue(msg);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutApi();
  } finally {
    localStorage.removeItem('auth_token');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token.key;
        state.user = action.payload.user;
        localStorage.setItem('auth_token', action.payload.token.key);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token.key;
        state.user = action.payload.user;
        localStorage.setItem('auth_token', action.payload.token.key);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
