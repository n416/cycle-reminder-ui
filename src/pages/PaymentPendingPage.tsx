import { Typography, Container, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

export const PaymentPendingPage = () => {
  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <HourglassTopIcon color="info" sx={{ fontSize: 60, mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          お申込みありがとうございます
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          お客様のお支払い手続きをお待ちしております。
          <br />
          お支払いが確認でき次第、オーナー権限が自動的に有効になります。
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/servers"
          sx={{ mt: 2 }}
        >
          サーバー一覧に戻る
        </Button>
      </Paper>
    </Container>
  );
};