import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginCredentials, RegisterCredentials } from '../../../shared/src/types/auth.types';
import { authEndpoints } from '../../../shared/src/api/endpoints';
import { apiClient } from '../../../shared/src/api/client';
import { storageService } from '../services/storage';
import { APP_CONSTANTS } from '../../../shared/src/constants/app.constants';

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk('auth/login', async (credentials: LoginCredentials, { rejectWithValue }) => {
  try {
    const res = await authEndpoints.login(credentials);
    return res.data;
  } catch (err) {
    return rejectWithValue((err as { message: string }).message);
  }
});

export const register = createAsyncThunk('auth/register', async (credentials: RegisterCredentials, { rejectWithValue }) => {
  try {
    const res = await authEndpoints.register(credentials);
    return res.data;
  } catch (err) {
    return rejectWithValue((err as { message: string }).message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authEndpoints.logout();
  } finally {
    apiClient.clearAuthToken();
    await storageService.remove(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKENS);
    await storageService.remove(APP_CONSTANTS.STORAGE_KEYS.USER_PROFILE);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        apiClient.setAuthToken(action.payload.tokens.accessToken);
      })
      .addCase(login.rejected, (state, action: PayloadAction<unknown>) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Login failed';
      });

    // register
    builder
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        apiClient.setAuthToken(action.payload.tokens.accessToken);
      })
      .addCase(register.rejected, (state, action: PayloadAction<unknown>) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Registration failed';
      });

    // logout
    builder
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
