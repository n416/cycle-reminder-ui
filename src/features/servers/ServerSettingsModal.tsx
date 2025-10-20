import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Box, Tabs, Tab, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  Typography, Divider, InputAdornment, IconButton, Tooltip, FormHelperText,
  Paper // ★★★★★ ここに Paper を追加 ★★★★★
} from '@mui/material';
import { useAppDispatch } from '@/app/hooks';
import { Server, updateServerSettings, updateServerPassword } from './serversSlice';
import { showToast } from '@/features/toast/toastSlice';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeSVG } from 'qrcode.react';


interface ServerSettingsModalProps {
  open: boolean;
  onClose: () => void;
  server: Server | null;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ open, onClose, server }) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);

  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [serverType, setServerType] = useState<'normal' | 'hit_the_world'>('normal');

  // Security Settings
  const [newPassword, setNewPassword] = useState('');
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (server) {
      setCustomName(server.customName || '');
      setCustomIcon(server.customIcon || '');
      setServerType(server.serverType || 'normal');
      setNewPassword('');
    }
    setActiveTab(0);
    setIsSaving(false);
    setCopied(false);
  }, [server, open]);

  if (!server) return null;

  const supporterUrl = `${window.location.origin}/hit-the-world/${server.id}/boss-time-adjustment`;

  const handleCopy = () => {
    navigator.clipboard.writeText(supporterUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveGeneral = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await dispatch(updateServerSettings({
        serverId: server.id,
        settings: {
          customName: customName || null,
          customIcon: customIcon || null,
          serverType: serverType,
        }
      })).unwrap();
      dispatch(showToast({ message: 'サーバー設定を更新しました。', severity: 'success' }));
      onClose();
    } catch (err) {
      dispatch(showToast({ message: '設定の更新に失敗しました。', severity: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await dispatch(updateServerPassword({ serverId: server.id, password: newPassword })).unwrap();
      dispatch(showToast({ message: 'パスワードを更新しました。', severity: 'success' }));
      onClose();
    } catch (err) {
      dispatch(showToast({ message: 'パスワードの更新に失敗しました。', severity: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSaving ? () => { } : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        「{server.customName || server.name}」の設定
      </DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)} variant="fullWidth">
          <Tab icon={<SettingsIcon />} iconPosition="start" label="全般" />
          <Tab icon={<LockIcon />} iconPosition="start" label="セキュリティ" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 2 }}>
              <TextField
                label="サーバー名の上書き"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                helperText="空欄の場合、Discordのサーバー名がそのまま表示されます。"
                fullWidth
              />
              <TextField
                label="アイコンURLの上書き"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                helperText="画像URLを入力します。空欄の場合、Discordのアイコンが表示されます。"
                fullWidth
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">サーバー種別</FormLabel>
                <RadioGroup
                  row
                  value={serverType}
                  onChange={(e) => setServerType(e.target.value as 'normal' | 'hit_the_world')}
                >
                  <FormControlLabel value="normal" control={<Radio />} label="通常" />
                  <FormControlLabel value="hit_the_world" control={<Radio />} label="HIT : The World" />
                </RadioGroup>
              </FormControl>

              {serverType === 'hit_the_world' && (
                <>
                  <Divider sx={{ pt: 2 }} />
                  <Stack spacing={2}>
                    <Typography variant="h6">サポーター用URL</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <Box sx={{ flexGrow: 1, width: '100%' }}>
                        <TextField
                          label="URL"
                          value={supporterUrl}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title={copied ? "コピーしました！" : "コピー"}>
                                  <IconButton onClick={handleCopy} edge="end">
                                    <ContentCopyIcon />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                        <FormHelperText>
                          サポーターにこのURLを共有すると、ボス時間の編集だけを許可できます。
                        </FormHelperText>
                      </Box>
                      <Paper sx={{ p: 1, bgcolor: 'white', display: 'inline-block' }}>
                        <QRCodeSVG value={supporterUrl} size={110} />
                      </Paper>
                    </Stack>
                  </Stack>
                </>
              )}

            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={isSaving}>キャンセル</Button>
            <Button onClick={handleSaveGeneral} variant="contained" startIcon={<SaveIcon />} disabled={isSaving}>
              {isSaving ? '保存中...' : '設定を保存'}
            </Button>
          </DialogActions>
        </>
      )}

      {activeTab === 1 && (
        <>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                サポーター（管理者ではない）ユーザーがリマインダーを編集するために必要なパスワードを設定します。
              </Typography>
              <TextField
                autoFocus
                label="新しいパスワード"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="空欄で保存すると、パスワードが削除されます。"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && handleSavePassword()}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={isSaving}>キャンセル</Button>
            <Button onClick={handleSavePassword} variant="contained" startIcon={<SaveIcon />} disabled={isSaving}>
              {isSaving ? '保存中...' : 'パスワードを保存'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};