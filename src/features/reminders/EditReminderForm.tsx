import { useAppSelector } from '@/app/hooks'; // useAppSelector をインポート
import { selectAllServers } from '../servers/serversSlice'; // selectAllServers をインポート
import { ReminderForm } from "./ReminderForm"; // 通常の編集フォーム
import { EditBossReminderForm } from "../HitTheWorld/EditBossReminderForm"; // ★ ボス用編集フォームをインポート
import { Reminder } from "./remindersSlice";

interface EditReminderFormProps {
  reminder: Reminder;
  onCancel: () => void;
}

// ★★★★★ ここからが修正箇所です ★★★★★
// ボス名の定型リスト（Add/Editフォームと統一）
const bossOptions = [
  { group: '墓地', name: '2F） スケロ' },
  { group: '墓地', name: '3F） リセメン' },
  { group: '墓地', name: '4F） ユリア' },
  { group: '啓示', name: '3F） グレゴ' },
  { group: '啓示', name: '5F） ケンタ' },
  { group: '黎明', name: '2F） アルサ' },
  { group: '黎明', name: '5F） アズラエル' },
];

// 判別用に、古い形式と新しい形式のボス名を両方含むリストを生成
const bossNamesForCheck = bossOptions.flatMap(boss => [
  boss.name, // 古い形式 (例: "5F） ケンタ")
  `${boss.group} ${boss.name}` // 新しい形式 (例: "啓示 5F） ケンタ")
]);
// ★★★★★ ここまで ★★★★★


export const EditReminderForm: React.FC<EditReminderFormProps> = ({ reminder, onCancel }) => {
  // サーバー種別を取得
  const servers = useAppSelector(selectAllServers);
  const currentServer = servers.find(s => s.id === reminder.serverId);
  const isHitServer = currentServer?.serverType === 'hit_the_world';

  // --- リマインダーの種類を判別するロジック ---
  let isBossReminder = false;
  if (isHitServer) {
    // HITサーバーの場合、メッセージ内容とサイクルでボスリマインダーかを判定
    // ★★★★★ ここからが修正箇所です ★★★★★
    const messageWithoutOffset = reminder.message.replace('{{offset}}', '').trim();
    const isPresetBossName = bossNamesForCheck.includes(messageWithoutOffset);
    // ★★★★★ ここまで ★★★★★
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