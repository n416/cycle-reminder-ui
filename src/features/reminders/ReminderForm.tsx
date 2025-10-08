import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks.ts';
import { addNewReminder, updateExistingReminder, Reminder } from './remindersSlice.ts';
import { fetchChannels, selectChannelsForServer, getChannelsStatus } from '../channels/channelsSlice.ts';
import { showToast } from '@/features/toast/toastSlice';
import {
  Box,
  TextField,
  Button,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputLabel,
  IconButton,
  CircularProgress,
  Paper,
  useMediaQuery,
  useTheme,
  Typography,
  Divider
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import Calendar from 'react-calendar';
import Clock from 'react-clock';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

const toLocalISOString = (date: Date) => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const weekDayMap: { [key: string]: string } = {
  monday: '月曜',
  tuesday: '火曜',
  wednesday: '水曜',
  thursday: '木曜',
  friday: '金曜',
  saturday: '土曜',
  sunday: '日曜',
};

interface ReminderFormProps {
  mode: 'add' | 'edit';
  reminder?: Reminder;
  onSave?: () => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({ mode, reminder, onSave }) => {
  const { serverId: serverIdFromParams } = useParams<{ serverId: string }>();
  const serverId = mode === 'add' ? serverIdFromParams : reminder?.serverId;
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const channels = useAppSelector(selectChannelsForServer(serverId!));
  const channelsStatus = useAppSelector(getChannelsStatus);

  useEffect(() => {
    if (serverId && !channels) {
      dispatch(fetchChannels({ serverId }));
    }
  }, [serverId, channels, dispatch]);

  const [message, setMessage] = useState(reminder?.message || '');
  const [channelId, setChannelId] = useState(reminder?.channelId || '');
  const [startTime, setStartTime] = useState(reminder ? toLocalISOString(new Date(reminder.startTime)) : '');
  const [startTimeValue, setStartTimeValue] = useState<Date | null>(reminder ? new Date(reminder.startTime) : null);
  
  const [recurrenceType, setRecurrenceType] = useState(reminder?.recurrence.type || 'none');
  const [weeklyDays, setWeeklyDays] = useState(reminder?.recurrence.type === 'weekly' ? reminder.recurrence.days : []);
  const [intervalHours, setIntervalHours] = useState(reminder?.recurrence.type === 'interval' ? reminder.recurrence.hours : 1);
  
  useEffect(() => {
    if (channels && !channelId) {
      if (mode === 'edit' && reminder?.channelId) {
        const channelExists = channels.some(ch => ch.id === reminder.channelId);
        setChannelId(channelExists ? reminder.channelId : (channels[0]?.id || ''));
      } else if (channels.length > 0) {
        setChannelId(channels[0].id);
      }
    }
  }, [channels, reminder, channelId, mode]);
  
  useEffect(() => {
    try {
      const date = new Date(startTime);
      if (!isNaN(date.getTime())) {
        setStartTimeValue(date);
      } else {
        setStartTimeValue(null);
      }
    } catch {
      setStartTimeValue(null);
    }
  }, [startTime]);

  const handleSetNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    setStartTime(toLocalISOString(now));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !channelId || !startTime || !serverId) return;

    let recurrence: any;
    let status: 'active' | 'paused' = mode === 'edit' ? reminder!.status : 'active';

    if (recurrenceType === 'weekly') {
      // --- ★★★ ここから修正 ★★★ ---
      if (weeklyDays.length === 0) {
        status = 'paused';
        dispatch(showToast({ message: '曜日が未選択のため、休止状態で保存します。', severity: 'warning' }));
      }
      // --- ★★★ ここまで修正 ★★★ ---
      recurrence = { type: 'weekly', days: weeklyDays };
    } else if (recurrenceType === 'interval') {
      recurrence = { type: 'interval', hours: Number(intervalHours) };
    } else {
      recurrence = { type: 'none' };
    }

    const selectedChannel = channels?.find(ch => ch.id === channelId);
    const reminderData = {
        message,
        channel: selectedChannel?.name || '',
        channelId: channelId,
        startTime: new Date(startTime).toISOString(),
        recurrence,
        status,
    };

    try {
      if (mode === 'add') {
        await dispatch(addNewReminder({ serverId, newReminder: reminderData })).unwrap();
        dispatch(showToast({ message: 'リマインダーを新しく追加しました。', severity: 'success' }));
        navigate(`/servers/${serverId}`);
      } else {
        await dispatch(updateExistingReminder({ id: reminder!.id, serverId: reminder!.serverId, ...reminderData })).unwrap();
        dispatch(showToast({ message: 'リマインダーを更新しました。', severity: 'success' }));
        if (onSave) onSave();
      }
    } catch (error) {
      const action = mode === 'add' ? '追加' : '更新';
      console.error(`Failed to ${action} the reminder: `, error);
      dispatch(showToast({ message: `リマインダーの${action}に失敗しました。`, severity: 'error' }));
    }
  };
  
  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dayName = weekDays[date.getDay()];
      if (weeklyDays.includes(dayName)) {
        return 'react-calendar__tile--active';
      }
    }
    return null;
  };
  
  const handleCalendarClick = (clickedDate: Date) => {
    const dayName = weekDays[clickedDate.getDay()];
    setWeeklyDays((currentDays) => {
      if (currentDays.includes(dayName)) {
        return currentDays.filter(day => day !== dayName);
      } else {
        return [...currentDays, dayName];
      }
    });
  };
  
  const renderIntervalClocks = () => {
    if (!startTimeValue) return null;
    const now = new Date();
    const clocks = [];
    
    let nextStartTime = new Date(startTimeValue);
    while (nextStartTime <= now) {
      nextStartTime.setHours(nextStartTime.getHours() + intervalHours);
    }

    for (let i = 0; i < 3; i++) {
      const nextTime = new Date(nextStartTime.getTime() + i * intervalHours * 60 * 60 * 1000);
      clocks.push(
        <Stack key={i} alignItems="center" spacing={1}>
          <Clock value={nextTime} size={isSmallScreen ? 70 : 100} renderNumbers />
          <Typography variant="caption">{nextTime.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>
        </Stack>
      );
    }
    return clocks;
  };

  const formContent = (
    <Stack spacing={3}>
      <TextField 
        label="メッセージ" 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        required 
        fullWidth 
        multiline 
        rows={4}
        variant={mode === 'edit' ? 'filled' : 'outlined'}
      />
      
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl fullWidth variant={mode === 'edit' ? 'filled' : 'outlined'}>
          <InputLabel id="channel-select-label">チャンネル</InputLabel>
          <Select
            labelId="channel-select-label"
            value={channelId}
            label="チャンネル"
            onChange={(e) => setChannelId(e.target.value)}
            disabled={!channels}
          >
            {channels ? channels.map((ch) => (
              <MenuItem key={ch.id} value={ch.id}>
                {ch.name}
              </MenuItem>
            )) : <MenuItem disabled>チャンネルを読み込み中...</MenuItem>}
          </Select>
        </FormControl>
        <IconButton onClick={() => dispatch(fetchChannels({ serverId: serverId!, forceRefresh: true }))} disabled={channelsStatus === 'loading'}>
          {channelsStatus === 'loading' ? <CircularProgress size={24} /> : <RefreshIcon />}
        </IconButton>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
        <TextField
          label="起点日時"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
          fullWidth
          variant={mode === 'edit' ? 'filled' : 'outlined'}
        />
        <Button variant="outlined" onClick={handleSetNow} startIcon={<AccessTimeIcon />}>
          NOW!
        </Button>
      </Stack>
      
      <FormControl component="fieldset">
        <FormLabel component="legend">サイクル</FormLabel>
        <RadioGroup row value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as any)}>
          <FormControlLabel value="none" control={<Radio />} label="繰り返しなし" />
          <FormControlLabel value="weekly" control={<Radio />} label="週次" />
          <FormControlLabel value="interval" control={<Radio />} label="時間間隔" />
        </RadioGroup>
      </FormControl>

      {recurrenceType === 'weekly' && (
        <FormControl fullWidth>
          <Select
            multiple
            displayEmpty
            value={weeklyDays}
            onChange={(e) => setWeeklyDays(e.target.value as string[])}
            input={<OutlinedInput />}
            renderValue={(selected) => {
              if (selected.length === 0) return <em>曜日を選択...</em>;
              return selected.map((day) => weekDayMap[day]).join(', ');
            }}
          >
            {Object.entries(weekDayMap).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                <Checkbox checked={weeklyDays.includes(key)} />
                <ListItemText primary={value} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {recurrenceType === 'interval' && (
        <TextField
          label="何時間ごと"
          type="number"
          value={intervalHours}
          onChange={(e) => setIntervalHours(Number(e.target.value))}
          inputProps={{ min: 1 }}
          variant={mode === 'edit' ? 'filled' : 'outlined'}
        />
      )}

      {startTimeValue && (
        <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {recurrenceType === 'none' && (
            <Stack alignItems="center" spacing={1}>
              <Clock value={startTimeValue} size={isSmallScreen ? 120 : 150} renderNumbers />
              <Typography variant="caption">この日時に1回だけ通知</Typography>
            </Stack>
          )}
          {recurrenceType === 'weekly' && (
            <Box sx={{ width: '100%', maxWidth: '350px', '& .react-calendar': { width: '100% !important' } }}>
              <Calendar
                value={startTimeValue}
                tileClassName={tileClassName}
                showNeighboringMonth={false}
                showNavigation={false}
                formatShortWeekday={(_locale, date) => ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                formatDay={isSmallScreen ? (_locale, date) => date.getDate().toString() : undefined}
                onClickDay={handleCalendarClick}
              />
            </Box>
          )}
          {recurrenceType === 'interval' && renderIntervalClocks()}
        </Paper>
      )}

      { mode === 'add' ? (
        <>
          <Divider sx={{ pt: 2 }} />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="text" onClick={() => navigate(-1)}>
              戻る
            </Button>
            <Button type="submit" variant="contained" size="large">
              この内容で追加
            </Button>
          </Stack>
        </>
      ) : (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onSave}>キャンセル</Button>
          <Button type="submit" variant="contained">
            更新する
          </Button>
        </Stack>
      )}
    </Stack>
  );

  if (mode === 'add') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          リマインダーを新規追加
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {formContent}
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
      {formContent}
    </Box>
  );
};