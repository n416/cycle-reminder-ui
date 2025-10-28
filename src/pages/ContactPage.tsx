import { Typography, Container, Paper, Button, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const ContactPage = () => {
  // お問い合わせフォームのURL（Googleフォームなどを想定）
  const contactFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeNDO1dNGU7maic-NNm-yfrt7VOskM60ME1sGfduPJQ8EYjGA/viewform';

  return (
    <Container component="main" maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, textAlign: 'center', width: '100%' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          お問い合わせ窓口
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          サービスに関するご質問、不具合のご報告、その他のお問い合わせは、以下のフォームよりお願いいたします。
        </Typography>
        <Button
          variant="contained"
          component={Link}
          href={contactFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ my: 2 }}
        >
          お問い合わせフォームを開く
        </Button>
        <Typography variant="body2" color="text.secondary" paragraph>
          通常、5営業日以内にご返信いたします。
        </Typography>
        <Button
          variant="text"
          component={RouterLink}
          to="/login"
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          ログインページに戻る
        </Button>
      </Paper>
    </Container>
  );
};