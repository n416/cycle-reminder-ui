import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks.ts';
import { selectAllReminders, getRemindersStatus, fetchReminders, deleteExistingReminder, toggleStatusAsync, Reminder, updateExistingReminder } from './remindersSlice.ts';
import { selectAllServers, getServersStatus, Server } from '@/features/servers/serversSlice';
import { selectWriteTokenForServer, selectUserRole } from '@/features/auth/authSlice';
import { showToast } from '@/features/toast/toastSlice';
import { MissedNotifications } from '../missed-notifications/MissedNotifications.tsx';
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Fab,
  Stack,
  Divider,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CircularProgress,
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

const getServerIconUrl = (server: Server): string | null => {
  if (server.customIcon) {
    return server.customIcon;
  }
  if (server.icon) {
    return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
  }
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

const ServerIcon = ({ serverName }: { serverName: string }) => {
  if (!serverName) {
    return null;
  }
  return <>{serverName.charAt(0)}</>;
};

const weekDayMap: { [key: string]: string } = {
  monday: '月', tuesday: '火', wednesday: '水', thursday: '木', friday: '金', saturday: '土', sunday: '日'
};

const formatRecurrenceDetails = (reminder: Reminder): string => {
  const date = new Date(reminder.startTime);
  if (isNaN(date.getTime())) return "日付設定エラー";
  const timeString = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  switch (reminder.recurrence.type) {
    case 'daily':
      return `毎日${timeString}に通知`;
    case 'weekly':
      const days = reminder.recurrence.days.map(day => weekDayMap[day]).join(',');
      return `毎週${days}曜日の${timeString}に通知`;
    case 'interval':
      return `${reminder.recurrence.hours}時間ごとに通知`;
    case 'none':
    default:
      return "繰り返しなし";
  }
};

const calculateNextOccurrence = (reminder: Reminder): Date | null => {
  const now = new Date();
  const startDate = new Date(reminder.startTime);
  if (isNaN(startDate.getTime())) return null;

  switch (reminder.recurrence.type) {
    case 'none':
      return startDate > now ? startDate : null;

    case 'daily': {
      let nextDate = now > startDate ? new Date(now) : new Date(startDate);
      nextDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
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

      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      for (let i = 0; i < 7; i++) {
        if (targetDaysOfWeek.has(nextDate.getDay())) {
          return nextDate;
        }
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return null;
    }
  }
  return null;
};

const formatNextOccurrence = (reminder: Reminder): string => {
  if (reminder.status === 'paused') {
    return '休止中';
  }
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
  const writeToken = useAppSelector(selectWriteTokenForServer(serverId!));
  const userRole = useAppSelector(selectUserRole);

  const currentServer = servers.find(s => s.id === serverId);

  const isDiscordAdmin = currentServer?.role === 'admin';
  const isOwnerOrTester = userRole === 'owner' || userRole === 'tester';

  const canWrite = (isOwnerOrTester && isDiscordAdmin) || !!writeToken;
  const canCreate = isOwnerOrTester && isDiscordAdmin;

  const [editingId, setEditingId] = useState<string | null>(null);
  // ★★★★★ ここからが修正箇所です ★★★★★
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [currentReminderId, setCurrentReminderId] = useState<null | string>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  // ★★★★★ ここまで ★★★★★
  const serverName = currentServer?.customName || currentServer?.name || '';
  const serverIconUrl = currentServer ? getServerIconUrl(currentServer) : null;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (serverId) {
      dispatch(fetchReminders(serverId));
    }
  }, [serverId, dispatch]);

  // ★★★★★ ここからが修正箇所です ★★★★★
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, reminderId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentReminderId(reminderId);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentReminderId(null);
  };

  const handleTestSend = async (reminder: Reminder) => {
    if (!canWrite || !writeToken) {
      dispatch(showToast({ message: 'テスト送信の権限がありません。', severity: 'error' }));
      return;
    }
    try {
      await apiClient.post(`/reminders/${reminder.serverId}/test-send`,
        {
          channelId: reminder.channelId,
          message: reminder.message,
          selectedEmojis: reminder.selectedEmojis,
        },
        {
          headers: { 'x-write-token': writeToken }
        }
      );
      dispatch(showToast({ message: 'テスト送信しました！', severity: 'success' }));
    } catch (error) {
      console.error('Failed to send test message:', error);
      dispatch(showToast({ message: 'テスト送信に失敗しました。', severity: 'error' }));
    }
  };
  // ★★★★★ ここまで ★★★★★

  const handleTimeAdjust = async (reminder: Reminder, minutes: number) => {
    const originalDate = new Date(reminder.startTime);
    if (isNaN(originalDate.getTime())) {
      dispatch(showToast({ message: '起点日時が無効なため、更新できません。', severity: 'error' }));
      return;
    }
    
    const newDate = new Date(originalDate.getTime() + minutes * 60000);

    const updatedReminder = {
      ...reminder,
      startTime: newDate.toISOString(),
    };

    try {
      await dispatch(updateExistingReminder(updatedReminder)).unwrap();
      const action = minutes > 0 ? '進めました' : '戻しました';
      dispatch(showToast({ message: `起点日時を ${Math.abs(minutes)} 分 ${action}。`, severity: 'success' }));
    } catch (error) {
      console.error('Failed to adjust time:', error);
      dispatch(showToast({ message: '日時の更新に失敗しました。', severity: 'error' }));
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
    if (reminders.length > 0) {
      content = reminders.map((reminder) => {
        const isEditing = editingId === reminder.id;
        const isPaused = reminder.status === 'paused';

        const displayMessage = reminder.message
          .replace(/\{\{\s*offset\s*\}\}/g, '')
          .replace(/\{\{all\}\}/g, 'スケジュールすべて')
          .trim();

        return (
          <Accordion key={reminder.id} id={`reminder-${reminder.id}`} TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.5, sm: 2 }}
                alignItems="stretch"
                sx={{ width: '100%', pr: { sm: 1 } }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                  {reminder.message.includes('{{all}}') ? (
                    <FormatListBulletedIcon color="primary" />
                  ) : (
                    <SpeakerNotesIcon color="action" />
                  )}
                  <Typography
                    sx={{
                      textDecoration: isPaused ? 'line-through' : 'none',
                      color: isPaused ? 'text.disabled' : 'text.primary',
                      whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {displayMessage.split('\n')[0]}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    color: 'text.secondary',
                    pl: { xs: '40px', sm: 0 },
                    flexShrink: 0,
                  }}
                >
                  <EventAvailableIcon fontSize="small" />
                  <Typography variant="body2" noWrap>
                    {formatNextOccurrence(reminder)}
                  </Typography>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {isEditing ? (
                 <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    <EditReminderForm reminder={reminder} onCancel={() => setEditingId(null)} />
                 </Box>
              ) : (
                <Stack spacing={0}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', margin: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {displayMessage}
                    </Typography>
                  </Box>
                  <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" spacing={1.5}><TagIcon color="action" sx={{ fontSize: 20 }} /><Typography variant="body2" color="text.secondary" sx={{ width: '80px', flexShrink: 0 }}>チャンネル</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{reminder.channel}</Typography></Stack>
                      
                      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                        <CalendarMonthIcon color="action" sx={{ fontSize: 20, mt: '8px' }} />
                        <Stack direction="column" spacing={1} sx={{ width: '100%' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ width: '80px' }}>起点日時</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatStartTime(reminder.startTime)}</Typography>
                          </Box>
                          {canWrite && (
                            <Stack 
                              direction={{ xs: 'column', sm: 'row' }} 
                              spacing={{ xs: 0.5, sm: 2 }} 
                              alignItems="flex-start"
                            >
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', pl: 0.5 }}>進める</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                  {[1, 5, 10].map((min) => (
                                    <Button key={`fwd-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{min}分</Button>
                                  ))}
                                </Stack>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', pl: 0.5 }}>戻す</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                  {[-1, -5, -10].map((min) => (
                                    <Button key={`back-${min}`} size="small" variant="contained" onClick={() => handleTimeAdjust(reminder, min)}>{Math.abs(min)}分</Button>
                                  ))}
                                </Stack>
                              </Box>
                            </Stack>
                          )}
                        </Stack>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1.5}><AutorenewIcon color="action" sx={{ fontSize: 20 }} /><Typography variant="body2" color="text.secondary" sx={{ width: '80px', flexShrink: 0 }}>サイクル</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{formatRecurrenceDetails(reminder)}</Typography></Stack>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      {canWrite && <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditingId(reminder.id)}>編集</Button>}
                      {/* ★★★★★ ここからが修正箇所です ★★★★★ */}
                      <IconButton aria-label="その他のアクション" onClick={(e) => handleMenuClick(e, reminder.id)}><MoreVertIcon /></IconButton>
                      {/* ★★★★★ ここまで ★★★★★ */}
                    </Stack>
                  </Box>
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        );
      });
    } else {
      content = <Typography sx={{ mt: 4, textAlign: 'center' }}>このサーバーにはリマインダーはまだありません。</Typography>;
    }
  }

  const selectedReminder = reminders.find(r => r.id === currentReminderId);

  return (
    <>
      {isDiscordAdmin && serverId && <MissedNotifications serverId={serverId} />}
      
      {currentServer && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar src={serverIconUrl || undefined}><ServerIcon serverName={serverName} /></Avatar>
            <Typography variant="h5" noWrap>{serverName}</Typography>
            {isDiscordAdmin && (
              <IconButton onClick={() => setIsSettingsOpen(true)} size="small" aria-label="サーバー設定">
                <SettingsIcon />
              </IconButton>
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignSelf={{ xs: 'flex-end', sm: 'center' }}>
            <Button component={Link} to={`/servers/${serverId}/log`} variant="outlined" startIcon={<HistoryIcon />}>
              操作ログ
            </Button>
          </Stack>
        </Stack>
      )}

      <Stack spacing={1.5}>{content}</Stack>
      
      {canCreate && <Fab color="primary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => navigate(`/servers/${serverId}/add`)}><AddIcon /></Fab>}

      {/* ★★★★★ ここからが修正箇所です ★★★★★ */}
      <Menu anchorEl={menuAnchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        {selectedReminder && (
          <div>
            <MenuItem disabled={!canWrite} onClick={() => { dispatch(toggleStatusAsync(selectedReminder)); handleMenuClose(); }}>
              <ListItemIcon>{selectedReminder.status === 'paused' ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}</ListItemIcon>
              <ListItemText>{selectedReminder.status === 'paused' ? '再開する' : '休止する'}</ListItemText>
            </MenuItem>

            <MenuItem disabled={!canWrite} onClick={() => { handleTestSend(selectedReminder); handleMenuClose(); }}>
              <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
              <ListItemText>テスト送信</ListItemText>
            </MenuItem>

            <Divider />
            <MenuItem disabled={!canWrite} sx={{ color: 'error.main' }} onClick={() => {
              if (serverId) {
                dispatch(deleteExistingReminder({ id: selectedReminder.id, serverId: serverId }));
              }
              handleMenuClose();
            }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>削除</ListItemText>
            </MenuItem>
          </div>
        )}
      </Menu>
      {/* ★★★★★ ここまで ★★★★★ */}

      <ServerSettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} server={currentServer ?? null} />
    </>
  );
};