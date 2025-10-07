import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import apiClient from '@/api/client';

export interface MissedNotification {
  id: string;
  serverId: string;
  reminderMessage: string;
  missedAt: any;
  channelName: string;
  acknowledged: boolean;
}

interface MissedNotificationsState {
  notifications: MissedNotification[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MissedNotificationsState = {
  notifications: [],
  status: 'idle',
  error: null,
};

export const fetchMissedNotifications = createAsyncThunk(
  'missedNotifications/fetchMissed',
  async (serverId: string) => {
    // --- ★★★ 調査用ログを追加 ★★★ ---
    console.log(`%c[missedNotificationsSlice] fetchMissedNotificationsが呼ばれました。サーバーID: ${serverId}`, 'color: purple; font-weight: bold;');
    try {
      const response = await apiClient.get(`/missed-notifications/${serverId}`);
      console.log('[missedNotificationsSlice] APIからの応答データ:', response.data);
      return response.data as MissedNotification[];
    } catch (error) {
      console.error('[missedNotificationsSlice] API呼び出しでエラー:', error);
      throw error;
    }
    // --- ★★★ ここまで追加 ★★★ ---
  }
);

export const acknowledgeNotification = createAsyncThunk(
  'missedNotifications/acknowledge',
  async (notificationId: string) => {
    await apiClient.put(`/missed-notifications/${notificationId}/acknowledge`);
    return notificationId;
  }
);

export const missedNotificationsSlice = createSlice({
  name: 'missedNotifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMissedNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMissedNotifications.fulfilled, (state, action: PayloadAction<MissedNotification[]>) => {
        state.status = 'succeeded';
        state.notifications = action.payload;
        // --- ★★★ 調査用ログを追加 ★★★ ---
        console.log('[missedNotificationsSlice] Reduxストアが更新されました。新しい通知:', action.payload);
        // --- ★★★ ここまで追加 ★★★ ---
      })
      .addCase(fetchMissedNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(acknowledgeNotification.fulfilled, (state, action: PayloadAction<string>) => {
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      });
  },
});

export const selectMissedNotifications = (state: RootState) => state.missedNotifications.notifications;

export default missedNotificationsSlice.reducer;