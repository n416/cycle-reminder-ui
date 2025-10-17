import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Select, MenuItem, FormControl, InputLabel, TextField, CircularProgress,
  DialogContentText, Box, Stack
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchChannels, selectChannelsForServer, getChannelsStatus } from '../channels/channelsSlice';
import { addDailySummaryReminder } from './remindersSlice';
import { showToast } from '@/features/toast/toastSlice';

interface DailySummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
}

export const DailySummaryDialog: React.FC<DailySummaryDialogProps> = ({ isOpen, onClose, serverId }) => {
  const dispatch = useAppDispatch();
  const channels = useAppSelector(selectChannelsForServer(serverId));
  const channelsStatus = useAppSelector(getChannelsStatus);

  const [selectedChannel, setSelectedChannel] = useState('');
  const [time, setTime] = useState('08:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ダイアログが開かれた際、チャンネル情報がなければ取得
    if (isOpen && serverId && !channels) {
      dispatch(fetchChannels({ serverId }));
    }
  }, [isOpen, serverId, channels, dispatch]);

  useEffect(() => {
    // チャンネルリストが読み込まれたら、先頭のチャンネルをデフォルト選択
    if (channels && channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedChannel || !time) {
      dispatch(showToast({ message: 'チャンネルと時刻を設定してください。', severity: 'warning' }));
      return;
    }
    setIsSubmitting(true);
    try {
      // 新しく作成するThunkを呼び出す
      await dispatch(addDailySummaryReminder({ serverId, channelId: selectedChannel, time })).unwrap();
      dispatch(showToast({ message: '「今日の予定」リマインダーを作成しました。', severity: 'success' }));
      onClose();
    } catch (error) {
      dispatch(showToast({ message: 'リマインダーの作成に失敗しました。', severity: 'error' }));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>「今日の予定」リマインダー作成</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          毎日指定した時間に、24時間以内の予定を一覧でお知らせするリマインダーを自動作成します。
        </DialogContentText>
        <Box sx={{ minHeight: 120, pt: 1 }}>
          {channelsStatus === 'loading' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="channel-select-label">通知チャンネル</InputLabel>
                <Select
                  labelId="channel-select-label"
                  value={selectedChannel}
                  label="通知チャンネル"
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  {channels?.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                id="time-input"
                label="通知時刻"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting || !selectedChannel}>
          {isSubmitting ? '作成中...' : '作成する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};