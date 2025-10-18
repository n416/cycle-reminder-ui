import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';
import { setWriteToken } from '../auth/authSlice';

// --- 型定義 (変更なし) ---
type RecurrenceRule =
  | { type: 'none' }
  | { type: 'daily' }
  | { type: 'weekly'; days: string[] }
  | { type: 'interval'; hours: number };

export interface Reminder {
  id: string;
  serverId: string;
  message: string;
  channel: string;
  channelId: string;
  startTime: string;
  recurrence: RecurrenceRule;
  status: 'active' | 'paused';
  selectedEmojis?: string[];
  hideNextTime?: boolean;
  notificationOffsets?: number[];
  nextOffsetIndex?: number;
}
interface RemindersState {
  reminders: Reminder[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
const initialState: RemindersState = {
  reminders: [],
  status: 'idle',
  error: null,
};
// --- ここまで ---

// ★★★★★ ここから下のThunkをすべて修正します ★★★★★

// 共通ヘルパー関数：書き込み許可証を確実に取得する
const ensureWriteToken = async (serverId: string, thunkAPI: any): Promise<string> => {
  const { getState, dispatch } = thunkAPI;
  const state = getState() as RootState;
  let writeToken = state.auth.writeTokens[serverId];

  if (!writeToken) {
    const response = await apiClient.post(`/servers/${serverId}/verify-password`, { password: '' });
    writeToken = response.data.writeToken;
    dispatch(setWriteToken({ serverId, token: writeToken }));
  }
  return writeToken;
};


export const fetchReminders = createAsyncThunk('reminders/fetchReminders', async (serverId: string) => {
  const response = await apiClient.get(`/reminders/${serverId}`);
  return response.data as Reminder[];
});

export const addNewReminder = createAsyncThunk('reminders/addNewReminder',
  async ({ serverId, newReminder }: { serverId: string; newReminder: Omit<Reminder, 'id' | 'serverId'> }, thunkAPI) => {
    const writeToken = await ensureWriteToken(serverId, thunkAPI);
    const response = await apiClient.post(`/reminders/${serverId}`, newReminder, {
      headers: { 'x-write-token': writeToken }
    });
    return response.data as Reminder;
  });

export const updateExistingReminder = createAsyncThunk('reminders/updateExistingReminder', async (reminder: Reminder, thunkAPI) => {
  const writeToken = await ensureWriteToken(reminder.serverId, thunkAPI);
  const response = await apiClient.put(`/reminders/${reminder.id}`, reminder, {
    headers: { 'x-write-token': writeToken }
  });
  return response.data as Reminder;
});

export const deleteExistingReminder = createAsyncThunk('reminders/deleteExistingReminder',
  async ({ id, serverId }: { id: string, serverId: string }, thunkAPI) => {
    const writeToken = await ensureWriteToken(serverId, thunkAPI);
    await apiClient.delete(`/reminders/${id}`, {
      headers: { 'x-write-token': writeToken }
    });
    return id;
  });

export const toggleStatusAsync = createAsyncThunk('reminders/toggleStatusAsync', async (reminder: Reminder, thunkAPI) => {
  const writeToken = await ensureWriteToken(reminder.serverId, thunkAPI);
  const newStatus = reminder.status === 'active' ? 'paused' : 'active';
  const response = await apiClient.put(`/reminders/${reminder.id}`, { ...reminder, status: newStatus }, {
    headers: { 'x-write-token': writeToken }
  });
  return response.data as Reminder;
});

export const addDailySummaryReminder = createAsyncThunk(
  'reminders/addDailySummary',
  async ({ serverId, channelId, time }: { serverId: string; channelId: string; time: string }, thunkAPI) => {
    const writeToken = await ensureWriteToken(serverId, thunkAPI);
    const response = await apiClient.post(`/reminders/${serverId}/daily-summary`, { channelId, time },
      { headers: { 'x-write-token': writeToken } }
    );
    return response.data as Reminder;
  }
);
// ★★★★★ ここまで ★★★★★


export const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => { state.status = 'loading'; state.reminders = []; })
      .addCase(fetchReminders.fulfilled, (state, action: PayloadAction<Reminder[]>) => { state.status = 'succeeded'; state.reminders = action.payload; })
      .addCase(fetchReminders.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message || null; })
      .addCase(addNewReminder.fulfilled, (state, action: PayloadAction<Reminder>) => { state.reminders.push(action.payload); })
      .addCase(addDailySummaryReminder.fulfilled, (state, action: PayloadAction<Reminder>) => { state.reminders.push(action.payload); })
      .addCase(deleteExistingReminder.fulfilled, (state, action: PayloadAction<string>) => { state.reminders = state.reminders.filter(r => r.id !== action.payload); })
      .addMatcher(
        (action): action is PayloadAction<Reminder> => action.type === updateExistingReminder.fulfilled.type || action.type === toggleStatusAsync.fulfilled.type,
        (state, action) => {
          const index = state.reminders.findIndex(r => r.id === action.payload.id);
          if (index !== -1) { state.reminders[index] = action.payload; }
        }
      );
  },
});

export const selectAllReminders = (state: RootState) => state.reminders.reminders;
export const getRemindersStatus = (state: RootState) => state.reminders.status;
export default remindersSlice.reducer;