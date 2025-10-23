import { useState } from 'react';
import { Box, Typography, Button, Container, Paper, Stack, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material'; // Dialog関連をインポート
import apiClient from '@/api/client';
import { useAppDispatch } from '@/app/hooks';
import { showToast } from '@/features/toast/toastSlice';
import { setUserRole } from '@/features/auth/authSlice';

const getUserIdFromToken = (): string | null => {
    const token = localStorage.getItem('auth-token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch (e) {
        return null;
    }
};

const testerIds = (import.meta.env.VITE_TESTER_USER_IDS || '').split(',');

export const SubscriptionPage = () => {
  const [loading, setLoading] = useState<'monthly' | 'annual' | 'tester' | null>(null);
  const [pendingConfirmationOpen, setPendingConfirmationOpen] = useState(false); // ★ 確認ダイアログ用のstate
  const dispatch = useAppDispatch();
  const currentUserId = getUserIdFromToken();

  const handleSubscribe = async (planId: 'monthly' | 'annual') => {
    setLoading(planId);
    try {
      const response = await apiClient.post('/payment/create-session', { planId });
      if (response.data && response.data.sessionUrl) {
          window.location.href = response.data.sessionUrl;
      } else {
          dispatch(showToast({ message: '決済ページのURL取得に失敗しました。', severity: 'error' }));
          setLoading(null);
      }
    } catch (error: any) {
      // ★★★★★ ここからが修正箇所です ★★★★★
      if (error.response && error.response.data.error?.includes('支払い手続き中')) {
        // pendingエラーの場合、確認ダイアログを開く
        setPendingConfirmationOpen(true);
      } else {
        dispatch(showToast({ message: '決済セッションの作成に失敗しました。', severity: 'error' }));
      }
      setLoading(null);
      // ★★★★★ ここまで ★★★★★
    }
  };

  // ★★★★★ ここからが新しく追加する関数です ★★★★★
  const handleCancelAndRetry = async () => {
    setPendingConfirmationOpen(false);
    setLoading('monthly'); // 仮のローディング状態
    try {
      // 1. まずpending状態をキャンセルする
      await apiClient.post('/payment/cancel-pending');
      dispatch(showToast({ message: '古い支払い手続きをキャンセルしました。', severity: 'info' }));
      
      // 2. もう一度セッション作成を試みる
      // (どのプランを選んでいたか再選択させるのが丁寧ですが、ここでは直前のものを再試行)
      const response = await apiClient.post('/payment/create-session', { planId: 'monthly' });
      if (response.data && response.data.sessionUrl) {
          window.location.href = response.data.sessionUrl;
      }
    } catch (error) {
      dispatch(showToast({ message: '処理に失敗しました。時間をおいて再度お試しください。', severity: 'error' }));
      setLoading(null);
    }
  };
  // ★★★★★ ここまで ★★★★★
  
  const handleActivateTester = async () => {
    setLoading('tester');
    try {
        await apiClient.post('/payment/activate-test-mode');
        dispatch(setUserRole('tester'));
        dispatch(showToast({ message: 'テスターモードを有効にしました。', severity: 'success' }));
        window.location.href = '/servers';
    } catch (error) {
        dispatch(showToast({ message: 'テスターモードの有効化に失敗しました。', severity: 'error' }));
        setLoading(null);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4, textAlign: 'center' }}>
        {/* ... (中略) ... */}
        <Typography component="h1" variant="h4" gutterBottom>
          オーナー登録プランのご案内
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Cycle Reminderの全機能をご利用いただくには、いずれかのプランへの登録が必要です。
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center" alignItems="stretch" sx={{ my: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom>月額プラン</Typography>
            <Typography color="text.secondary" sx={{ minHeight: '3em' }}>クレジットカードでのお支払いに対応しています。</Typography>
            <Box sx={{ my: 2, flexGrow: 1 }}>
              <Typography variant="h4" component="span">500</Typography>
              <Typography variant="body1" component="span">円 / 初月</Typography>
              <Typography color="text.secondary">(次月以降 50円/月)</Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => handleSubscribe('monthly')}
              disabled={!!loading}
            >
              {loading === 'monthly' ? '処理中...' : '月額プランで登録'}
            </Button>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom>年間プラン</Typography>
            <Typography color="text.secondary" sx={{ minHeight: '3em' }}>コンビニ払いやPayPayなど、多彩なお支払い方法に対応しています。</Typography>
            <Box sx={{ my: 2, flexGrow: 1 }}>
              <Typography variant="h4" component="span">1,500</Typography>
              <Typography variant="body1" component="span">円 / 年</Typography>
              <Typography color="text.secondary">(1年間有効)</Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => handleSubscribe('annual')}
              disabled={!!loading}
            >
              {loading === 'annual' ? '処理中...' : '年間プランで登録'}
            </Button>
          </Paper>
        </Stack>
        
        <Divider sx={{ my: 3 }} />

        {currentUserId && testerIds.includes(currentUserId) && (
            <Button onClick={handleActivateTester} size="small" disabled={!!loading}>
                {loading === 'tester' ? '処理中...' : 'テスターとして利用開始'}
            </Button>
        )}
      </Paper>

      {/* ★★★★★ ここに確認ダイアログを追加します ★★★★★ */}
      <Dialog
        open={pendingConfirmationOpen}
        onClose={() => setPendingConfirmationOpen(false)}
      >
        <DialogTitle>お支払い手続きの重複</DialogTitle>
        <DialogContent>
          <DialogContentText>
            現在、完了していない支払い手続きがあります。
            <br />
            古い手続きをキャンセルして、新しく購入を開始しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingConfirmationOpen(false)}>いいえ</Button>
          <Button onClick={handleCancelAndRetry} autoFocus>
            はい、キャンセルして進む
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};