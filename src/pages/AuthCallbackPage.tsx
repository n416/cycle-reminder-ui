import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppDispatch } from '@/app/hooks';
import { setUserRole } from '@/features/auth/authSlice';
import apiClient from '@/api/client';
import { UserRole } from '@/features/auth/authSlice';

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const roleIntent = searchParams.get('role_intent');
    const redirectPath = searchParams.get('redirectPath'); // ★★★ リダイレクトパスを受け取る ★★★

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('auth-token', token);

    const verifyRoleAndNavigate = async () => {
      try {
        const response = await apiClient.get('/auth/status');
        const actualRole = response.data.role as UserRole;

        dispatch(setUserRole(actualRole));

        // ★★★★★ ここからが修正箇所です ★★★★★
        if (roleIntent === 'owner' && actualRole === 'supporter') {
          navigate('/subscribe', { replace: true });
        } else if (redirectPath) {
          // リダイレクトパスがあればそこへ移動
          navigate(decodeURIComponent(redirectPath), { replace: true });
        }
        else {
          // なければデフォルトの /servers へ
          navigate('/servers', { replace: true });
        }
        // ★★★★★ ここまで ★★★★★
      } catch (error) {
        console.error("Failed to verify user status, redirecting to login.", error);
        navigate('/login', { replace: true });
      }
    };

    verifyRoleAndNavigate();

  }, [searchParams, dispatch, navigate]);


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>認証中...</Typography>
    </Box>
  );
};