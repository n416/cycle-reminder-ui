import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';
import { defaultEmojis, DefaultEmoji } from './defaultEmojis';

export interface Emoji {
  id: string;
  name: string | null;
  url: string;
  animated: boolean;
}

interface EmojisState {
  emojisByServer: { [serverId: string]: (Emoji | DefaultEmoji)[] };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: EmojisState = {
  emojisByServer: {},
  status: 'idle',
  error: null,
};

export const fetchEmojis = createAsyncThunk(
  'emojis/fetchEmojis',
  async ({ serverId, forceRefresh = false }: { serverId: string, forceRefresh?: boolean }) => {
    const response = await apiClient.get(`/servers/${serverId}/emojis`, {
      params: { 'force-refresh': forceRefresh }
    });
    return { serverId, emojis: response.data as Emoji[] };
  }
);

export const emojisSlice = createSlice({
  name: 'emojis',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmojis.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmojis.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { serverId, emojis } = action.payload;
        state.emojisByServer[serverId] = [...emojis, ...defaultEmojis];
      })
      .addCase(fetchEmojis.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export const selectEmojisForServer = (serverId: string) => (state: RootState) => state.emojis.emojisByServer[serverId];
export const getEmojisStatus = (state: RootState) => state.emojis.status;

export default emojisSlice.reducer;