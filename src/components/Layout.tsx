import {
  AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, useTheme,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import DnsIcon from '@mui/icons-material/Dns';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import TonalityIcon from '@mui/icons-material/Tonality';
import CreditCardOffIcon from '@mui/icons-material/CreditCardOff';
// ★★★★★ ここからが修正箇所です ★★★★★
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'; // オーナー用
import HandshakeIcon from '@mui/icons-material/Handshake'; // サポーター用
import ScienceIcon from '@mui/icons-material/Science'; // テスター用
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // 不明用
// ★★★★★ ここまで ★★★★★
import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearWriteTokens, selectUserRole, setUserRole } from '@/features/auth/authSlice';
import { showToast } from '@/features/toast/toastSlice';
import { useColorMode } from './ThemeRegistry';
import apiClient from '@/api/client';

export const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const colorMode = useColorMode();
  const userRole = useAppSelector(selectUserRole);

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    dispatch(clearWriteTokens());
    localStorage.removeItem('auth-token');
    dispatch(setUserRole('unknown'));
    navigate('/login');
    setDrawerOpen(false);
  };
  
  const handleCancelSubscription = async () => {
    try {
        await apiClient.post('/payment/cancel-subscription');
        dispatch(showToast({ message: 'サブスクリプションを解約しました。自動的にログアウトします。', severity: 'info' }));
        setConfirmOpen(false);
        setDrawerOpen(false);
        handleLogout();
    } catch (error) {
        console.error('Failed to cancel subscription:', error);
        dispatch(showToast({ message: '解約手続きに失敗しました。', severity: 'error' }));
    }
  };

  const renderThemeIcon = () => {
    if (colorMode.mode === 'auto') {
      return <TonalityIcon />;
    }
    if (theme.palette.mode === 'dark') {
      return <Brightness7Icon />;
    }
    return <Brightness4Icon />;
  };

  // ★★★★★ ここからが修正箇所です ★★★★★
  const roleInfo = {
    owner: { label: 'オーナー', icon: <WorkspacePremiumIcon sx={{ color: '#FFD700' }} /> },
    supporter: { label: 'サポーター', icon: <HandshakeIcon color="info" /> },
    tester: { label: 'テスター', icon: <ScienceIcon color="warning" /> },
    unknown: { label: '不明', icon: <HelpOutlineIcon color="disabled" /> },
  };
  // ★★★★★ ここまで ★★★★★

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      {/* ★★★★★ ここからが修正箇所です ★★★★★ */}
      <List>
        <ListItem>
            <ListItemIcon sx={{ minWidth: 40 }}>
                {roleInfo[userRole].icon}
            </ListItemIcon>
            <ListItemText 
                primary="現在の権限" 
                secondary={roleInfo[userRole].label}
                secondaryTypographyProps={{ style: { fontWeight: 'bold', color: theme.palette.text.primary } }}
            />
        </ListItem>
      </List>
      <Divider />
      {/* ★★★★★ ここまで ★★★★★ */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/servers')}>
            <ListItemIcon>
              <DnsIcon />
            </ListItemIcon>
            <ListItemText primary="サーバー一覧" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        {(userRole === 'owner' || userRole === 'tester') && (
            <ListItem disablePadding>
                <ListItemButton onClick={() => setConfirmOpen(true)}>
                    <ListItemIcon>
                        <CreditCardOffIcon />
                    </ListItemIcon>
                    <ListItemText primary="プランを管理・解約" />
                </ListItemButton>
            </ListItem>
        )}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="ログアウト" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed">
          <Toolbar>
            <IconButton component={Link} to="/" color="inherit">
              <HomeIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {renderThemeIcon()}
            </IconButton>
            <IconButton color="inherit" aria-label="open drawer" edge="end" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {drawer}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
          <Toolbar />
          <Outlet />
        </Box>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>サブスクリプションの解約</DialogTitle>
        <DialogContent>
          <DialogContentText>
            本当に解約しますか？解約すると、オーナー権限は失われ、自動的にログアウトします。この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button onClick={handleCancelSubscription} color="error" autoFocus>
            解約してログアウト
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};