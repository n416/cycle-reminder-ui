import { useAppSelector } from '@/app/hooks'; // useAppSelector をインポート
import { selectAllServers } from '../servers/serversSlice'; // selectAllServers をインポート
import { ReminderForm } from "./ReminderForm"; // 通常の編集フォーム
import { EditBossReminderForm } from "../HitTheWorld/EditBossReminderForm"; // ★ ボス用編集フォームをインポート
import { Reminder } from "./remindersSlice";

interface EditReminderFormProps {
  reminder: Reminder;
  onCancel: () => void;
}

// ボス名の定型リスト（編集フォームでも種類判別に使う）
const bossNames = [
  'スケロ (墓地2F)', 'リセメン (墓地3F)', 'ユリア (墓地4F)',
  'グレゴ (啓示3F)', 'ケンタ (啓示5F)',
  'アルサ (黎明2F)', 'アズラエル (黎明5F)'
];

export const EditReminderForm: React.FC<EditReminderFormProps> = ({ reminder, onCancel }) => {
  // サーバー種別を取得
  const servers = useAppSelector(selectAllServers);
  const currentServer = servers.find(s => s.id === reminder.serverId);
  const isHitServer = currentServer?.serverType === 'hit_the_world';

  // --- リマインダーの種類を判別するロジック ---
  let isBossReminder = false;
  if (isHitServer) {
    // HITサーバーの場合、メッセージ内容とサイクルでボスリマインダーかを判定
    const isPresetBossName = bossNames.includes(reminder.message);
    const isBossCycle = reminder.recurrence.type === 'interval' && reminder.recurrence.hours === 20;

    // 定型ボス名、またはサイクルが20時間間隔であればボスリマインダーとみなす
    // (手動入力されたボス名もあるため、サイクルも見る)
    if (isPresetBossName || isBossCycle) {
      isBossReminder = true;
    }
    // TODO: 将来的にヒュドラリマインダーの判別ロジックも追加
  }

  // --- 表示するフォームを切り替え ---
  if (isBossReminder) {
    // ボスリマインダーの場合はボス用編集フォームを表示
    return <EditBossReminderForm reminder={reminder} onCancel={onCancel} />;
  } else {
    // それ以外（通常リマインダー、または通常サーバーのリマインダー）の場合は通常の編集フォームを表示
    return <ReminderForm mode="edit" reminder={reminder} onSave={onCancel} />;
  }
};