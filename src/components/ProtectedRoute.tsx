import { Navigate, Outlet } from 'react-router-dom';

const isAuthenticated = () => {
  const token = localStorage.getItem('auth-token');
  console.log('[ProtectedRoute] 認証状態をチェック中。トークンの有無:', token ? 'あり' : 'なし');

  if (!token) {
    return false;
  }

  try {
    // 1. トークンをデコードしてペイロードを取得
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // 2. 有効期限（exp）をチェック
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('[ProtectedRoute] トークンは有効期限切れです。');
      localStorage.removeItem('auth-token'); // 期限切れのトークンは削除
      return false;
    }
    
    // トークン形式が正しく、有効期限内であれば認証済みとみなす
    return true;

  } catch (error) {
    console.error('[ProtectedRoute] トークンの解析に失敗しました。不正なトークンの可能性があります。', error);
    localStorage.removeItem('auth-token'); // 不正なトークンは削除
    return false;
  }
};

export const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    console.log('[ProtectedRoute] 未認証と判断。ログインページにリダイレクトします。');
    return <Navigate to="/login" />;
  }
  console.log('[ProtectedRoute] 認証済みと判断。アプリケーション本体を表示します。');
  return <Outlet />;
};