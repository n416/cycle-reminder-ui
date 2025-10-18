import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';
import { setWriteToken } from '../auth/authSlice';

// --- 型定義 (変更なし) ---
export interface Server {
  id: string;
  name: string;
  icon: string | null;
  role: 'admin' | 'member';
  isAdded?: boolean;
  customName?: string | null;
  customIcon?: string | null;
  serverType?: 'normal' | 'hit_the_world';
}
interface ServerSettings {
  customName: string | null;
  customIcon: string | null;
  serverType: 'normal' | 'hit_the_world';
}
interface ServersState {
  servers: Server[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetched: number | null;
}
const initialState: ServersState = {
  servers: [],
  status: 'idle',
  error: null,
  lastFetched: null,
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

export const fetchServers = createAsyncThunk('servers/fetchServers', async () => {
  // 読み取り操作なので認証処理は不要
  const response = await apiClient.get('/servers');
  return response.data as Server[];
});

export const updateServerPassword = createAsyncThunk(
  'servers/updatePassword',
  async ({ serverId, password }: { serverId: string; password: string }, thunkAPI) => {
    const writeToken = await ensureWriteToken(serverId, thunkAPI);
    const response = await apiClient.put(`/servers/${serverId}/password`, { password }, {
      headers: { 'x-write-token': writeToken }
    });
    return response.data;
  }
);

export const updateServerSettings = createAsyncThunk(
  'servers/updateSettings',
  async ({ serverId, settings }: { serverId: string; settings: ServerSettings }, thunkAPI) => {
    const writeToken = await ensureWriteToken(serverId, thunkAPI);
    const response = await apiClient.put(`/servers/${serverId}/settings`, settings, {
      headers: { 'x-write-token': writeToken }
    });
    return { serverId, settings: response.data as ServerSettings };
  }
);
// ★★★★★ ここまで ★★★★★


export const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServers.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchServers.fulfilled, (state, action: PayloadAction<Server[]>) => { state.status = 'succeeded'; state.servers = action.payload; state.lastFetched = Date.now(); })
      .addCase(fetchServers.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message || null; })
      .addCase(updateServerSettings.fulfilled, (state, action: PayloadAction<{ serverId: string; settings: ServerSettings }>) => {
        const existingServer = state.servers.find(server => server.id === action.payload.serverId);
        if (existingServer) {
          existingServer.customName = action.payload.settings.customName;
          existingServer.customIcon = action.payload.settings.customIcon;
          existingServer.serverType = action.payload.settings.serverType;
        }
      });
  },
});

export const selectAllServers = (state: RootState) => state.servers.servers;
export const getServersStatus = (state: RootState) => state.servers.status;
export const getLastFetched = (state: RootState) => state.servers.lastFetched;
export default serversSlice.reducer;