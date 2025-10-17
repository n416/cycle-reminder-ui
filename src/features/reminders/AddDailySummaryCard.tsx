import React from 'react';
import { Paper, Typography } from '@mui/material';

interface AddDailySummaryCardProps {
  onClick: () => void;
}

export const AddDailySummaryCard: React.FC<AddDailySummaryCardProps> = ({ onClick }) => {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        borderStyle: 'dashed',
        borderWidth: '2px',
        padding: 2,
        textAlign: 'center',
        cursor: 'pointer',
        mt: 2, // 上のリストとの間隔
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Typography>
        ＋ 「24時間以内の予定」リマインダーを新しく作成する
      </Typography>
    </Paper>
  );
};