import { Box, Typography, Button, Container, Stack, Paper } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GroupIcon from '@mui/icons-material/Group';

export const LoginPage = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const loginUrl = `${apiBaseUrl}/auth/discord`;

  // --- ★★★ 調査用ログを追加 ★★★ ---
  console.log('%c[LoginPage] レンダリングされました。', 'color: blue; font-weight: bold;');
  const handleLoginClick = () => {
    console.log(`[LoginPage] ログインボタンがクリックされました。遷移先: ${loginUrl}`);
  };
  // --- ★★★ ここまで追加 ★★★ ---

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, width: '100%' }}>
          <Typography
            component="h1"
            variant="h2"
            gutterBottom
            sx={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700 }}
          >
            Cycle Reminder
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            あなたのDiscordコミュニティのための、ウェブで完結する多機能リマインダー
          </Typography>

          <Stack direction="row" spacing={4} justifyContent="center" sx={{ my: 4 }}>
            <Stack alignItems="center">
              <WebAssetIcon color="primary" sx={{ fontSize: 40 }}/>
              <Typography variant="body1">Webで簡単設定</Typography>
            </Stack>
            <Stack alignItems="center">
              <ScheduleIcon color="primary" sx={{ fontSize: 40 }}/>
              <Typography variant="body1">柔軟なサイクル</Typography>
            </Stack>
            <Stack alignItems="center">
              <GroupIcon color="primary" sx={{ fontSize: 40 }}/>
              <Typography variant="body1">誰でも使える</Typography>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            href={loginUrl}
            onClick={handleLoginClick} // ★ onClickイベントを追加
            sx={{ px: 5, py: 1.5, fontSize: '1.1rem' }}
          >
            Discordでログイン
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};