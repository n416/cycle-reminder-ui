import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';
import { setWriteToken } from '../auth/authSlice'; // ★ setWriteToken をインポート

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

export const fetchServers = createAsyncThunk('servers/fetchServers', async () => {
  try {
    const response = await apiClient.get('/servers');
    return response.data as Server[];
  } catch (error) {
    console.warn("APIサーバーへの接続に失敗したため、テスト用のダミーデータを表示します。");
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

// ★★★★★ ここからが修正箇所です ★★★★★
export const updateServerSettings = createAsyncThunk(
  'servers/updateSettings',
  async ({ serverId, settings }: { serverId: string; settings: ServerSettings }, { getState, dispatch }) => {
    const state = getState() as RootState;
    let writeToken = state.auth.writeTokens[serverId];

    // ストアに書き込みトークンがなければ、その場で取得を試みる
    if (!writeToken) {
      try {
        console.log(`[updateServerSettings] 書き込みトークンがないため、 /servers/${serverId}/verify-password を呼び出します。`);
        const response = await apiClient.post(`/servers/${serverId}/verify-password`, { password: '' });
        writeToken = response.data.writeToken;
        // 取得したトークンを今後のためにストアに保存する
        dispatch(setWriteToken({ serverId, token: writeToken }));
        console.log("[updateServerSettings] 書き込みトークンの取得に成功しました。");
      } catch (error) {
        console.error("書き込みトークンの自動取得に失敗しました:", error);
        // トークンが取得できなければ、thunkを失敗させる
        throw new Error('Failed to acquire write permission.');
      }
    }
    
    // 取得した、あるいは元々あったトークンを使ってリクエストを送信
    const headers = { 'x-write-token': writeToken };
    console.log(`[updateServerSettings] トークンを使ってPUTリクエストを送信します。`);
    const response = await apiClient.put(`/servers/${serverId}/settings`, settings, { headers });
    return { serverId, settings: response.data as ServerSettings };
  }
);
// ★★★★★ ここまでが修正箇所です ★★★★★


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
      .addCase(updateServerSettings.fulfilled, (state, action: PayloadAction<{ serverId: string; settings: ServerSettings }>) => {
        const { serverId, settings } = action.payload;
        const existingServer = state.servers.find(server => server.id === serverId);
        if (existingServer) {
          existingServer.customName = settings.customName;
          existingServer.customIcon = settings.customIcon;
          existingServer.serverType = settings.serverType;
        }
      });
  },
});

export const selectAllServers = (state: RootState) => state.servers.servers;
export const getServersStatus = (state: RootState) => state.servers.status;
export const getLastFetched = (state: RootState) => state.servers.lastFetched;
export default serversSlice.reducer;