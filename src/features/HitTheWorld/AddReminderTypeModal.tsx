import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Radio
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport'; // ボス用アイコン (仮)
import WaterIcon from '@mui/icons-material/Water';         // ヒュドラ用アイコン (仮)
import NotesIcon from '@mui/icons-material/Notes';         // 通常用アイコン

type ReminderSubType = 'boss' | 'hydra' | 'normal';

interface AddReminderTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ReminderSubType) => void;
}

export const AddReminderTypeModal: React.FC<AddReminderTypeModalProps> = ({ open, onClose, onSelect }) => {
  const [selectedValue, setSelectedValue] = useState<ReminderSubType | null>(null);

  const handleListItemClick = (value: ReminderSubType) => {
    setSelectedValue(value);
  };

  const handleConfirm = () => {
    if (selectedValue) {
      onSelect(selectedValue);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>リマインダーの種類を選択</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List sx={{ pt: 0 }}>
          <ListItem disableGutters>
            <ListItemButton onClick={() => handleListItemClick('boss')} selected={selectedValue === 'boss'}>
              <ListItemIcon>
                <Radio
                  edge="start"
                  checked={selectedValue === 'boss'}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': 'boss-label' }}
                />
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 40 }}>
                 <BugReportIcon color="error" />
              </ListItemIcon>
              <ListItemText id="boss-label" primary="ボス" secondary="定時出現ボス用 (20時間サイクル)" />
            </ListItemButton>
          </ListItem>
          <ListItem disableGutters>
            <ListItemButton onClick={() => handleListItemClick('hydra')} selected={selectedValue === 'hydra'}>
              <ListItemIcon>
                <Radio
                  edge="start"
                  checked={selectedValue === 'hydra'}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': 'hydra-label' }}
                />
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <WaterIcon color="info" />
              </ListItemIcon>
              {/* ★★★ ここの secondary テキストを修正 ★★★ */}
              <ListItemText id="hydra-label" primary="ヒュドラ" secondary="毎日 12:30 と 20:30 に通知" />
            </ListItemButton>
          </ListItem>
          <ListItem disableGutters>
            <ListItemButton onClick={() => handleListItemClick('normal')} selected={selectedValue === 'normal'}>
              <ListItemIcon>
                <Radio
                  edge="start"
                  checked={selectedValue === 'normal'}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': 'normal-label' }}
                />
              </ListItemIcon>
               <ListItemIcon sx={{ minWidth: 40 }}>
                <NotesIcon color="action" />
              </ListItemIcon>
              <ListItemText id="normal-label" primary="通常" secondary="自由なリマインダー" />
            </ListItemButton>
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleConfirm} disabled={!selectedValue}>
          次へ
        </Button>
      </DialogActions>
    </Dialog>
  );
};