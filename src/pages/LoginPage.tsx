import React, { useState } from 'react';
import { Box, Typography, Button, Container, Stack, Paper, Dialog, DialogTitle, DialogContent, TextField, DialogActions, DialogContentText } from '@mui/material';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ScienceIcon from '@mui/icons-material/Science';
import apiClient from '@/api/client';

export const LoginPage = () => {
  console.log("【Debug】LoginPage component is rendering."); // ★ デバッグログ
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:8080/api';
  
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (role: 'owner' | 'supporter' | 'tester') => {
    window.location.href = `${apiBaseUrl}/auth/discord?role=${role}`;
  };

  const handleOpenTesterDialog = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setPassword('');
    setError('');
  };

  const handleVerifyTester = async () => {
    try {
      await apiClient.post('/auth/verify-tester', { password });
      handleLogin('tester');
    } catch (err) {
      setError('パスワードが違います。');
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, width: '100%' }}>
          <Typography component="h1" variant="h2" gutterBottom sx={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700 }}>
            Cycle Reminder
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            ログイン方法を選択してください
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" sx={{ my: 5 }}>
            <Stack alignItems="center" spacing={2}>
              <SupervisorAccountIcon color="primary" sx={{ fontSize: 60 }}/>
              <Typography variant="h6">オーナーとしてログイン</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>
                BOTを新しいサーバーに導入したり、リマインダーを新規作成するなど、全ての機能を利用します。
              </Typography>
              <Button variant="contained" onClick={() => handleLogin('owner')}>オーナー</Button>
            </Stack>
            <Stack alignItems="center" spacing={2}>
              <HandshakeIcon color="secondary" sx={{ fontSize: 60 }}/>
              <Typography variant="h6">サポーターとしてログイン</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>
                招待されたサーバーに参加し、既存のリマインダーの閲覧や編集など、一部機能を利用します。
              </Typography>
              <Button variant="outlined" color="secondary" onClick={() => handleLogin('supporter')}>サポーター</Button>
            </Stack>
          </Stack>

          <Button startIcon={<ScienceIcon />} onClick={handleOpenTesterDialog} size="small" sx={{ mt: 4 }}>
            テスターとしてログイン
          </Button>
        </Paper>

        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>テスター認証</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    テスター用のパスワードを入力してください。
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    label="パスワード"
                    type="password"
                    fullWidth
                    variant="standard"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!error}
                    helperText={error}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyTester()}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>キャンセル</Button>
                <Button onClick={handleVerifyTester}>認証してログイン</Button>
            </DialogActions>
        </Dialog>

      </Box>
    </Container>
  );
};