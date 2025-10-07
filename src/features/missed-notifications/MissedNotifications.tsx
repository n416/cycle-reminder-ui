import React, { useEffect } from 'react';
import { Alert, AlertTitle, Button, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMissedNotifications, acknowledgeNotification, selectMissedNotifications } from './missedNotificationsSlice';

interface MissedNotificationsProps {
  serverId: string;
}

export const MissedNotifications: React.FC<MissedNotificationsProps> = ({ serverId }) => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectMissedNotifications);

  // --- ★★★ 調査用ログを追加 ★★★ ---
  console.log('%c[MissedNotifications Component] レンダリングされました。', 'color: orange; font-weight: bold;');
  console.log('[MissedNotifications Component] 受け取ったサーバーID:', serverId);
  console.log('[MissedNotifications Component] 現在の通知リスト:', notifications);
  // --- ★★★ ここまで追加 ★★★ ---

  useEffect(() => {
    if (serverId) {
      dispatch(fetchMissedNotifications(serverId));
    }
  }, [serverId, dispatch]);

  const handleAcknowledge = (id: string) => {
    dispatch(acknowledgeNotification(id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      {notifications.map(notification => (
        <Alert
          key={notification.id}
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => handleAcknowledge(notification.id)}>
              確認済みにする
            </Button>
          }
        >
          <AlertTitle>リマインダーの送信に失敗しました</AlertTitle>
          <Typography variant="body2">
            <strong>日時:</strong> {new Date(notification.missedAt.seconds * 1000).toLocaleString('ja-JP')}
          </Typography>
          <Typography variant="body2">
            <strong>チャンネル:</strong> {notification.channelName}
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            <strong>メッセージ:</strong> {notification.reminderMessage}
          </Typography>
        </Alert>
      ))}
    </Stack>
  );
};