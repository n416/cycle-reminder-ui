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

export const fetchUserStatus = createAsyncThunk('auth/fetchUserStatus', async () => {
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
    },
    logout: (state) => {
      state.writeTokens = {};
      state.userRole = 'unknown';
      sessionStorage.removeItem('writeTokens');
      localStorage.removeItem('auth-token');
      console.log("【Auth】Logged out and cleared all tokens.");
    }
  },
    extraReducers: (builder) => {
    builder
      .addCase(fetchUserStatus.fulfilled, (state, action) => {
        state.userRole = action.payload;
      })
      .addCase(fetchUserStatus.rejected, (state) => {
        state.userRole = 'supporter';
      });
  }
});

// ★★★★★ logout をエクスポートに追加 ★★★★★
export const { setWriteToken, clearWriteTokens, setUserRole, logout } = authSlice.actions;

export const selectWriteTokenForServer = (serverId: string) => (state: RootState) => state.auth.writeTokens[serverId];
export const selectUserRole = (state: RootState) => state.auth.userRole;

export default authSlice.reducer;