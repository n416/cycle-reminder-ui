import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Container, Paper, CircularProgress, Button } from '@mui/material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { showToast } from '@/features/toast/toastSlice';
import { fetchUserStatus, selectUserRole } from '@/features/auth/authSlice';
import apiClient from '@/api/client';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const userRole = useAppSelector(selectUserRole);

  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'processing' | 'success' | 'timed_out'>('verifying');
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      navigate('/payment/cancel', { replace: true });
      return;
    }

    const cleanup = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const verifyPayment = async () => {
      try {
        const response = await apiClient.get(`/payment/session-status/${sessionId}`);
        const { paymentStatus } = response.data;

        // ★★★★★ ここからが修正箇所です ★★★★★
        if (paymentStatus === 'captured') {
          // 最優先：支払いが確定している場合（即時決済）
          setVerificationStatus('processing');
          dispatch(showToast({ message: 'お支払いが完了しました！サーバー側で処理が完了するまでお待ちください。', severity: 'success' }));
          
          pollIntervalRef.current = setInterval(() => {
            dispatch(fetchUserStatus());
          }, 2000);

          timeoutRef.current = setTimeout(() => {
            cleanup();
            setVerificationStatus('timed_out');
          }, 20000);

        } else if (paymentStatus === 'authorized') {
          // 次点：支払い待ち状態の場合（コンビニ決済など）
          navigate('/payment/pending', { replace: true });
          
        } else {
          // それ以外 (キャンセル、失敗など)
          navigate('/payment/cancel', { replace: true });
        }
        // ★★★★★ ここまで ★★★★★
      } catch (error) {
        console.error("Failed to verify payment session:", error);
        navigate('/payment/cancel', { replace: true });
      }
    };

    verifyPayment();

    return cleanup;
  }, [dispatch, navigate, searchParams]);
  
  useEffect(() => {
    if (userRole === 'owner' && verificationStatus === 'processing') {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setVerificationStatus('success');
      
      const timer = setTimeout(() => {
        navigate('/servers', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userRole, verificationStatus, navigate]);


  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <>
            <Typography component="h1" variant="h4" gutterBottom>決済状態を確認中...</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>Komojuサーバーと通信しています。しばらくお待ちください。</Typography>
            <Box sx={{ my: 4 }}><CircularProgress /></Box>
          </>
        );
      case 'processing':
        return (
          <>
            <Typography component="h1" variant="h4" gutterBottom>お手続きありがとうございます！</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>ただいま最終処理を行っています。このままお待ちください...</Typography>
            <Box sx={{ my: 4 }}><CircularProgress /></Box>
          </>
        );
      case 'success':
        return (
          <>
            <Typography component="h1" variant="h4" gutterBottom>オーナー権限が有効になりました！</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>まもなくダッシュボードへ移動します。</Typography>
            <Box sx={{ my: 4 }}><CircularProgress /></Box>
          </>
        );
      case 'timed_out':
         return (
          <>
            <Typography component="h1" variant="h4" gutterBottom>処理がタイムアウトしました</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              サーバー側の処理に時間がかかっているようです。
              <br />
              お手数ですが、一度サーバー一覧に戻り、再度ログインをお試しください。
            </Typography>
            <Button component={RouterLink} to="/servers" variant="contained" sx={{ mt: 3 }}>
              サーバー一覧へ
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4, textAlign: 'center' }}>
        {renderContent()}
      </Paper>
    </Container>
  );
};