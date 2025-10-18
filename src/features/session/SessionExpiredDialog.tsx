import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { hideSessionExpiredDialog } from './sessionSlice';
import { logout } from '../auth/authSlice';

export const SessionExpiredDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.session.isExpiredDialogOpen);

  const handleConfirm = () => {
    // ダイアログを閉じる
    dispatch(hideSessionExpiredDialog());
    // ログアウト処理を実行
    dispatch(logout());
    // ログインページへ移動
    window.location.href = '/login';
  };

  return (
    <Dialog
      open={isOpen}
      // ダイアログの外側をクリックしても閉じないようにする
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleConfirm();
        }
      }}
      aria-labelledby="session-expired-title"
    >
      <DialogTitle id="session-expired-title">
        セッションの有効期限が切れました
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          長時間操作がなかったため、安全のためにログアウトしました。
          お手数ですが、再度ログインをお願いします。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm} variant="contained" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};