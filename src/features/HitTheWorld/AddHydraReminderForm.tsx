import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addNewReminder, Reminder } from '../reminders/remindersSlice';
import { fetchChannels, selectChannelsForServer, getChannelsStatus } from '../channels/channelsSlice';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, Button, Stack, Typography, FormControl,
  Select, MenuItem, IconButton, CircularProgress,
  Divider, InputLabel, Paper
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import WaterIcon from '@mui/icons-material/Water'; // ヒュドラ用アイコン

const getISOTimeForToday = (hour: number, minute: number): string => {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString();
};

export const AddHydraReminderForm: React.FC = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const channels = useAppSelector(selectChannelsForServer(serverId!));
  const channelsStatus = useAppSelector(getChannelsStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    if (serverId && !channels) {
      dispatch(fetchChannels({ serverId }));
    }
  }, [serverId, channels, dispatch]);

  useEffect(() => {
    if (channels && Array.isArray(channels) && channels.length > 0 && !channelId) {
      setChannelId(channels[0].id);
    }
  }, [channels, channelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!channelId || !serverId) {
        dispatch(showToast({ message: '通知チャンネルを選択してください。', severity: 'warning' }));
        setIsSubmitting(false);
        return;
    }

    const selectedChannel = channels?.find(ch => ch.id === channelId);
    
    const recurrence = { type: 'daily' as 'daily' };
    
    const hydraOffsets = [30, 5, 0];

    // ★★★★★ ここからが修正箇所です ★★★★★
    const hydraNoonData = {
      message: "ヒュドラ (昼) {{offset}}", // {{offset}} を追加
      channel: selectedChannel?.name || '',
      channelId: channelId,
      startTime: getISOTimeForToday(12, 30),
      recurrence,
      status: 'active',
      selectedEmojis: [],
      hideNextTime: false,
      notificationOffsets: hydraOffsets,
    };

    const hydraNightData = {
      message: "ヒュドラ (夜) {{offset}}", // {{offset}} を追加
      channel: selectedChannel?.name || '',
      channelId: channelId,
      startTime: getISOTimeForToday(20, 30),
      recurrence,
      status: 'active',
      selectedEmojis: [],
      hideNextTime: false,
      notificationOffsets: hydraOffsets,
    };
    // ★★★★★ ここまで ★★★★★

    try {
      await dispatch(addNewReminder({ serverId, newReminder: hydraNoonData as Omit<Reminder, 'id'|'serverId'> })).unwrap();
      await dispatch(addNewReminder({ serverId, newReminder: hydraNightData as Omit<Reminder, 'id'|'serverId'> })).unwrap();
      
      dispatch(showToast({ message: 'ヒュドラリマインダー (昼/夜) を追加しました。', severity: 'success' }));
      navigate(`/servers/${serverId}`);
    } catch (error) {
      console.error(`Failed to add the hydra reminders: `, error);
      dispatch(showToast({ message: `リマインダーの追加に失敗しました。`, severity: 'error' }));
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <WaterIcon color="info" />
        <Typography variant="h5">
          ヒュドラリマインダーを新規追加
        </Typography>
      </Stack>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>

          <Paper variant="outlined" sx={{ p: 2 }}>
             <Typography variant="body1" gutterBottom>
               <strong>サイクル (固定)</strong>
             </Typography>
             <Typography variant="body2" color="text.secondary" gutterBottom>
               毎日 12:30 (昼) と 20:30 (夜) に通知されます。
             </Typography>
             <Typography variant="body1" gutterBottom sx={{ mt: 1 }}>
               <strong>事前通知 (固定)</strong>
             </Typography>
             <Typography variant="body2" color="text.secondary">
               30分前、5分前、時間丁度に通知されます。
             </Typography>
          </Paper>

          <FormControl fullWidth>
              <InputLabel id="channel-select-label">通知チャンネル</InputLabel>
              <Select
                labelId="channel-select-label"
                value={channelId}
                label="通知チャンネル"
                onChange={(e) => setChannelId(e.target.value)}
                disabled={!channels || channelsStatus === 'loading'}
              >
                {channels && Array.isArray(channels) ? (
                  channels.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>チャンネル読込中...</MenuItem>
                )}
              </Select>
            </FormControl>

          <Divider sx={{ pt: 1 }} />
          
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="text" onClick={() => navigate(`/servers/${serverId}`)} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting} startIcon={<WaterIcon />}>
              {isSubmitting ? '追加中...' : '2件のリマインダーを追加'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};