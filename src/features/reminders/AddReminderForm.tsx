import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useAppSelector } from '@/app/hooks';
import { selectAllServers } from '../servers/serversSlice';
import { selectUserRole } from '../auth/authSlice'; // ★ selectUserRole をインポート
import { ReminderForm } from "./ReminderForm";
import { AddBossReminderForm } from "../HitTheWorld/AddBossReminderForm";
import { AddHydraReminderForm } from "../HitTheWorld/AddHydraReminderForm";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const AddReminderForm = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate(); // ★ useNavigate をインポート

  const servers = useAppSelector(selectAllServers);
  const serversStatus = useAppSelector(state => state.servers.status);
  const userRole = useAppSelector(selectUserRole); // ★ ユーザーの役割を取得
  const currentServer = servers.find(s => s.id === serverId);

  // ★★★★★ ここからが修正箇所です ★★★★★
  const isOwnerOrTester = userRole === 'owner' || userRole === 'tester';
  const isDiscordAdmin = currentServer?.role === 'admin';
  const canCreate = isOwnerOrTester && isDiscordAdmin;

  // サーバー情報が読み込み中の場合
  if (serversStatus !== 'succeeded' || !currentServer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>サーバー情報を確認中...</Typography>
      </Box>
    );
  }

  // 権限がない場合
  if (!canCreate) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          アクセス権がありません
        </Typography>
        <Typography color="text.secondary" paragraph>
          リマインダーを新規作成できるのは、サーバーの管理者権限を持つオーナーまたはテスターのみです。
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          リマインダー一覧に戻る
        </Button>
      </Box>
    );
  }
  // ★★★★★ ここまで ★★★★★

  const isHitServer = currentServer.serverType === 'hit_the_world';

  if (isHitServer) {
    if (typeParam === 'boss') {
      return <AddBossReminderForm />;
    }
    else if (typeParam === 'hydra') {
      return <AddHydraReminderForm />;
    }
    else {
      return <ReminderForm mode="add" />;
    }
  }

  return <ReminderForm mode="add" />;
};