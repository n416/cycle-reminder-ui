import { useState, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { updateExistingReminder, Reminder } from '@/features/reminders/remindersSlice';
import { showToast } from '@/features/toast/toastSlice';

export const useTimeAdjustment = () => {
  const dispatch = useAppDispatch();
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, number>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const adjustTime = useCallback((reminder: Reminder, minutes: number) => {
    setPendingAdjustments((prev) => {
      const currentPending = prev[reminder.id] || 0;
      const newPending = currentPending + minutes;
      return { ...prev, [reminder.id]: newPending };
    });

    if (timeoutRefs.current[reminder.id]) {
      clearTimeout(timeoutRefs.current[reminder.id]);
    }

    timeoutRefs.current[reminder.id] = setTimeout(async () => {
      // Execute the accumulated update after 1 second of inactivity
      let finalMinutes = 0;
      setPendingAdjustments((prev) => {
        finalMinutes = prev[reminder.id] || 0;
        const next = { ...prev };
        delete next[reminder.id];
        return next;
      });

      if (finalMinutes === 0) return;

      const originalDate = new Date(reminder.startTime);
      if (isNaN(originalDate.getTime())) return;

      const newDate = new Date(originalDate.getTime() + finalMinutes * 60000);
      const updatedReminder = { ...reminder, startTime: newDate.toISOString() };

      try {
        await dispatch(updateExistingReminder(updatedReminder)).unwrap();
        const action = finalMinutes > 0 ? '進めました' : '戻しました';
        dispatch(showToast({ message: `起点日時を ${Math.abs(finalMinutes)} 分 ${action}。`, severity: 'success' }));
      } catch (error) {
        dispatch(showToast({ message: '日時の更新に失敗しました。', severity: 'error' }));
      }
    }, 1000);
  }, [dispatch]);

  const getOptimisticStartTime = useCallback((reminder: Reminder): string => {
    const pendingMinutes = pendingAdjustments[reminder.id] || 0;
    if (pendingMinutes === 0) return reminder.startTime;

    const date = new Date(reminder.startTime);
    if (isNaN(date.getTime())) return reminder.startTime;

    return new Date(date.getTime() + pendingMinutes * 60000).toISOString();
  }, [pendingAdjustments]);

  return { adjustTime, getOptimisticStartTime };
};
