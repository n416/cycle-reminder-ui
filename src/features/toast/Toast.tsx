import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { closeToast } from './toastSlice';
import { ToastNotification } from './types'; // 型定義を別ファイルに分離

export const Toast = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.toast.notifications);
  
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<ToastNotification | undefined>(undefined);

  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      // 表示すべき次の通知をセットし、キューの先頭から取り出す
      setCurrentNotification({ ...notifications[0] });
      setOpen(true);
    } else if (notifications.length === 0 && open) {
      // キューが空になったら閉じる
      setOpen(false);
    }
  }, [notifications, currentNotification, open]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    // 表示が完全に終わったら、Reduxストアから該当の通知を削除
    if (currentNotification) {
      dispatch(closeToast(currentNotification.key));
    }
    // 次の通知を表示する準備をする
    setCurrentNotification(undefined);
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <Snackbar
      key={currentNotification.key}
      open={open}
      autoHideDuration={currentNotification.duration}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
    >
      <Alert onClose={handleClose} severity={currentNotification.severity} sx={{ width: '100%' }} variant="filled">
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};