import { Box, CircularProgress, Typography } from '@mui/material';

export const AuthCallbackPage = () => {
  // --- ★★★ ページが表示された瞬間に、このログだけを出力する ★★★ ---
  console.log('%c[AuthCallback] Minimal component has rendered!', 'color: red; font-size: 16px; font-weight: bold;');

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>調査中...</Typography>
    </Box>
  );
};