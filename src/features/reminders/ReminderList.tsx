import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks.ts';
import { selectAllReminders, getRemindersStatus, fetchReminders, deleteExistingReminder, toggleStatusAsync, Reminder, updateExistingReminder } from './remindersSlice.ts';
import { selectAllServers, getServersStatus, Server } from '@/features/servers/serversSlice';
import { setWriteToken } from '@/features/auth/authSlice';
import { showToast } from '@/features/toast/toastSlice';
import { MissedNotifications } from '../missed-notifications/MissedNotifications.tsx';
import {
  Typography, Accordion, AccordionSummary, AccordionDetails, Box, Fab, Stack, Divider, Button, Avatar, Menu, MenuItem,
  ListItemIcon, ListItemText, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import TagIcon from '@mui/icons-material/Tag';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { EditReminderForm } from './EditReminderForm.tsx';
import apiClient from '@/api/client';
import { ServerSettingsModal } from '../servers/ServerSettingsModal';
import LockOpenIcon from '@mui/icons-material/LockOpen';
// ★★★★★ ここからが修正箇所です ★★★★★
import { useServerPermission } from '@/hooks/useServerPermission';
// ★★★★★ ここまで ★★★★★

const getServerIconUrl = (server: Server): string | null => {
  if (server.customIcon) return server.customIcon;
  if (server.icon) return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
  return null;
};

const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
};

const formatStartTime = (startTimeValue: string): string => {
  const date = new Date(startTimeValue);
  if (isNaN(date.getTime())) return "無効な日付";
  return new Intl.DateTimeFormat('ja-JP', dateTimeFormatOptions).format(date);
};

const ServerIcon = ({ serverName }: { serverName: string }) => serverName ? <>{serverName.charAt(0)}</> : null;

const weekDayMap: { [key: string]: string } = {
  monday: '月', tuesday: '火', wednesday: '水', thursday: '木', friday: '金', saturday: '土', sunday: '日'
};

const formatRecurrenceDetails = (reminder: Reminder): string => {
  const date = new Date(reminder.startTime);
  if (isNaN(date.getTime())) return "日付設定エラー";
  const timeString = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  switch (reminder.recurrence.type) {
    case 'daily': return `毎日${timeString}に通知`;
    case 'weekly': return `毎週${reminder.recurrence.days.map(day => weekDayMap[day]).join(',')}曜日の${timeString}に通知`;
    case 'interval': return `${reminder.recurrence.hours}時間ごとに通知`;
    default: return "繰り返しなし";
  }
};

