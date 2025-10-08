import { configureStore } from '@reduxjs/toolkit';
import remindersReducer from '@/features/reminders/remindersSlice';
import auditLogReducer from '@/features/auditLog/auditLogSlice';
import serversReducer from '@/features/servers/serversSlice';
import authReducer from '@/features/auth/authSlice';
import channelsReducer from '@/features/channels/channelsSlice';
import toastReducer from '@/features/toast/toastSlice';
import missedNotificationsReducer from '@/features/missed-notifications/missedNotificationsSlice';
import emojisReducer from '@/features/emojis/emojisSlice'; // 1. インポート

export const store = configureStore({
  reducer: {
    reminders: remindersReducer,
    auditLog: auditLogReducer,
    servers: serversReducer,
    auth: authReducer,
    channels: channelsReducer,
    toast: toastReducer,
    missedNotifications: missedNotificationsReducer,
    emojis: emojisReducer, // 2. 登録
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;