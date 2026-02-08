import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Tabs, Tab, Box, Typography, Alert, Stack, IconButton
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
    reminders.map(({ id, serverId, ...rest }) => rest),
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
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error('データ形式が正しくありません（配列である必要があります）');
      }

      let successCount = 0;
      for (const item of parsed) {
        // 最低限のバリデーション
        if (!item.message || !item.startTime) continue;

        // IDやServerIDが含まれていても、addNewReminderの型定義(Omit)により無視されるか、
        // 意図的に除外して渡す
        const { id, serverId: _sid, ...newReminderData } = item;

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
      console.error(error);
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
