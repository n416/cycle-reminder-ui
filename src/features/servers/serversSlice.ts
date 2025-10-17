import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';

export interface Server {
  id: string;
  name: string;
  icon: string | null;
  role: 'admin' | 'member';
  isAdded?: boolean; 
  // ★★★★★ ここから追加 ★★★★★
  customName?: string | null;
  customIcon?: string | null;
  serverType?: 'normal' | 'hit_the_world';
  // ★★★★★ ここまで追加 ★★★★★
}

// ★★★★★ ここから追加 ★★★★★
interface ServerSettings {
  customName: string | null;
  customIcon: string | null;
  serverType: 'normal' | 'hit_the_world';
}
// ★★★★★ ここまで追加 ★★★★★

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

export const fetchServers = createAsyncThunk('servers/fetchServers', async () => {
  try {
    const response = await apiClient.get('/servers');
    return response.data as Server[];
  } catch (error) {
    console.warn("APIサーバーへの接続に失敗したため、テスト用のダミーデータを表示します。");
    // ★★★ モックデータを更新 ★★★
    return [
      { id: 'mock1', name: 'ゲーム部 (テストデータ)', icon: null, role: 'admin', isAdded: true, serverType: 'normal' },
      { id: 'mock2', name: 'プログラミングサークル (テストデータ)', icon: null, role: 'member', isAdded: true, serverType: 'normal' },
    ] as Server[];
  }
});

export const updateServerPassword = createAsyncThunk(
  'servers/updatePassword',
  async ({ serverId, password }: { serverId: string; password: string }) => {
    const response = await apiClient.put(`/servers/${serverId}/password`, { password });
    return response.data;
  }
);

// ★★★★★ ここから追加 ★★★★★
export const updateServerSettings = createAsyncThunk(
  'servers/updateSettings',
  async ({ serverId, settings }: { serverId: string; settings: ServerSettings }, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    // オーナー/テスターは自動でwriteTokenを持っているはずなので、それをヘッダーに付与する
    const writeToken = state.auth.writeTokens[serverId];
    const headers = writeToken ? { 'x-write-token': writeToken } : {};

    const response = await apiClient.put(`/servers/${serverId}/settings`, settings, { headers });
    return { serverId, settings: response.data as ServerSettings };
  }
);
// ★★★★★ ここまで追加 ★★★★★

export const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchServers.fulfilled, (state, action: PayloadAction<Server[]>) => {
        state.status = 'succeeded';
        state.servers = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      // ★★★★★ ここから追加 ★★★★★
      .addCase(updateServerSettings.fulfilled, (state, action: PayloadAction<{ serverId: string; settings: ServerSettings }>) => {
        const { serverId, settings } = action.payload;
        const existingServer = state.servers.find(server => server.id === serverId);
        if (existingServer) {
          existingServer.customName = settings.customName;
          existingServer.customIcon = settings.customIcon;
          existingServer.serverType = settings.serverType;
        }
      });
      // ★★★★★ ここまで追加 ★★★★★
  },
});

export const selectAllServers = (state: RootState) => state.servers.servers;
export const getServersStatus = (state: RootState) => state.servers.status;
export const getLastFetched = (state: RootState) => state.servers.lastFetched;
export default serversSlice.reducer;