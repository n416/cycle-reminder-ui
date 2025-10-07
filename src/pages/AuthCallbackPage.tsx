import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // --- ★★★ ここから調査用ログを追加 ★★★ ---
    console.log('[AuthCallback] ページが表示されました。');
    const token = searchParams.get('token');
    
    if (token) {
      console.log('[AuthCallback] URLからトークンを発見しました:', token);
      try {
        console.log('[AuthCallback] localStorageへのトークン保存を開始します。');
        localStorage.setItem('auth-token', token);
        console.log('[AuthCallback] localStorageへの保存が成功しました。');
        
        console.log('[AuthCallback] トップページへのリダイレクトを実行します。');
        window.location.href = '/'; 
      } catch (e) {
        console.error('[AuthCallback] localStorageへの保存中にエラーが発生しました:', e);
        navigate('/login');
      }
    } else {
      console.warn('[AuthCallback] URLにトークンが見つからなかったため、ログインページに戻ります。');
      navigate('/login');
    }
    // --- ★★★ ここまで追加 ★★★ ---
  }, [searchParams, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>認証中...</Typography>
    </Box>
  );
};