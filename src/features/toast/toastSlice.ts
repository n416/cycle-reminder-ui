import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToastNotification } from './types';

interface ToastState {
  notifications: ToastNotification[];
}

const initialState: ToastState = {
  notifications: [],
};

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<Omit<ToastNotification, 'key'>>) => {
      state.notifications.push({
        key: new Date().getTime() + Math.random(),
        duration: 4000, // ★ デフォルトの表示時間を設定
        ...action.payload,
      });
    },
    closeToast: (state, action: PayloadAction<number>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.key !== action.payload
      );
    },
  },
});

export const { showToast, closeToast } = toastSlice.actions;

export default toastSlice.reducer;