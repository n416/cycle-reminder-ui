import { Navigate, Outlet } from 'react-router-dom';
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
  console.log("【Debug】2. ProtectedRoute component is rendering."); // ★ デバッグログ
  const userRole = useAppSelector(selectUserRole);
  console.log(`【Debug】ProtectedRoute: Current userRole is '${userRole}'.`); // ★ デバッグログ

  if (!isAuthenticated()) {
    console.log("【Debug】ProtectedRoute: Not authenticated. Redirecting to /login."); // ★ デバッグログ
    return <Navigate to="/login" />;
  }

  // 役割情報がまだ読み込まれていない場合
  if (userRole === 'unknown') {
    console.log("【Debug】ProtectedRoute: userRole is 'unknown'. Showing spinner."); // ★ デバッグログ
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  // ログイン済みであればコンテンツを表示
  console.log("【Debug】ProtectedRoute: Authenticated and role is known. Rendering Outlet."); // ★ デバッグログ
  return <Outlet />;
};