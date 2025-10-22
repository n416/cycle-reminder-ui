import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export const NotFoundPage = () => {
  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ReportProblemIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
      <Typography component="h1" variant="h4" gutterBottom>
        ページが見つかりません
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        お探しのページは存在しないか、移動した可能性があります。
        <br />
        URLをご確認の上、再度お試しください。
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
  );
};