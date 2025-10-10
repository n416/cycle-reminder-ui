import React, { useEffect } from 'react'; // useEffectをインポート
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '@/api/client'; // apiClientをインポート
import { useAppDispatch } from '@/app/hooks'; // dispatchをインポート
import { showToast } from '@/features/toast/toastSlice'; // toastをインポート

export const PaymentCancelPage = () => {
  const dispatch = useAppDispatch(); // dispatch関数を取得

  // ★★★★★ ここからが修正箇所です ★★★★★
  useEffect(() => {
    const cancelPendingPayment = async () => {
      try {
        await apiClient.post('/payment/cancel-pending');
        // ユーザーにフィードバックは不要なので、ここではトーストは表示しない
        console.log("Pending payment has been successfully cancelled.");
      } catch (error) {
        console.error("Failed to cancel pending payment:", error);
        // このエラーはユーザーに見せる必要はない
      }
    };

    cancelPendingPayment();
  }, [dispatch]); // dispatchを依存配列に追加
  // ★★★★★ ここまで ★★★★★

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4, textAlign: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          お手続きは中断されました
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          決済手続きは完了していません。
          <br />
          機能をご利用になるには、再度プラン登録を行ってください。
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/subscribe"
          sx={{ mt: 2 }}
        >
          プラン選択画面に戻る
        </Button>
      </Paper>
    </Container>
  );
};