import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

export const AuthCallbackPage = () => {
  // --- ★★★ 調査用ログを追加 ★★★ ---
  console.log('%c[AuthCallbackPage] コンポーネントの描画が開始されました。', 'color: red; font-size: 16px; font-weight: bold;');
  // --- ★★★ ここまで追加 ★★★ ---
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AuthCallbackPage] useEffectが実行されました。');
    const token = searchParams.get('token');
    
    if (token) {
      console.log('[AuthCallbackPage] URLからトークンを発見しました。');
      try {
        console.log('[AuthCallbackPage] localStorageへのトークン保存を開始します。');
        localStorage.setItem('auth-token', token);
        console.log('[AuthCallbackPage] localStorageへの保存が成功しました。');
        
        console.log('[AuthCallbackPage] トップページへのリダイレクトを実行します。');
        window.location.href = '/'; 
      } catch (e) {
        console.error('[AuthCallbackPage] localStorageへの保存中にエラーが発生しました:', e);
        navigate('/login');
      }
    } else {
      console.warn('[AuthCallbackPage] URLにトークンが見つからなかったため、ログインページに戻ります。');
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