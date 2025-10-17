import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  Button,
  CircularProgress,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddLinkIcon from '@mui/icons-material/AddLink';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchServers, selectAllServers, getServersStatus, getLastFetched, Server } from './serversSlice'; // Server型をインポート
import { selectUserRole } from '@/features/auth/authSlice';
import { ServerSettingsModal } from './ServerSettingsModal'; // ★★★ 新しいモーダルをインポート ★★★

const OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=268435456&scope=bot%20applications.commands`;

// ★★★ サーバーアイコンの表示ロジックを更新 ★★★
const getServerIconUrl = (server: Server): string | null => {
  // カスタムアイコンが設定されていればそれを優先
  if (server.customIcon) {
    return server.customIcon;
  }
  // Discordのアイコンがあればそれを表示
  if (server.icon) {
    return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
  }
  // どちらもなければ null
  return null;
};

interface ServerListSectionProps {
  title: string;
  servers: Server[];
  onSettingsClick: (server: Server) => void;
  userRole: 'owner' | 'supporter' | 'tester' | 'unknown';
}

const ServerListSection = ({ title, servers, onSettingsClick, userRole }: ServerListSectionProps) => {

    const handleAddBotClick = (server: Server) => {
        window.open(`${OAUTH_URL}&guild_id=${server.id}`, '_blank', 'noopener,noreferrer');
    };

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          {title}
        </Typography>
        {servers.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 0 }}>
            {servers.map((server: Server, index: number) => (
              <React.Fragment key={server.id}>
                <ListItem disablePadding>
                  <Box sx={{ width: '100%', p: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>

                    <ListItemButton component={Link} to={`/servers/${server.id}`} sx={{ flexGrow: 1, p: 1, borderRadius: 1 }}>
                      <ListItemAvatar>
                        {/* ★★★ 表示ロジックを更新 ★★★ */}
                        <Avatar src={getServerIconUrl(server) || undefined}>
                          {/* カスタム名があればそれを、なければDiscordの名前の頭文字を表示 */}
                          {(server.customName || server.name).charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      {/* ★★★ 表示ロジックを更新 ★★★ */}
                      <ListItemText primary={server.customName || server.name} />
                    </ListItemButton>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: { xs: 1, sm: 0 }, pl: { xs: 0, sm: 2 } }}>
                      <Chip
                        label={server.isAdded ? "導入済み" : "未導入"}
                        color={server.isAdded ? "success" : "default"}
                        size="small"
                      />
                      {/* ★★★ 設定ボタンの表示条件（管理者のみ）は変更なし ★★★ */}
                      {server.role === 'admin' && server.isAdded && (userRole === 'owner' || userRole === 'tester') && (
                        <IconButton edge="end" aria-label="settings" onClick={() => onSettingsClick(server)}>
                          <SettingsIcon />
                        </IconButton>
                      )}

                      {/* Bot導入ボタンのロジックは変更なし */}
                      {server.role === 'admin' && !server.isAdded && (userRole === 'owner' || userRole === 'tester') && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAddBotClick(server)}
                          startIcon={<AddLinkIcon />}
                        >
                          導入
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </ListItem>
                {index < servers.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">対象のサーバーはありません。</Typography>
        )}
      </Box>
    );
};


export const ServerList = () => {
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectAllServers);
  const serversStatus = useAppSelector(getServersStatus);
  const lastFetched = useAppSelector(getLastFetched);
  const error = useAppSelector(state => state.servers.error);
  const userRole = useAppSelector(selectUserRole);

  const [showOnlyAdded, setShowOnlyAdded] = useLocalStorage('showOnlyAddedServers', false);

  // ★★★ 古いパスワードモーダル用の state を、新しい設定モーダル用に変更 ★★★
  const [settingsServer, setSettingsServer] = useState<Server | null>(null);

  useEffect(() => {
    if (userRole === 'supporter') {
      setShowOnlyAdded(true);
    }
  }, [userRole, setShowOnlyAdded]);

  useEffect(() => {
    const CACHE_DURATION = 5 * 60 * 1000;
    const now = Date.now();
    if (serversStatus !== 'loading') {
      if (!lastFetched || (now - lastFetched > CACHE_DURATION)) {
        dispatch(fetchServers());
      }
    }
  }, [dispatch, lastFetched, serversStatus]);

  const handleRefresh = () => {
    dispatch(fetchServers());
  };

  const filteredByAdded = showOnlyAdded
    ? servers.filter(server => server.isAdded)
    : servers;

  const adminServers = filteredByAdded.filter(server => server.role === 'admin');
  const memberServers = filteredByAdded.filter(server => server.role === 'member');

  // ★★★ モーダルを開閉するハンドラ ★★★
  const handleOpenSettings = (server: Server) => setSettingsServer(server);
  const handleCloseSettings = () => setSettingsServer(null);

  let content;
  if (serversStatus === 'loading' && servers.length === 0) {
    content = <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  } else if (serversStatus === 'failed') {
    content = <Typography color="error">エラー: {error}</Typography>;
  } else if (servers.length > 0) {
    content = (
      <>
        <ServerListSection title="管理サーバー" servers={adminServers} onSettingsClick={handleOpenSettings} userRole={userRole} />
        <ServerListSection title="参加サーバー" servers={memberServers} onSettingsClick={handleOpenSettings} userRole={userRole} />
      </>
    );
  } else if (serversStatus === 'succeeded' && servers.length === 0) {
    content = <Typography sx={{ mt: 4, textAlign: 'center' }}>参加しているDiscordサーバーが見つかりませんでした。</Typography>;
  } else {
    // データ取得前 or 失敗したがキャッシュはある場合など
    content = <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          サーバー一覧
        </Typography>
        <IconButton onClick={handleRefresh} disabled={serversStatus === 'loading'}>
          <RefreshIcon />
        </IconButton>
      </Stack>
      <Typography paragraph color="text.secondary">
        あなたが参加しているDiscordサーバーの一覧です。
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={showOnlyAdded} onChange={(e) => setShowOnlyAdded(e.target.checked)} />}
          label="導入済みのサーバーのみ表示"
        />
      </Box>

      {content}

      {/* ★★★ 古いパスワードモーダルを削除し、新しい設定モーダルに差し替え ★★★ */}
      <ServerSettingsModal
        open={!!settingsServer}
        onClose={handleCloseSettings}
        server={settingsServer}
      />
    </Box>
  );
};