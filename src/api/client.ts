import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '@/app/store';
import { showSessionExpiredDialog } from '@/features/session/sessionSlice'; // ★ インポート

const apiClient = axios.create({
   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

export const setupInterceptors = (store: Store<RootState> & { dispatch: AppDispatch }) => {
  
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // 401エラー（認証切れ）の場合のみ処理
      if (error.response?.status === 401) {
        const { dispatch, getState } = store;
        // ダイアログがまだ開かれていない場合のみ、新しく開く
        if (!getState().session.isExpiredDialogOpen) {
          dispatch(showSessionExpiredDialog());
        }
      }
      return Promise.reject(error);
    }
  );
};

export default apiClient;