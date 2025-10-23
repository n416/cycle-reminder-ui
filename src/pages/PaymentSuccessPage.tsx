import { useEffect } from 'react';
import { Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { showToast } from '@/features/toast/toastSlice';
import { fetchUserStatus } from '@/features/auth/authSlice'; // ★ fetchUserStatus をインポート

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(showToast({ message: 'お支払いが完了しました！サーバー側で処理が完了するまでお待ちください。', severity: 'success' }));
    
    // ★★★ ここからが修正点です ★★★
    // フロントの役割を勝手に変更せず、サーバーに最新の状態を問い合わせる
    dispatch(fetchUserStatus());
    // ★★★ ここまで ★★★
    
    // 5秒後にサーバー一覧ページへリダイレクト
    const timer = setTimeout(() => {
      navigate('/servers', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [dispatch, navigate]);

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4, textAlign: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          お手続きありがとうございます！
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          ただいま最終処理を行っています。
          <br />
          まもなくダッシュボードへ移動します。
        </Typography>
        <Box sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    </Container>
  );
};