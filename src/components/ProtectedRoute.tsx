import { Navigate, Outlet } from 'react-router-dom';

const isAuthenticated = () => {
  const token = localStorage.getItem('auth-token');
  // --- ★★★ 調査用ログを追加 ★★★ ---
  console.log('[ProtectedRoute] 認証状態をチェック中。トークンの有無:', token ? 'あり' : 'なし');
  // --- ★★★ ここまで追加 ★★★ ---
  return !!token;
};

export const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    console.log('[ProtectedRoute] 未認証と判断。ログインページにリダイレクトします。');
    return <Navigate to="/login" />;
  }
  console.log('[ProtectedRoute] 認証済みと判断。アプリケーション本体を表示します。');
  return <Outlet />;
};