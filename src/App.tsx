import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { ReminderList } from '@/features/reminders/ReminderList';
import { AddReminderForm } from '@/features/reminders/AddReminderForm';
import { ServerList } from '@/features/servers/ServerList';
import { AuditLogView } from '@/features/auditLog/AuditLogView';
import { useAppDispatch } from './app/hooks';
import { fetchUserStatus } from './features/auth/authSlice';
import { CssBaseline, Container } from '@mui/material';
import { SubscriptionPage } from '@/pages/SubscriptionPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { PaymentCancelPage } from '@/pages/PaymentCancelPage';
import { Toast } from '@/features/toast/Toast';
import { SessionExpiredDialog } from '@/features/session/SessionExpiredDialog'; // ★ インポート

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      dispatch(fetchUserStatus());
    }
  }, [dispatch]);

  return (
    <>
      <CssBaseline />
      <Toast />
      <SessionExpiredDialog />
      <Routes>
        {/* ★ デバッグ用ルート */}
        <Route path="/ping" element={<h1>Pong! Page is working.</h1>} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/subscribe" element={<SubscriptionPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/servers" replace />} />
            <Route path="/servers" element={<Container maxWidth="md"><ServerList /></Container>} />
            <Route path="/servers/:serverId" element={<Container maxWidth="md"><ReminderList /></Container>} />
            <Route path="/servers/:serverId/add" element={<Container maxWidth="md"><AddReminderForm /></Container>} />
            <Route path="/servers/:serverId/log" element={<Container maxWidth="md"><AuditLogView /></Container>} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;