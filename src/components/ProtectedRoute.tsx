import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectUserRole } from '@/features/auth/authSlice';
import { Box, CircularProgress } from '@mui/material';

const isAuthenticated = () => {
  const token = localStorage.getItem('auth-token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      localStorage.removeItem('auth-token');
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem('auth-token');
    return false;
  }
};

export const ProtectedRoute = () => {
  const userRole = useAppSelector(selectUserRole);
  const location = useLocation(); // ★★★ 現在のURL情報を取得 ★★★

  if (!isAuthenticated()) {
    // ★★★ ログインページにリダイレクトする際、現在のURLを `state` として渡す ★★★
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 役割情報がまだ読み込まれていない場合
  if (userRole === 'unknown') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  // ログイン済みであればコンテンツを表示
  return <Outlet />;
};