import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateExistingReminder, Reminder } from '../reminders/remindersSlice'; // updateExistingReminder をインポート
import { fetchChannels, selectChannelsForServer, getChannelsStatus } from '../channels/channelsSlice';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box, TextField, Button, Stack, Typography, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Select, MenuItem, IconButton,
  CircularProgress, Divider, InputLabel, Paper
} from '@mui/material';
import { useParams } from 'react-router-dom';
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
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

// --- Props の型定義を追加 ---
interface EditBossReminderFormProps {
  reminder: Reminder;
  onCancel: () => void; // キャンセル時に呼ばれる関数
}

export const EditBossReminderForm: React.FC<EditBossReminderFormProps> = ({ reminder, onCancel }) => {
  const { serverId } = useParams<{ serverId: string }>(); // serverId は reminder から取得できるが、念のため useParams も使う
  const dispatch = useAppDispatch();

  // Redux ストアからチャンネル情報を取得
  const channels = useAppSelector(selectChannelsForServer(reminder.serverId)); // reminder.serverId を使用
  const channelsStatus = useAppSelector(getChannelsStatus);

  // ★★★ isSubmitting 状態を追加 ★★★
  const [isSubmitting, setIsSubmitting] = useState(false);

  // コンポーネントがマウントされたとき、チャンネル情報がなければ取得する
  useEffect(() => {
    if (reminder.serverId && !channels) {
      dispatch(fetchChannels({ serverId: reminder.serverId }));
    }
  }, [reminder.serverId, channels, dispatch]);

  // --- フォームの状態管理 ---
  // ボス名が定型リストに含まれるか判定し、初期値を設定
  const isPreset = bossOptions.some(boss => boss.name === reminder.message);
  const [messageType, setMessageType] = useState<'preset' | 'manual'>(isPreset ? 'preset' : 'manual');
  const [presetMessage, setPresetMessage] = useState<string>(isPreset ? reminder.message : bossOptions[0].name);
  const [manualMessage, setManualMessage] = useState<string>(isPreset ? '' : reminder.message);
  // 他のフィールドも reminder の値で初期化
  const [channelId, setChannelId] = useState(reminder.channelId);
  const [startTime, setStartTime] = useState(toLocalISOString(new Date(reminder.startTime)));

  // ボス用フォームではサイクル関連は固定値 (編集不可)
  const recurrenceType: 'interval' = 'interval';
  const intervalHours = 20; // 既存のリマインダーが異なる値を持っていても、ここでは20固定とする

  // チャンネルリストが読み込まれても、既存の channelId を維持する (新規追加時とは異なる)
  // もし既存の channelId がリストにない場合でも、そのまま保持しておく (削除されたチャンネルの可能性)

  // 「NOW!」ボタンが押されたときの処理
  const handleSetNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    setStartTime(toLocalISOString(now));
  };

  // --- フォーム送信時の処理 (updateExistingReminder を使用) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ★★★ 連打防止 ★★★
    if (isSubmitting) return;
    setIsSubmitting(true);

    const finalMessage = messageType === 'preset' ? presetMessage : manualMessage;
    if (!finalMessage || !channelId || !startTime || !reminder.serverId) { // serverId は reminder から取得
        dispatch(showToast({ message: 'すべての項目を入力してください。', severity: 'warning' }));
        setIsSubmitting(false); // ★ 失敗時も解除
        return;
    }

    const recurrence = { type: recurrenceType, hours: intervalHours }; // 固定値を使用
    const selectedChannel = channels?.find(ch => ch.id === channelId);

    // 更新するデータを作成 (reminder の他の値も引き継ぐ)
    const reminderData: Reminder = {
      ...reminder, // 既存のリマインダーデータをベースにする
      message: finalMessage,
      channel: selectedChannel?.name || reminder.channel, // チャンネル名が見つからなければ元の値を維持
      channelId: channelId,
      startTime: new Date(startTime).toISOString(),
      recurrence,
      // status, selectedEmojis, hideNextTime などは reminder から引き継がれる
    };

    try {
      // updateExistingReminder を呼び出してリマインダーを更新
      await dispatch(updateExistingReminder(reminderData)).unwrap();
      dispatch(showToast({ message: 'ボスリマインダーを更新しました。', severity: 'success' }));
      onCancel(); // 成功したらフォームを閉じる (一覧に戻る)
    } catch (error) {
      console.error(`Failed to update the boss reminder: `, error);
      dispatch(showToast({ message: `リマインダーの更新に失敗しました。`, severity: 'error' }));
    } finally {
      // ★★★ 成功・失敗どちらでも解除 ★★★
      setIsSubmitting(false);
    }
  };

  // JSX (画面の描画部分) - 基本は追加フォームと同じだが、ボタンなどを調整
  return (
    // ★★★ Box に form 要素と背景色を追加 ★★★
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Stack spacing={3}>
          {/* ボス名選択 */}
          <FormControl component="fieldset">
            <FormLabel component="legend">ボス名</FormLabel>
            <RadioGroup row value={messageType} onChange={(e) => setMessageType(e.target.value as 'preset' | 'manual')}>
              <FormControlLabel value="preset" control={<Radio />} label="定型から選択" />
              <FormControlLabel value="manual" control={<Radio />} label="手動入力" />
            </RadioGroup>
          </FormControl>

          {messageType === 'preset' && (
            <FormControl fullWidth variant="filled"> {/* ★ variant を filled に */}
              <InputLabel id="preset-boss-select-label">定型ボス名</InputLabel>
              <Select
                labelId="preset-boss-select-label"
                value={presetMessage}
                label="定型ボス名"
                onChange={(e) => setPresetMessage(e.target.value)}
              >
                {bossOptions.map((boss) => (
                  <MenuItem key={boss.name} value={boss.name}>
                    {boss.group} {boss.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {messageType === 'manual' && (
            <TextField
              label="ボス名 (手動入力)"
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              required
              fullWidth
              variant="filled" // ★ variant を filled に
            />
          )}

          {/* チャンネル選択 */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl fullWidth variant="filled"> {/* ★ variant を filled に */}
              <InputLabel id="channel-select-label">通知チャンネル</InputLabel>
              <Select
                labelId="channel-select-label"
                value={channelId}
                label="通知チャンネル"
                onChange={(e) => setChannelId(e.target.value)}
                disabled={!channels || channelsStatus === 'loading'}
              >
                {channels && Array.isArray(channels) ? (
                  channels.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </MenuItem>
                  ))
                ) : (
                  // チャンネル情報がない場合も、既存のIDがあればそれを表示する（削除された可能性）
                  channelId ? <MenuItem value={channelId}>{reminder.channel || channelId}</MenuItem> : <MenuItem disabled>読込中...</MenuItem>
                )}
              </Select>
            </FormControl>
            <IconButton onClick={() => dispatch(fetchChannels({ serverId: reminder.serverId, forceRefresh: true }))} disabled={channelsStatus === 'loading'}>
              {channelsStatus === 'loading' ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Stack>

          {/* 起点日時 */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
            <TextField
              label="最後にボスを討伐した日時 (起点)"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
              variant="filled" // ★ variant を filled に
            />
            <Button variant="outlined" onClick={handleSetNow} startIcon={<AccessTimeIcon />}>
              NOW!
            </Button>
          </Stack>

          {/* サイクル表示 (編集不可) */}
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'transparent' }}> {/* ★ 背景色を調整 */}
             <Typography variant="body2" color="text.secondary">サイクル: 時間間隔 ({intervalHours}時間ごと)</Typography>
          </Paper>

          {/* ★★★ ボタンを更新・キャンセルに変更 ★★★ */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onCancel} disabled={isSubmitting}> {/* ★ disabled を追加 */}
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}> {/* ★ disabled を追加 */}
              {isSubmitting ? '更新中...' : '更新する'} {/* ★ テキストを変更 */}
            </Button>
          </Stack>
        </Stack>
    </Box>
  );
};