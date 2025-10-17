import { useLocation, useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector } from '@/app/hooks'; // useAppSelector をインポート
import { selectAllServers } from '../servers/serversSlice'; // selectAllServers をインポート
import { ReminderForm } from "./ReminderForm"; // 通常のリマインダーフォーム
import { AddBossReminderForm } from "../HitTheWorld/AddBossReminderForm"; // ★ HITサーバーのボス用フォームをインポート
import { AddHydraReminderForm } from "../HitTheWorld/AddHydraReminderForm"; // ★★★ ヒュドラ用フォームをインポート ★★★

export const AddReminderForm = () => {
  // 現在のURL情報を取得
  const location = useLocation();
  // URLのクエリパラメータ (?type=boss など) を解析
  const searchParams = new URLSearchParams(location.search);
  // 'type' パラメータの値を取得 (なければ null)
  const typeParam = searchParams.get('type');
  // URLのパスパラメータから serverId を取得 (/servers/:serverId/add)
  const { serverId } = useParams<{ serverId: string }>();

  // Reduxストアからサーバーリストを取得
  const servers = useAppSelector(selectAllServers);
  // 現在表示しているサーバーの情報を serverId を使って検索
  const currentServer = servers.find(s => s.id === serverId);

  // サーバー情報がまだ Redux ストアに読み込まれていない場合 (ページリロード直後など)
  if (!currentServer) {
    // ローディング表示を返す
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>サーバー情報を読み込み中...</Typography>
      </Box>
    );
  }

  // 現在のサーバーが「HIT : The World」タイプかどうかを判定
  const isHitServer = currentServer.serverType === 'hit_the_world';

  // --- 表示するフォームの分岐ロジック ---

  // HITサーバーの場合
  if (isHitServer) {
    // URLパラメータが ?type=boss ならボス用フォームを表示
    if (typeParam === 'boss') {
      return <AddBossReminderForm />;
    }
    // URLパラメータが ?type=hydra なら (今はまだないので) 通常フォームを表示
    else if (typeParam === 'hydra') {
      return <AddHydraReminderForm />;
    }
    // URLパラメータが ?type=normal または type指定なしの場合は通常フォームを表示
    else {
      return <ReminderForm mode="add" />;
    }
  }

  // 通常サーバーの場合 (URLパラメータは無視して、常に通常フォームを表示)
  return <ReminderForm mode="add" />;
};