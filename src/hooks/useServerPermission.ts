import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectUserRole, selectWriteTokenForServer, tryFetchWriteToken } from '@/features/auth/authSlice';
import { selectAllServers } from '@/features/servers/serversSlice';
import { useEffect } from 'react';

/**
 * このフックが返す権限オブジェクトの型
 */
export interface ServerPermissions {
  /** リマインダーを新規作成できるか */
  canCreate: boolean;
  /** リマインダーの編集・削除・休止・テスト送信などができるか */
  canEdit: boolean;
  /** サーバー名やアイコン、種別などの設定を変更できるか */
  canManageServerSettings: boolean;
  /** 操作ログを閲覧できるか */
  canViewLogs: boolean;
  /** 操作ログを元に復元などの操作ができるか */
  canManipulateLogs: boolean;
  /** サポーターで、かつ編集機能がパスワードでロックされている状態か */
  isLockedByPassword: boolean;
}

/**
 * 指定されたサーバーに対する現在のユーザーの操作権限を計算するカスタムフック
 * @param serverId - 権限を判定したいサーバーのID
 */
export const useServerPermission = (serverId?: string): ServerPermissions => {
  const dispatch = useAppDispatch();

  // 必要なデータをReduxストアから取得
  const userRole = useAppSelector(selectUserRole);
  const servers = useAppSelector(selectAllServers);
  const writeToken = useAppSelector(selectWriteTokenForServer(serverId ?? ''));

  const currentServer = servers.find(s => s.id === serverId);

  // サポーターの場合、パスワードなしサーバーの編集権限を自動取得する副作用
  useEffect(() => {
    if (serverId && userRole === 'supporter') {
      dispatch(tryFetchWriteToken(serverId));
    }
  }, [serverId, userRole, dispatch]);

  // データがなければ、すべての権限を "false" として返す
  if (!currentServer || userRole === 'unknown') {
    return {
      canCreate: false, canEdit: false, canManageServerSettings: false,
      canViewLogs: false, canManipulateLogs: false, isLockedByPassword: true
    };
  }

  // --- 権限の計算ロジックを一元化 ---
  const isDiscordAdmin = currentServer.role === 'admin';
  const isOwnerOrTester = userRole === 'owner' || userRole === 'tester';

  const canCreate = isOwnerOrTester && isDiscordAdmin;
  const canEdit = canCreate || !!writeToken;
  const canManageServerSettings = isOwnerOrTester && isDiscordAdmin;
  const canViewLogs = isDiscordAdmin;
  const canManipulateLogs = canEdit; // ログの操作権限は、リマインダーの編集権限に準ずる
  const isLockedByPassword = userRole === 'supporter' && !writeToken;

  return {
    canCreate,
    canEdit,
    canManageServerSettings,
    canViewLogs,
    canManipulateLogs,
    isLockedByPassword,
  };
};