import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Tabs, Tab, Box, Alert, Stack, IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Reminder, addNewReminder } from './remindersSlice';
import { useAppDispatch } from '@/app/hooks';
import { showToast } from '@/features/toast/toastSlice';

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
  reminders: Reminder[];
  serverId: string;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ open, onClose, reminders, serverId }) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // エクスポート用にIDとServerIDを除外したデータを生成
  const exportData = JSON.stringify(
    reminders.map(({ id, serverId, nextNotificationTime, ...rest }) => rest),
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData);
    dispatch(showToast({ message: 'クリップボードにコピーしました', severity: 'success' }));
  };

  const handleImport = async () => {
    if (!importText) return;
    setIsImporting(true);
    try {
      // ★ 修正点1: コピペ時の不可視文字（NBSP等）を通常のスペースに置換してパースエラーを防ぐ
      const cleanedJson = importText.replace(/[\u00A0\u3000]/g, ' ');

      const parsed = JSON.parse(cleanedJson);
      if (!Array.isArray(parsed)) {
        throw new Error('データ形式が正しくありません（配列である必要があります）');
      }

      let successCount = 0;
      for (const item of parsed) {
        // 最低限のバリデーション
        if (!item.message || !item.startTime) continue;

        // ★ 修正点2: 不要なフィールド（ID, ServerID, 計算済みの通知時刻）を明示的に除外
        // Firestoreのタイムスタンプ形式などが混入するとエラーの原因になるため
        const { 
          id, 
          serverId: _sid, 
          nextNotificationTime: _nnt, 
          ...newReminderData 
        } = item;

        await dispatch(addNewReminder({ 
          serverId, 
          newReminder: newReminderData 
        })).unwrap();
        successCount++;
      }

      dispatch(showToast({ message: `${successCount}件のリマインダーをインポートしました`, severity: 'success' }));
      setImportText('');
      onClose();
    } catch (error) {
      console.error("Import Failed:", error);
      dispatch(showToast({ message: 'インポートに失敗しました。JSON形式を確認してください。', severity: 'error' }));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>インポート / エクスポート</DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
          <Tab icon={<FileDownloadIcon />} iconPosition="start" label="エクスポート (コピー)" />
          <Tab icon={<FileUploadIcon />} iconPosition="start" label="インポート (貼り付け)" />
        </Tabs>
      </Box>

      <DialogContent>
        {activeTab === 0 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              現在のリマインダー設定をJSON形式で出力します。
              他のサーバーに移行する際に使用してください。
            </Alert>
            <Box sx={{ position: 'relative' }}>
              <TextField
                multiline
                rows={10}
                fullWidth
                value={exportData}
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
              <IconButton 
                onClick={handleCopy} 
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              JSONデータを貼り付けて「インポート実行」を押すと、現在のサーバーにリマインダーが追加されます。
              既存のリマインダーは削除されず、追記されます。
            </Alert>
            <TextField
              multiline
              rows={10}
              fullWidth
              placeholder='[ { "message": "...", ... } ]'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isImporting}>閉じる</Button>
        {activeTab === 1 && (
          <Button onClick={handleImport} variant="contained" disabled={isImporting || !importText}>
            {isImporting ? 'インポート中...' : 'インポート実行'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