const calculateNextOccurrence = (reminder: Reminder): Date | null => {
  const now = new Date();
  const startDate = new Date(reminder.startTime);
  if (isNaN(startDate.getTime())) return null;

  switch (reminder.recurrence.type) {
    case 'none': return startDate > now ? startDate : null;
    case 'daily': {
      let nextDate = now > startDate ? new Date(now) : new Date(startDate);
      nextDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    }
    case 'interval':
      let nextIntervalDate = new Date(startDate);
      while (nextIntervalDate <= now) {
        nextIntervalDate.setHours(nextIntervalDate.getHours() + reminder.recurrence.hours);
      }
      return nextIntervalDate;
    case 'weekly': {
      const dayMap: { [key: string]: number } = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
      const targetDaysOfWeek = new Set(reminder.recurrence.days.map(day => dayMap[day]));
      if (targetDaysOfWeek.size === 0) return null;
      let nextDate = now > startDate ? new Date(now) : new Date(startDate);
      nextDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
      for (let i = 0; i < 7; i++) {
        if (targetDaysOfWeek.has(nextDate.getDay())) return nextDate;
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return null;
    }
  }
  return null;
};

const formatNextOccurrence = (reminder: Reminder): string => {
  if (reminder.status === 'paused') return '休止中';
  const date = calculateNextOccurrence(reminder);
  if (!date) return '終了または設定エラー';
  return new Intl.DateTimeFormat('ja-JP', dateTimeFormatOptions).format(date);
};

export const ReminderList = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const reminders = useAppSelector(selectAllReminders);
  const remindersStatus = useAppSelector(getRemindersStatus);
  const error = useAppSelector(state => state.reminders.error);
  const servers = useAppSelector(selectAllServers);
  const serversStatus = useAppSelector(getServersStatus);
  const currentServer = servers.find(s => s.id === serverId);

  // ★★★★★ ここからが修正箇所です ★★★★★
  const { canCreate, canEdit, canManageServerSettings, canViewLogs, isLockedByPassword } = useServerPermission(serverId);
  // ★★★★★ ここまで ★★★★★

  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [currentReminderId, setCurrentReminderId] = useState<null | string>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const serverName = currentServer?.customName || currentServer?.name || '';
  const serverIconUrl = currentServer ? getServerIconUrl(currentServer) : null;
  const isMenuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    if (serverId) {
      dispatch(fetchReminders(serverId));
    }
  }, [serverId, dispatch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, reminderId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentReminderId(reminderId);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentReminderId(null);
  };

  const handleTestSend = async (reminder: Reminder) => {
    // canEdit権限で代用
    if (!canEdit) {
      dispatch(showToast({ message: 'テスト送信の権限がありません。', severity: 'error' }));
      return;
    }
    try {
      await apiClient.post(`/reminders/${reminder.serverId}/test-send`, {
        channelId: reminder.channelId,
        message: reminder.message,
        selectedEmojis: reminder.selectedEmojis,
      });
      dispatch(showToast({ message: 'テスト送信しました！', severity: 'success' }));
    } catch (error) {
      dispatch(showToast({ message: 'テスト送信に失敗しました。', severity: 'error' }));
    }
  };

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

  const handlePasswordSubmit = async () => {
    if (!serverId) return;
    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await apiClient.post(`/servers/${serverId}/verify-password`, { password });
      dispatch(setWriteToken({ serverId, token: response.data.writeToken }));
      setIsPasswordDialogOpen(false);
      setPassword('');
      dispatch(showToast({ message: 'ロックを解除しました。', severity: 'success' }));
    } catch (error) {
      setVerificationError('パスワードが違います。');
    } finally {
      setIsVerifying(false);
    }
  };

  let content;
  if (serversStatus !== 'succeeded' || remindersStatus === 'loading') {
    content = <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  } else if (!currentServer) {
    content = <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>指定されたサーバーの情報が見つかりませんでした。</Typography>;
  } else if (remindersStatus === 'failed') {
    content = <Typography color="error">エラー: {error}</Typography>;
  } else if (remindersStatus === 'succeeded') {
    content = reminders.length > 0 ? (
      reminders.map((reminder) => {
        const isEditing = editingId === reminder.id;
        const isPaused = reminder.status === 'paused';
        const displayMessage = reminder.message.replace(/\{\{\s*offset\s*\}\}/g, '').replace(/\{\{all\}\}/g, 'スケジュールすべて').trim();

        return (
          <Accordion key={reminder.id} TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} alignItems="stretch" sx={{ width: '100%', pr: { sm: 1 } }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                  {reminder.message.includes('{{all}}') ? <FormatListBulletedIcon color="primary" /> : <SpeakerNotesIcon color="action" />}
                  <Typography sx={{ textDecoration: isPaused ? 'line-through' : 'none', color: isPaused ? 'text.disabled' : 'text.primary', whiteSpace: { xs: 'normal', sm: 'nowrap' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayMessage.split('\n')[0]}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', pl: { xs: '40px', sm: 0 }, flexShrink: 0 }}>
                  <EventAvailableIcon fontSize="small" />
                  <Typography variant="body2" noWrap>{formatNextOccurrence(reminder)}</Typography>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {isEditing ? (
                <Box sx={{ p: { xs: 1, sm: 2 } }}><EditReminderForm reminder={reminder} onCancel={() => setEditingId(null)} /></Box>
              ) : (
                <Stack>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', margin: 2 }}><Typography sx={{ whiteSpace: 'pre-wrap' }}>{displayMessage}</Typography></Box>
                  <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" spacing={1.5}><TagIcon color="action" fontSize="small" /><Typography variant="body2" color="text.secondary" sx={{ width: '80px', flexShrink: 0 }}>チャンネル</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{reminder.channel}</Typography></Stack>
                      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                        <CalendarMonthIcon color="action" fontSize="small" sx={{ mt: '4px' }} />
                        <Stack sx={{ width: '100%' }}>
                          <Typography variant="body2" color="text.secondary">起点日時</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>{formatStartTime(reminder.startTime)}</Typography>
                          {canEdit && (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                              <Box><Typography variant="caption" color="text.secondary">進める</Typography><Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>{[1, 5, 10].map((min) => <Button key={`fwd-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{min}分</Button>)}</Stack></Box>
                              <Box><Typography variant="caption" color="text.secondary">戻す</Typography><Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>{[-1, -5, -10].map((min) => <Button key={`back-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{Math.abs(min)}分</Button>)}</Stack></Box>
                            </Stack>
                          )}
                        </Stack>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1.5}><AutorenewIcon color="action" fontSize="small" /><Typography variant="body2" color="text.secondary" sx={{ width: '80px', flexShrink: 0 }}>サイクル</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{formatRecurrenceDetails(reminder)}</Typography></Stack>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      {canEdit && <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditingId(reminder.id)}>編集</Button>}
                      <IconButton aria-label="その他のアクション" onClick={(e) => handleMenuClick(e, reminder.id)}><MoreVertIcon /></IconButton>
                    </Stack>
                  </Box>
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })
    ) : (
      <Typography sx={{ mt: 4, textAlign: 'center' }}>このサーバーにはリマインダーはまだありません。</Typography>
    );
  }

  const selectedReminder = reminders.find(r => r.id === currentReminderId);

  return (
    <>
      {canManageServerSettings && serverId && <MissedNotifications serverId={serverId} />}

      {currentServer && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar src={serverIconUrl || undefined}><ServerIcon serverName={serverName} /></Avatar>
            <Typography variant="h5" noWrap>{serverName}</Typography>
            {canManageServerSettings && <IconButton onClick={() => setIsSettingsOpen(true)} size="small"><SettingsIcon /></IconButton>}
          </Stack>
          <Stack direction="row" spacing={1} alignSelf={{ xs: 'flex-end', sm: 'center' }}>
            {isLockedByPassword && <Button variant="outlined" startIcon={<LockOpenIcon />} onClick={() => setIsPasswordDialogOpen(true)} color="warning">編集ロックを解除</Button>}
            {canViewLogs && <Button component={Link} to={`/servers/${serverId}/log`} variant="outlined" startIcon={<HistoryIcon />}>操作ログ</Button>}
          </Stack>
        </Stack>
      )}

      <Stack spacing={1.5}>{content}</Stack>

      {canCreate && <Fab color="primary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => navigate(`/servers/${serverId}/add`)}><AddIcon /></Fab>}

      <Menu anchorEl={menuAnchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        {selectedReminder && (
          <div>
            <MenuItem disabled={!canEdit} onClick={() => { dispatch(toggleStatusAsync(selectedReminder)); handleMenuClose(); }}>
              <ListItemIcon>{selectedReminder.status === 'paused' ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}</ListItemIcon>
              <ListItemText>{selectedReminder.status === 'paused' ? '再開する' : '休止する'}</ListItemText>
            </MenuItem>
            <MenuItem disabled={!canEdit} onClick={() => { handleTestSend(selectedReminder); handleMenuClose(); }}>
              <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon><ListItemText>テスト送信</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem disabled={!canEdit} sx={{ color: 'error.main' }} onClick={() => { if (serverId) dispatch(deleteExistingReminder({ id: selectedReminder.id, serverId })); handleMenuClose(); }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>削除</ListItemText>
            </MenuItem>
          </div>
        )}
      </Menu>

      <ServerSettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} server={currentServer ?? null} />

      <Dialog open={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)}>
        <DialogTitle>パスワード認証</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>このサーバーを編集するにはパスワードが必要です。</DialogContentText>
          <TextField autoFocus margin="dense" label="サーバーパスワード" type="password" fullWidth variant="standard" value={password} onChange={(e) => setPassword(e.target.value)} error={!!verificationError} helperText={verificationError} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPasswordDialogOpen(false)} disabled={isVerifying}>キャンセル</Button>
          <Button onClick={handlePasswordSubmit} disabled={isVerifying}>{isVerifying ? '確認中...' : '認証'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};