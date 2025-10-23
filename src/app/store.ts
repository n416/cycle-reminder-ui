import { configureStore, combineReducers } from '@reduxjs/toolkit'; // ★★★ combineReducers をインポート ★★★
import remindersReducer from '@/features/reminders/remindersSlice';
import auditLogReducer from '@/features/auditLog/auditLogSlice';
import serversReducer from '@/features/servers/serversSlice';
import authReducer from '@/features/auth/authSlice';
import channelsReducer from '@/features/channels/channelsSlice';
import toastReducer from '@/features/toast/toastSlice';
import missedNotificationsReducer from '@/features/missed-notifications/missedNotificationsSlice';
import emojisReducer from '@/features/emojis/emojisSlice';
import sessionReducer from '@/features/session/sessionSlice';

// Reducerをまとめたオブジェクト
const reducerObject = {
  reminders: remindersReducer,
  auditLog: auditLogReducer,
  servers: serversReducer,
  auth: authReducer,
  channels: channelsReducer,
  toast: toastReducer,
  missedNotifications: missedNotificationsReducer,
  emojis: emojisReducer,
  session: sessionReducer,
};

// combineReducersを使って、Reducerオブジェクトを単一のReducer関数に変換する
export const rootReducer = combineReducers(reducerObject);

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;