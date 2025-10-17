import axios from 'axios';
import type { Store } from '@reduxjs/toolkit'; // Storeの型をインポート
import type { RootState, AppDispatch } from '@/app/store'; // ★ RootState と AppDispatch をインポート
import { fetchUserStatus } from '@/features/auth/authSlice'; // authSliceのアクションをインポート
import { showToast } from '@/features/toast/toastSlice'; // トーストをインポート

const apiClient = axios.create({
   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

// リクエスト時のインターセプター（変更なし）
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    
    console.log("【フロントエンド】APIリクエスト: ", config.url);
    console.log("【フロントエンド】認証トークン:", token ? 'あり' : 'なし');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ★★★ ここからレスポンス時のインターセプターをセットアップする関数を追加 ★★★

// store を直接インポートすると循環参照になるため、外から注入する
// ★★★ 関数の引数 store の型定義を修正 ★★★
export const setupErrorInterceptors = (store: Store<RootState> & { dispatch: AppDispatch }) => {
  
  apiClient.interceptors.response.use(
    // 成功したレスポンスはそのまま返す
    (response) => response,
    
    // 失敗したレスポンス（エラー）を処理
    async (error) => {
      const originalRequest = error.config;
      
      // 401エラー（認証切れ・権限なし）で、かつ再試行中でない場合
      // error.response が存在することも確認
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        
        // /auth/status 自体が 401 になった場合は、トークンが完全に無効なので何もしない
        if (originalRequest.url.endsWith('/auth/status')) {
            return Promise.reject(error);
        }

        // ここで「書き込みトークン（x-write-token）の期限切れ」と
        // 「認証トークン（auth-token）の権限が古い」
        // の両方の可能性をハンドリングします。

        originalRequest._retry = true; // 再試行フラグを立てる

        try {
          // ユーザーに権限の更新を通知
          store.dispatch(showToast({
            message: '権限の確認と更新を行っています...',
            severity: 'info',
            duration: 2000
          }));

          // 1. まず、バックエンド（DB）から最新の権限をフェッチする
          //    型定義を修正したので、この行のエラーは解消されるはずです
          await store.dispatch(fetchUserStatus()).unwrap();

          // 2. 最新の権限（例: 'tester'）がストアに反映された
          //    しかし、書き込みトークン（writeToken）が古いか、まだ無い可能性がある
          //    ReminderList.tsx にある「トークン自動取得ロジック」を再実行させる必要がある
          
          // ★ 本来はここで、/api/servers/:serverId/verify-password を
          //    呼び出す専用のThunkを叩くのが望ましいですが、
          //    現状は fetchUserStatus で権限を更新するだけに留めます。
          //    （次回の画面遷移時、または次回の書き込み失敗時に再度権限が確認されます）

          // 401の原因が「古い権限」であった場合、
          // これでストアの 'userRole' が更新されたため、
          // ユーザーが手動でもう一度操作すれば成功するようになるはずです。

          // 401の原因が「writeTokenの期限切れ」であった場合、
          // 現状のロジックでは自動でwriteTokenを再取得できませんが、
          // 権限(userRole)が更新されることで、ReminderListのuseEffectが
          // 再実行され、writeTokenが再取得される可能性があります。
          
        } catch (e) {
          // fetchUserStatus自体が失敗した場合（＝本当にログアウトが必要な場合）
          console.error("自動権限更新に失敗しました:", e);
        }
      }

      // 401以外のエラー、または処理済みのエラーはそのまま投げる
      return Promise.reject(error);
    }
  );
};
// ★★★ ここまで追加 ★★★

export default apiClient;