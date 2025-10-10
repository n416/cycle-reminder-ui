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

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // 1. まずトークンを保存する
    localStorage.setItem('auth-token', token);

    // 2. サーバーに本当の役割を問い合わせてから、ナビゲーションを決定する
    const verifyRoleAndNavigate = async () => {
        try {
            // axiosのインターセプターが、保存したばかりのトークンを使ってくれる
            const response = await apiClient.get('/auth/status');
            const actualRole = response.data.role as UserRole;

            // 3. Reduxストア（アプリ全体の状態）も更新する
            dispatch(setUserRole(actualRole));

            // 4. 意図と実際の役割を比較して、正しいページへ移動する
            if (roleIntent === 'owner' && actualRole === 'supporter') {
                navigate('/subscribe', { replace: true });
            } else {
                navigate('/servers', { replace: true });
            }
        } catch (error) {
            console.error("Failed to verify user status, redirecting to login.", error);
            // サーバーとの通信に失敗した場合は、安全のためログインページに戻す
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