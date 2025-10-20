import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchReminders, selectAllReminders, updateExistingReminder, Reminder } from '@/features/reminders/remindersSlice';
import { selectAllServers, fetchServers } from '@/features/servers/serversSlice';
import { logout } from '@/features/auth/authSlice';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, Container, Typography, Paper, Stack, Button, CircularProgress, AppBar, Toolbar, IconButton
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
  const serversStatus = useAppSelector(state => state.servers.status);
  
  const currentServer = servers.find(s => s.id === serverId);

  // 初回マウント時にサーバーリストとリマインダーリストをフェッチ
  useEffect(() => {
    if (servers.length === 0) {
        dispatch(fetchServers());
    }
    if (serverId) {
      dispatch(fetchReminders(serverId));
    }
  }, [serverId, dispatch, servers.length]);

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

  const bossReminders = reminders.filter(isBossReminder);

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

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        {serversStatus !== 'succeeded' || remindersStatus === 'loading' ? (
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
    </Box>
  );
};