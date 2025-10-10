import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store.ts';
import apiClient from '@/api/client';

const getInitialWriteTokens = (): { [serverId: string]: string } => {
  try {
    const item = sessionStorage.getItem('writeTokens');
    return item ? JSON.parse(item) : {};
  } catch (error) {
    return {};
  }
};

export type UserRole = 'owner' | 'supporter' | 'tester' | 'unknown';

// ユーザーの役割情報を取得する非同期Thunk
export const fetchUserStatus = createAsyncThunk('auth/fetchUserStatus', async () => {
    // ★ 変更点: レスポンスからroleを取得する
    const response = await apiClient.get('/auth/status');
    return response.data.role as UserRole;
});

interface AuthState {
  writeTokens: { [serverId: string]: string };
  userRole: UserRole;
}

const initialState: AuthState = {
  writeTokens: getInitialWriteTokens(),
  userRole: 'unknown',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setWriteToken: (state, action: PayloadAction<{ serverId: string; token: string }>) => {
      const { serverId, token } = action.payload;
      state.writeTokens[serverId] = token;
      sessionStorage.setItem('writeTokens', JSON.stringify(state.writeTokens));
    },
    clearWriteTokens: (state) => {
      state.writeTokens = {};
      sessionStorage.removeItem('writeTokens');
    },
    setUserRole: (state, action: PayloadAction<UserRole>) => {
        state.userRole = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
        .addCase(fetchUserStatus.fulfilled, (state, action) => {
            state.userRole = action.payload;
        })
        .addCase(fetchUserStatus.rejected, (state) => {
            state.userRole = 'supporter'; // 取得失敗時は安全のためサポーター扱い
        });
  }
});

export const { setWriteToken, clearWriteTokens, setUserRole } = authSlice.actions;

export const selectWriteTokenForServer = (serverId: string) => (state: RootState) => state.auth.writeTokens[serverId];
export const selectUserRole = (state: RootState) => state.auth.userRole;

export default authSlice.reducer;