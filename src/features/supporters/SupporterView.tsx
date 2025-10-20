import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchReminders, selectAllReminders, updateExistingReminder, Reminder } from '@/features/reminders/remindersSlice';
import { selectAllServers, fetchServers, getServersStatus } from '@/features/servers/serversSlice';
import { logout, selectUserRole, selectWriteTokenForServer, setWriteToken } from '@/features/auth/authSlice';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, Container, Typography, Paper, Stack, Button, CircularProgress, AppBar, Toolbar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, useTheme, useMediaQuery
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import apiClient from '@/api/client';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import '../reminders/Clock.css';
// ★★★★★ ここから追加 ★★★★★
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import TonalityIcon from '@mui/icons-material/Tonality';
import { useColorMode } from '@/components/ThemeRegistry';
// ★★★★★ ここまで追加 ★★★★★


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

// datetime-local input 用にDateオブジェクトをフォーマットするヘルパー関数
const toLocalISOString = (date: Date): string => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};


export const SupporterView = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const colorMode = useColorMode(); // ★★★★★ colorModeフックを呼び出し


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
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // 新しいモーダル/ダイアログ用のState
  const [manualInputReminder, setManualInputReminder] = useState<Reminder | null>(null);
  const [manualTime, setManualTime] = useState('');
  const [nowConfirmReminder, setNowConfirmReminder] = useState<Reminder | null>(null);
  const [manualTimeValue, setManualTimeValue] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const date = new Date(manualTime);
      if (!isNaN(date.getTime())) {
        setManualTimeValue(date);
      } else {
        setManualTimeValue(null);
      }
    } catch {
      setManualTimeValue(null);
    }
  }, [manualTime]);


  // 初回マウント時にサーバーリストをフェッチ
  useEffect(() => {
    if (servers.length === 0) {
        dispatch(fetchServers());
    }
  }, [dispatch, servers.length]);

  // このページ専用のアクセス制御とデータ取得
  useEffect(() => {
    if (serversStatus === 'succeeded' && userRole !== 'unknown') {
      const isSupporter = userRole === 'supporter';
      const isHitServer = currentServer?.serverType === 'hit_the_world';

      if (!isSupporter || !isHitServer) {
        navigate('/servers', { replace: true });
        return;
      }
      
      const checkAuthAndFetchData = async () => {
        if (writeToken) {
          if (serverId) dispatch(fetchReminders(serverId));
          setIsAuthChecked(true);
        } else {
          try {
            if (!serverId) return;
            const response = await apiClient.post(`/servers/${serverId}/verify-password`, { password: '' });
            const newWriteToken = response.data.writeToken;
            dispatch(setWriteToken({ serverId, token: newWriteToken }));
            dispatch(fetchReminders(serverId));
          } catch (error) {
            setIsPasswordDialogOpen(true);
          } finally {
            setIsAuthChecked(true);
          }
        }
      };
      
      checkAuthAndFetchData();
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
      dispatch(fetchReminders(serverId));
    } catch (error) {
      setVerificationError('パスワードが違います。');
    } finally {
      setIsVerifying(false);
    }
  };

  // マニュアル入力モーダルのハンドラ
  const handleOpenManualInput = (reminder: Reminder) => {
    setManualInputReminder(reminder);
    setManualTime(toLocalISOString(new Date(reminder.startTime)));
  };
  const handleCloseManualInput = () => setManualInputReminder(null);

  const handleManualTimeSubmit = async () => {
    if (!manualInputReminder || !manualTime) return;
    const updatedReminder = { ...manualInputReminder, startTime: new Date(manualTime).toISOString() };
    try {
      await dispatch(updateExistingReminder(updatedReminder)).unwrap();
      dispatch(showToast({ message: '起点日時を更新しました。', severity: 'success' }));
      handleCloseManualInput();
    } catch (error) {
      dispatch(showToast({ message: '日時の更新に失敗しました。', severity: 'error' }));
    }
  };
  
  // モーダル内でNOWボタンが押されたときの処理
  const handleSetManualTimeToNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    setManualTime(toLocalISOString(now));
  };


  // NOW!! 確認ダイアログのハンドラ
  const handleOpenNowConfirm = (reminder: Reminder) => setNowConfirmReminder(reminder);
  const handleCloseNowConfirm = () => setNowConfirmReminder(null);
  
  const handleNowSubmit = async () => {
    if (!nowConfirmReminder) return;
    const now = new Date();
    now.setSeconds(0, 0); // 秒は切り捨て
    const updatedReminder = { ...nowConfirmReminder, startTime: now.toISOString() };
    try {
      await dispatch(updateExistingReminder(updatedReminder)).unwrap();
      dispatch(showToast({ message: '起点日時を現在時刻に更新しました。', severity: 'success' }));
      handleCloseNowConfirm();
    } catch (error) {
      dispatch(showToast({ message: '日時の更新に失敗しました。', severity: 'error' }));
    }
  };
  
  // 時計プレビューをレンダリングする関数
  const renderIntervalClocks = () => {
    if (!manualTimeValue || !manualInputReminder) return null;
    const now = new Date();
    const clocks = [];
    const intervalHours = (manualInputReminder.recurrence as { type: 'interval', hours: number }).hours;

    let nextStartTime = new Date(manualTimeValue);
    while (nextStartTime <= now) {
      nextStartTime.setHours(nextStartTime.getHours() + intervalHours);
    }

    for (let i = 0; i < 3; i++) {
      const nextTime = new Date(nextStartTime.getTime() + i * intervalHours * 60 * 60 * 1000);
      clocks.push(
        <Stack key={i} alignItems="center" spacing={1}>
          <Clock value={nextTime} size={isSmallScreen ? 70 : 100} renderNumbers />
          <Typography variant="caption">{nextTime.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>
        </Stack>
      );
    }
    return clocks;
  };

  // ★★★★★ ここから追加 ★★★★★
  const renderThemeIcon = () => {
    if (colorMode.mode === 'auto') {
      return <TonalityIcon />;
    }
    if (theme.palette.mode === 'dark') {
      return <Brightness7Icon />;
    }
    return <Brightness4Icon />;
  };
  // ★★★★★ ここまで追加 ★★★★★

  const bossReminders = reminders.filter(isBossReminder);
  const canView = isAuthChecked && userRole === 'supporter' && currentServer?.serverType === 'hit_the_world' && !!writeToken;


  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <AccessTimeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>時刻更新モード</Typography>
          {/* ★★★★★ ここからが修正箇所です ★★★★★ */}
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {renderThemeIcon()}
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} aria-label="ログアウト"><LogoutIcon /></IconButton>
          {/* ★★★★★ ここまで修正 ★★★★★ */}
        </Toolbar>
      </AppBar>

      {isAuthChecked ? (
        canView && (
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            {remindersStatus === 'loading' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : !currentServer ? (
              <Typography color="error" align="center">サーバーが見つかりません。</Typography>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h5" align="center" gutterBottom>{currentServer.customName || currentServer.name}</Typography>
                {bossReminders.length > 0 ? bossReminders.map(reminder => (
                  <Paper key={reminder.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>{reminder.message.replace('{{offset}}', '').trim()}</Typography>
                    <Stack spacing={0}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">現在の討伐日時 (起点)</Typography>
                        <Typography variant="h5" component="p">{formatStartTime(reminder.startTime)}</Typography>
                      </Box>
                      <Stack spacing={1.5} alignItems="flex-start" sx={{ width: '100%', mt: 0 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">進める</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    {[1, 5, 10].map(min => <Button key={`fwd-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{min}分</Button>)}
                                </Stack>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">戻す</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    {[-1, -5, -10].map(min => <Button key={`back-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{Math.abs(min)}分</Button>)}
                                </Stack>
                            </Box>
                        </Stack>
                        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5, width: '100%' }}>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" onClick={() => handleOpenManualInput(reminder)}>マニュアル入力</Button>
                            <Button size="small" variant="contained" color="warning" onClick={() => handleOpenNowConfirm(reminder)}>NOW!!</Button>
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
          <DialogContentText sx={{ mb: 2 }}>このサーバーを編集するにはパスワードが必要です。</DialogContentText>
          <TextField
            autoFocus margin="dense" label="サーバーパスワード" type="password" fullWidth variant="standard"
            value={password} onChange={(e) => setPassword(e.target.value)}
            error={!!verificationError} helperText={verificationError}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordSubmit} disabled={isVerifying}>{isVerifying ? '確認中...' : '認証'}</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={!!manualInputReminder} onClose={handleCloseManualInput} fullWidth maxWidth="sm">
        <DialogTitle>日時を手動で更新</DialogTitle>
        <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} alignItems="stretch">
                    <TextField
                        autoFocus margin="dense" label="討伐日時" type="datetime-local" fullWidth
                        value={manualTime} onChange={(e) => setManualTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="outlined" onClick={handleSetManualTimeToNow} startIcon={<AccessTimeIcon />}>
                      NOW!
                    </Button>
                </Stack>
                {manualTimeValue && (
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        {renderIntervalClocks()}
                    </Paper>
                )}
            </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManualInput}>キャンセル</Button>
          <Button onClick={handleManualTimeSubmit} variant="contained">更新</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={!!nowConfirmReminder} onClose={handleCloseNowConfirm}>
        <DialogTitle>現在時刻で上書きしますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{nowConfirmReminder?.message.replace('{{offset}}', '').trim()}」の討伐日時を現在の時刻で上書きします。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNowConfirm}>キャンセル</Button>
          <Button onClick={handleNowSubmit} color="warning" variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};