import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateExistingReminder, Reminder } from '../reminders/remindersSlice';
import { fetchChannels, selectChannelsForServer, getChannelsStatus } from '../channels/channelsSlice';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, TextField, Button, Stack, Typography, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Select, MenuItem, IconButton,
  CircularProgress, Divider, InputLabel, Paper
} from '@mui/material';
import { useParams } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';

const bossOptions = [
  { group: '墓地', name: '2F） スケロ' },
  { group: '墓地', name: '3F） リセメン' },
  { group: '墓地', name: '4F） ユリア' },
  { group: '啓示', name: '3F） グレゴ' },
  { group: '啓示', name: '5F） ケンタ' },
  { group: '黎明', name: '2F） アルサ' },
  { group: '黎明', name: '5F） アズラエル' },
];

// ★★★★★ safeCreateDate関数を削除 ★★★★★

const toLocalISOString = (date: Date): string => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

interface EditBossReminderFormProps {
  reminder: Reminder;
  onCancel: () => void;
}

export const EditBossReminderForm: React.FC<EditBossReminderFormProps> = ({ reminder, onCancel }) => {
  const { serverId } = useParams<{ serverId: string }>();
  const dispatch = useAppDispatch();

  const channels = useAppSelector(selectChannelsForServer(reminder.serverId));
  const channelsStatus = useAppSelector(getChannelsStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reminder.serverId && !channels) {
      dispatch(fetchChannels({ serverId: reminder.serverId }));
    }
  }, [reminder.serverId, channels, dispatch]);

  const isPreset = bossOptions.some(boss => boss.name === reminder.message);
  const [messageType, setMessageType] = useState<'preset' | 'manual'>(isPreset ? 'preset' : 'manual');
  const [presetMessage, setPresetMessage] = useState<string>(isPreset ? reminder.message : bossOptions[0].name);
  const [manualMessage, setManualMessage] = useState<string>(isPreset ? '' : reminder.message);
  const [channelId, setChannelId] = useState(reminder.channelId);

  // ★★★★★ startTimeの初期化をシンプルに修正 ★★★★★
  const initialDate = reminder.startTime ? new Date(reminder.startTime) : null;
  const [startTime, setStartTime] = useState(initialDate ? toLocalISOString(initialDate) : '');
  
  const [offsets, setOffsets] = useState(reminder.notificationOffsets?.join(', ') || '60, 10, 0');

  const recurrenceType: 'interval' = 'interval';
  const intervalHours = 20;

  const handleSetNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    setStartTime(toLocalISOString(now));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const finalMessage = messageType === 'preset' ? presetMessage : manualMessage;
    if (!finalMessage || !channelId || !startTime || !reminder.serverId) {
        dispatch(showToast({ message: 'すべての項目を入力してください。', severity: 'warning' }));
        setIsSubmitting(false);
        return;
    }
    
    const parsedOffsets = offsets
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0);

    const recurrence = { type: recurrenceType, hours: intervalHours };
    const selectedChannel = channels?.find(ch => ch.id === channelId);

    const reminderData: Reminder = {
      ...reminder,
      message: finalMessage,
      channel: selectedChannel?.name || reminder.channel,
      channelId: channelId,
      startTime: new Date(startTime).toISOString(),
      recurrence,
      notificationOffsets: parsedOffsets,
    };

    try {
      await dispatch(updateExistingReminder(reminderData)).unwrap();
      dispatch(showToast({ message: 'ボスリマインダーを更新しました。', severity: 'success' }));
      onCancel();
    } catch (error) {
      console.error(`Failed to update the boss reminder: `, error);
      dispatch(showToast({ message: `リマインダーの更新に失敗しました。`, severity: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Stack spacing={3}>
          <FormControl component="fieldset">
            <FormLabel component="legend">ボス名</FormLabel>
            <RadioGroup row value={messageType} onChange={(e) => setMessageType(e.target.value as 'preset' | 'manual')}>
              <FormControlLabel value="preset" control={<Radio />} label="定型から選択" />
              <FormControlLabel value="manual" control={<Radio />} label="手動入力" />
            </RadioGroup>
          </FormControl>

          {messageType === 'preset' && (
            <FormControl fullWidth variant="filled">
              <InputLabel id="preset-boss-select-label">定型ボス名</InputLabel>
              <Select
                labelId="preset-boss-select-label"
                value={presetMessage}
                label="定型ボス名"
                onChange={(e) => setPresetMessage(e.target.value)}
              >
                {bossOptions.map((boss) => (
                  <MenuItem key={boss.name} value={boss.name}>
                    {boss.group} {boss.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {messageType === 'manual' && (
            <TextField
              label="ボス名 (手動入力)"
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              required
              fullWidth
              variant="filled"
            />
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl fullWidth variant="filled">
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
                  channelId ? <MenuItem value={channelId}>{reminder.channel || channelId}</MenuItem> : <MenuItem disabled>読込中...</MenuItem>
                )}
              </Select>
            </FormControl>
            <IconButton onClick={() => dispatch(fetchChannels({ serverId: reminder.serverId, forceRefresh: true }))} disabled={channelsStatus === 'loading'}>
              {channelsStatus === 'loading' ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
            <TextField
              label="最後にボスを討伐した日時 (起点)"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
              variant="filled"
            />
            <Button variant="outlined" onClick={handleSetNow} startIcon={<AccessTimeIcon />}>
              NOW!
            </Button>
          </Stack>

          <TextField
            label="事前通知オフセット（分）"
            value={offsets}
            onChange={(e) => setOffsets(e.target.value)}
            fullWidth
            helperText="「60, 10, 0」と入力すると、60分前・10分前・時間丁度に通知されます。"
            variant="filled"
          />

          <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'transparent' }}>
             <Typography variant="body2" color="text.secondary">サイクル: 時間間隔 ({intervalHours}時間ごと)</Typography>
          </Paper>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onCancel} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? '更新中...' : '更新する'}
            </Button>
          </Stack>
        </Stack>
    </Box>
  );
};