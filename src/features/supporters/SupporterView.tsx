import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchReminders, selectAllReminders, updateExistingReminder, Reminder } from '@/features/reminders/remindersSlice';
import { selectAllServers, fetchServers, getServersStatus } from '@/features/servers/serversSlice';
import { logout, selectUserRole, selectWriteTokenForServer, setWriteToken } from '@/features/auth/authSlice';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, Container, Typography, Paper, Stack, Button, CircularProgress, AppBar, Toolbar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import apiClient from '@/api/client';


// ボスリマインダーかどうかを判定するロジック
const isBossReminder = (reminder: Reminder) => {
  return reminder.recurrence.type === 'interval' && reminder.recurrence.hours === 20;
};

// 時刻のフォーマット
const formatStartTime = (startTimeValue: string): string => {
  const date = new Date(startTimeValue);
  if (isNaN(date.getTime())) return "無効な日付";
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
};

export const SupporterView = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Reduxストアから必要なデータを取得
  const reminders = useAppSelector(selectAllReminders);
  const servers = useAppSelector(selectAllServers);
  const remindersStatus = useAppSelector(state => state.reminders.status);
  const serversStatus = useAppSelector(getServersStatus);
  const userRole = useAppSelector(selectUserRole);

  const writeToken = useAppSelector(selectWriteTokenForServer(serverId!));

  const currentServer = servers.find(s => s.id === serverId);

  // パスワード認証用のState
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  // ★★★★★ 認証が完了したかを管理するStateを追加 ★★★★★
  const [isAuthChecked, setIsAuthChecked] = useState(false);


  // 初回マウント時にサーバーリストをフェッチ
  useEffect(() => {
    if (servers.length === 0) {
      dispatch(fetchServers());
    }
  }, [dispatch, servers.length]);

  // このページ専用のアクセス制御とデータ取得
  useEffect(() => {
    // サーバー情報とユーザー情報が読み込めてから評価
    if (serversStatus === 'succeeded' && userRole !== 'unknown') {
      const isSupporter = userRole === 'supporter';
      const isHitServer = currentServer?.serverType === 'hit_the_world';

      if (!isSupporter || !isHitServer) {
        // 条件に合わないユーザーはリダイレクト
        navigate('/servers', { replace: true });
        return;
      }

      // ★★★★★ ここからが修正箇所です ★★★★★
      // 権限チェックロジックを修正
      const checkAuthAndFetchData = async () => {
        if (writeToken) {
          // すでにトークンがあればリマインダーを取得
          if (serverId) dispatch(fetchReminders(serverId));
          setIsAuthChecked(true);
        } else {
          // トークンがなければ、まず空のパスワードで試行
          try {
            if (!serverId) return;
            const response = await apiClient.post(`/servers/${serverId}/verify-password`, { password: '' });
            const newWriteToken = response.data.writeToken;
            dispatch(setWriteToken({ serverId, token: newWriteToken }));
            dispatch(fetchReminders(serverId));
          } catch (error) {
            // 空パスワードで失敗した場合、パスワードが必要だと判断しダイアログを開く
            setIsPasswordDialogOpen(true);
          } finally {
            setIsAuthChecked(true);
          }
        }
      };

      checkAuthAndFetchData();
      // ★★★★★ ここまで修正 ★★★★★
    }
  }, [serversStatus, userRole, currentServer, navigate, serverId, dispatch, writeToken]);

  // 時刻調整処理
  const handleTimeAdjust = async (reminder: Reminder, minutes: number) => {
    const originalDate = new Date(reminder.startTime);
    if (isNaN(originalDate.getTime())) return;

    const newDate = new Date(originalDate.getTime() + minutes * 60000);
    const updatedReminder = { ...reminder, startTime: newDate.toISOString() };

    try {
      await dispatch(updateExistingReminder(updatedReminder)).unwrap();
      const action = minutes > 0 ? '進めました' : '戻しました';
      dispatch(showToast({ message: `起点日時を ${Math.abs(minutes)} 分 ${action}。`, severity: 'success' }));
    } catch (error) {
      dispatch(showToast({ message: '日時の更新に失敗しました。', severity: 'error' }));
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handlePasswordSubmit = async () => {
    if (!serverId) return;
    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await apiClient.post(`/servers/${serverId}/verify-password`, { password });
      const newWriteToken = response.data.writeToken;
      dispatch(setWriteToken({ serverId, token: newWriteToken }));
      setIsPasswordDialogOpen(false);
      setPassword('');
      dispatch(fetchReminders(serverId)); // 認証成功後にリマインダーを取得
    } catch (error) {
      setVerificationError('パスワードが違います。');
    } finally {
      setIsVerifying(false);
    }
  };

  const bossReminders = reminders.filter(isBossReminder);

  // ★★★★★ 表示条件を isAuthChecked も見るように変更 ★★★★★
  const canView = isAuthChecked && userRole === 'supporter' && currentServer?.serverType === 'hit_the_world' && !!writeToken;


  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <AccessTimeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            時刻更新モード
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} aria-label="ログアウト">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ★★★★★ ここから修正 ★★★★★ */}
      {isAuthChecked ? (
        canView && (
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            {remindersStatus === 'loading' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : !currentServer ? (
              <Typography color="error" align="center">サーバーが見つかりません。</Typography>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h5" align="center" gutterBottom>
                  {currentServer.customName || currentServer.name}
                </Typography>
                {bossReminders.length > 0 ? bossReminders.map(reminder => (
                  <Paper key={reminder.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {reminder.message.replace('{{offset}}', '').trim()}
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">現在の討伐日時 (起点)</Typography>
                        <Typography variant="body1" fontWeight="bold">{formatStartTime(reminder.startTime)}</Typography>
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems="flex-start">
                        <Box>
                          <Typography variant="caption" color="text.secondary">進める</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            {[1, 5, 10].map(min => (
                              <Button key={`fwd-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{min}分</Button>
                            ))}
                          </Stack>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">戻す</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            {[-1, -5, -10].map(min => (
                              <Button key={`back-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{Math.abs(min)}分</Button>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                )) : (
                  <Typography align="center" color="text.secondary">このサーバーにはボスリマインダーが登録されていません。</Typography>
                )}
              </Stack>
            )}
          </Container>
        )
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      )}

      <Dialog open={isPasswordDialogOpen} onClose={(_, reason) => reason !== 'backdropClick'}>
        <DialogTitle>パスワード認証</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            このサーバーを編集するにはパスワードが必要です。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="サーバーパスワード"
            type="password"
            fullWidth
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!verificationError}
            helperText={verificationError}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordSubmit} disabled={isVerifying}>
            {isVerifying ? '確認中...' : '認証'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* ★★★★★ ここまで修正 ★★★★★ */}
    </Box>
  );
};