import React, { useState, useEffect } from 'react'; // ★★★ useEffect をインポート ★★★
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addNewReminder, Reminder } from '../reminders/remindersSlice'; // Reminder 型をインポート
import { fetchChannels, selectChannelsForServer, getChannelsStatus } from '../channels/channelsSlice'; // ★ 相対パスを修正 ../../
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, TextField, Button, Stack, Typography, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Select, MenuItem, IconButton,
  CircularProgress, Divider, InputLabel, Paper
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';

// ボス名のリスト（定型）
const bossOptions = [
  { group: '墓地', name: '2F） スケロ' },
  { group: '墓地', name: '3F） リセメン' },
  { group: '墓地', name: '4F） ユリア' },
  { group: '啓示', name: '3F） グレゴ' },
  { group: '啓示', name: '5F） ケンタ' },
  { group: '黎明', name: '2F） アルサ' },
  { group: '黎明', name: '5F） アズラエル' },
];

// ローカルタイムゾーンに変換して ISO 文字列 (YYYY-MM-DDTHH:mm) を返すヘルパー関数
const toLocalISOString = (date: Date): string => {
  const tzoffset = date.getTimezoneOffset() * 60000; // ローカルタイムゾーンとの差 (ミリ秒)
  // ローカル時刻に補正した Date オブジェクトを作成し、ISO 文字列の最初の16文字を取得
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

export const AddBossReminderForm: React.FC = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux ストアからチャンネル情報を取得
  const channels = useAppSelector(selectChannelsForServer(serverId!));
  const channelsStatus = useAppSelector(getChannelsStatus);

  // ★★★ isSubmitting 状態を追加 ★★★
  const [isSubmitting, setIsSubmitting] = useState(false);

  // コンポーネントがマウントされたとき、チャンネル情報がなければ取得する
  useEffect(() => {
    if (serverId && !channels) {
      dispatch(fetchChannels({ serverId }));
    }
  }, [serverId, channels, dispatch]); // ★ dispatch を依存配列に追加 ★

  // フォームの状態管理
  const [messageType, setMessageType] = useState<'preset' | 'manual'>('preset'); // ボス名の選択方法
  const [presetMessage, setPresetMessage] = useState<string>(bossOptions[0].name); // 定型選択時のボス名
  const [manualMessage, setManualMessage] = useState<string>(''); // 手動入力時のボス名
  const [channelId, setChannelId] = useState(''); // 選択されたチャンネルID
  const [startTime, setStartTime] = useState(''); // 起点日時 (datetime-local の値)

  // ボス用フォームではサイクル関連は固定値
  const recurrenceType = 'interval';
  const intervalHours = 20;

  // チャンネルリストが読み込まれたら、最初のチャンネルをデフォルトで選択する
  useEffect(() => {
    // channels が存在し、配列であり、要素があり、かつ channelId がまだ設定されていない場合
    if (channels && Array.isArray(channels) && channels.length > 0 && !channelId) {
      setChannelId(channels[0].id);
    }
  }, [channels, channelId]); // channels または channelId が変更されたときに実行

  // 「NOW!」ボタンが押されたときの処理
  const handleSetNow = () => {
    const now = new Date();
    now.setSeconds(0, 0); // 秒とミリ秒を0にする
    setStartTime(toLocalISOString(now)); // ローカル時刻の ISO 文字列に変換してセット
  };

  // フォーム送信時の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトのフォーム送信をキャンセル

    // ★★★ 連打防止 ★★★
    if (isSubmitting) return;
    setIsSubmitting(true);

    // 選択方法に応じて最終的なメッセージを決定
    const finalMessage = messageType === 'preset' ? presetMessage : manualMessage;

    // 入力値のバリデーション
    if (!finalMessage || !channelId || !startTime || !serverId) {
        dispatch(showToast({ message: 'すべての項目を入力してください。', severity: 'warning' }));
        setIsSubmitting(false); // ★ 失敗時も解除
        return; // いずれかの値がなければ処理を中断
    }

    // サイクル情報を設定
    const recurrence = { type: recurrenceType, hours: intervalHours };
    // 選択されたチャンネル名を取得 (見つからなければ空文字)
    const selectedChannel = channels?.find(ch => ch.id === channelId);

    // APIに送信するリマインダーデータを作成
    const reminderData = {
      message: finalMessage,
      channel: selectedChannel?.name || '', // チャンネル名
      channelId: channelId,                // チャンネルID
      startTime: new Date(startTime).toISOString(), // 起点日時を UTC の ISO 文字列に変換
      recurrence,                           // サイクル情報
      status: 'active',                     // 新規作成時は常に 'active'
      selectedEmojis: [],                   // ボス用はスタンプなし
      hideNextTime: false,                  // デフォルトは次の日時を表示する
    };

    try {
      // Redux Thunk (addNewReminder) を呼び出してリマインダーをバックエンドに追加
      await dispatch(addNewReminder({ serverId, newReminder: reminderData as Omit<Reminder, 'id' | 'serverId'> })).unwrap();
      dispatch(showToast({ message: 'ボスリマインダーを追加しました。', severity: 'success' }));
      navigate(`/servers/${serverId}`); // 成功したらサーバーのリマインダー一覧ページに戻る
    } catch (error) {
      console.error(`Failed to add the boss reminder: `, error);
      dispatch(showToast({ message: `リマインダーの追加に失敗しました。`, severity: 'error' }));
      setIsSubmitting(false); // ★ navigate しない場合（エラー時）は解除
    }
  };

  // JSX (画面の描画部分)
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        ボスリマインダーを新規追加
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>

          {/* ボス名選択 */}
          <FormControl component="fieldset">
            <FormLabel component="legend">ボス名</FormLabel>
            <RadioGroup row value={messageType} onChange={(e) => setMessageType(e.target.value as 'preset' | 'manual')}>
              <FormControlLabel value="preset" control={<Radio />} label="定型から選択" />
              <FormControlLabel value="manual" control={<Radio />} label="手動入力" />
            </RadioGroup>
          </FormControl>

          {/* 定型選択の場合のドロップダウン */}
          {messageType === 'preset' && (
            <FormControl fullWidth>
              <InputLabel id="preset-boss-select-label">定型ボス名</InputLabel>
              <Select
                labelId="preset-boss-select-label"
                value={presetMessage}
                label="定型ボス名"
                onChange={(e) => setPresetMessage(e.target.value)}
              >
                {/* bossOptions 配列をループして MenuItem を生成 */}
                {bossOptions.map((boss) => (
                  <MenuItem key={boss.name} value={boss.name}>
                     {boss.group} {boss.name} {/* 例: スケロ (墓地2F) (墓地) */}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* 手動入力の場合のテキストフィールド */}
          {messageType === 'manual' && (
            <TextField
              label="ボス名 (手動入力)"
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              required // 手動入力時は必須
              fullWidth
            />
          )}

          {/* チャンネル選択 */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl fullWidth>
              <InputLabel id="channel-select-label">通知チャンネル</InputLabel>
              <Select
                labelId="channel-select-label"
                value={channelId}
                label="通知チャンネル"
                onChange={(e) => setChannelId(e.target.value)}
                disabled={!channels || channelsStatus === 'loading'} // チャンネル情報がないか読み込み中は無効化
              >
                {/* channels が配列であることを確認してから map を呼び出す */}
                {channels && Array.isArray(channels) ? (
                  channels.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>
                      {ch.name} {/* 例: #general */}
                    </MenuItem>
                  ))
                ) : (
                  // channels がまだない場合（読み込み中など）
                  <MenuItem disabled>チャンネル読込中...</MenuItem>
                )}
              </Select>
            </FormControl>
            {/* チャンネル情報再取得ボタン */}
            <IconButton onClick={() => dispatch(fetchChannels({ serverId: serverId!, forceRefresh: true }))} disabled={channelsStatus === 'loading'}>
              {channelsStatus === 'loading' ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Stack>

          {/* 起点日時 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
            <TextField
              label="最後にボスを討伐した日時 (起点)"
              type="datetime-local" // HTML 標準の日時入力
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }} // ラベルを常に縮小表示
              required
              fullWidth
            />
            {/* 現在時刻をセットするボタン */}
            <Button variant="outlined" onClick={handleSetNow} startIcon={<AccessTimeIcon />}>
              NOW!
            </Button>
          </Stack>

          {/* サイクル表示 (編集不可) */}
          <Paper variant="outlined" sx={{ p: 2 }}>
             <Typography variant="body2" color="text.secondary">サイクル: 時間間隔 ({intervalHours}時間ごと)</Typography>
          </Paper>

          <Divider sx={{ pt: 1 }} />
          {/* フォーム下部のボタン */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="text" onClick={() => navigate(`/servers/${serverId}`)} disabled={isSubmitting}> {/* ★ disabled を追加 */}
              キャンセル
            </Button>
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}> {/* ★ disabled を追加 */}
              {isSubmitting ? '追加中...' : 'この内容で追加'} {/* ★ テキストを変更 */}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};