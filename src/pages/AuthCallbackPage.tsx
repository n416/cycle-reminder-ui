import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppDispatch } from '@/app/hooks';
import { setUserRole } from '@/features/auth/authSlice';
import apiClient from '@/api/client';
import { UserRole } from '@/features/auth/authSlice';

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const roleIntent = searchParams.get('role_intent');
    const redirectPath = searchParams.get('redirectPath'); // ★★★ リダイレクトパスを受け取る ★★★

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('auth-token', token);

    const verifyRoleAndNavigate = async () => {
      try {
        const response = await apiClient.get('/auth/status');
        const actualRole = response.data.role as UserRole;

        dispatch(setUserRole(actualRole));

        if (roleIntent === 'owner' && actualRole === 'supporter') {
          navigate('/subscribe', { replace: true });
        } else if (redirectPath) {
          navigate(decodeURIComponent(redirectPath), { replace: true });
        }
        else {
          navigate('/servers', { replace: true });
        }
      } catch (error: any) { // ★ any型にキャストして詳細なエラー情報を取得
        // --- ★★★ ここからデバッグログを修正・追加 ★★★ ---
        console.error("【フロントエンド】ユーザーステータスの検証に失敗し、ログインページにリダイレクトします。");
        if (error.response) {
          // バックエンドから返されたエラーの詳細
          console.error("エラーデータ:", error.response.data);
          console.error("エラーステータス:", error.response.status);
          console.error("エラーヘッダー:", error.response.headers);
        } else if (error.request) {
          // リクエストは行われたが、レスポンスがなかった場合
          console.error("リクエストデータ:", error.request);
        } else {
          // その他のエラー
          console.error("エラーメッセージ:", error.message);
        }
        // --- ★★★ ここまで ★★★ ---
        navigate('/login', { replace: true });
      }
    };

    verifyRoleAndNavigate();

  }, [searchParams, dispatch, navigate]);


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>認証中...</Typography>
    </Box>
  );
};