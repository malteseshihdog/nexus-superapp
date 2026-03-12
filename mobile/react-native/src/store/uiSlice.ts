import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type Theme = 'dark' | 'light';

interface UIState {
  theme: Theme;
  fontSize: 12 | 14 | 16 | 18;
  isOnline: boolean;
  isSyncing: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
}

const initialState: UIState = {
  theme: 'dark',
  fontSize: 14,
  isOnline: true,
  isSyncing: false,
  toasts: [],
};

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    setFontSize(state, action: PayloadAction<UIState['fontSize']>) {
      state.fontSize = action.payload;
    },
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    showToast(state, action: PayloadAction<Omit<UIState['toasts'][number], 'id'>>) {
      state.toasts.push({ ...action.payload, id: String(++toastId) });
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setTheme, setFontSize, setOnlineStatus, setSyncing, showToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
