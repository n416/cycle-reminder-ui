import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // トークンをローカルストレージに保存
      localStorage.setItem('auth-token', token);
      // ★★★ ここから修正 ★★★
      // navigate('/') の代わりに、ページを強制的に再読み込みさせる
      window.location.href = '/'; 
      // ★★★ ここまで修正 ★★★
    } else {
      // トークンがなければログインページに戻す
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>認証中...</Typography>
    </Box>
  );
};