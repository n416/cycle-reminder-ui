import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';

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
  startTime: string; // ★★★ anyからstringに修正 ★★★
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

export const fetchReminders = createAsyncThunk('reminders/fetchReminders', async (serverId: string) => {
  const response = await apiClient.get(`/reminders/${serverId}`);
  return response.data as Reminder[];
});

export const addNewReminder = createAsyncThunk('reminders/addNewReminder',
  async ({ serverId, newReminder }: { serverId: string; newReminder: Omit<Reminder, 'id' | 'serverId'> }, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const writeToken = state.auth.writeTokens[serverId];
    const response = await apiClient.post(`/reminders/${serverId}`, newReminder, {
      headers: { 'x-write-token': writeToken }
    });
    return response.data as Reminder;
  });

export const updateExistingReminder = createAsyncThunk('reminders/updateExistingReminder', async (reminder: Reminder, thunkAPI) => {
  const state = thunkAPI.getState() as RootState;
  const writeToken = state.auth.writeTokens[reminder.serverId];
  const response = await apiClient.put(`/reminders/${reminder.id}`, reminder, {
    headers: { 'x-write-token': writeToken }
  });
  return response.data as Reminder;
});

export const deleteExistingReminder = createAsyncThunk('reminders/deleteExistingReminder',
  async ({ id, serverId }: { id: string, serverId: string }, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const writeToken = state.auth.writeTokens[serverId];
    await apiClient.delete(`/reminders/${id}`, {
      headers: { 'x-write-token': writeToken }
    });
    return id;
  });

export const toggleStatusAsync = createAsyncThunk('reminders/toggleStatusAsync', async (reminder: Reminder, thunkAPI) => {
  const state = thunkAPI.getState() as RootState;
  const writeToken = state.auth.writeTokens[reminder.serverId];
  const newStatus = reminder.status === 'active' ? 'paused' : 'active';
  const response = await apiClient.put(`/reminders/${reminder.id}`, { ...reminder, status: newStatus }, {
    headers: { 'x-write-token': writeToken }
  });
  return response.data as Reminder;
});

export const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.status = 'loading';
        state.reminders = [];
      })
      .addCase(fetchReminders.fulfilled, (state, action: PayloadAction<Reminder[]>) => {
        state.status = 'succeeded';
        state.reminders = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(addNewReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
        state.reminders.push(action.payload);
      })
      .addCase(deleteExistingReminder.fulfilled, (state, action: PayloadAction<string>) => {
        state.reminders = state.reminders.filter(r => r.id !== action.payload);
      })
      .addMatcher(
        (action): action is PayloadAction<Reminder> => action.type === updateExistingReminder.fulfilled.type || action.type === toggleStatusAsync.fulfilled.type,
        (state, action) => {
          const index = state.reminders.findIndex(r => r.id === action.payload.id);
          if (index !== -1) {
            state.reminders[index] = action.payload;
          }
        }
      );
  },
});

export const selectAllReminders = (state: RootState) => state.reminders.reminders;
export const getRemindersStatus = (state: RootState) => state.reminders.status;
export default remindersSlice.reducer;