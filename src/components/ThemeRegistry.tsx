import React, { createContext, useMemo, useContext, useEffect, useRef } from 'react';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/theme';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ThemeOverrides } from './ThemeOverrides';
import { useAppDispatch } from '@/app/hooks';
import { showToast } from '@/features/toast/toastSlice';

const ColorModeContext = createContext({
  toggleColorMode: () => { },
  mode: 'auto',
});

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeRegistry = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useLocalStorage<'auto' | 'light' | 'dark'>('themeMode', 'auto');
  const dispatch = useAppDispatch();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // ★★★★★ ここからが修正箇所です ★★★★★
  // 前回の mode の値を保持するための ref
  const previousModeRef = useRef(mode);

  useEffect(() => {
    // 前回の値と現在の値が実際に変更された場合のみトーストを表示する
    if (previousModeRef.current !== mode) {
      const modeText = { auto: 'システム設定に連動', light: 'ライトモード', dark: 'ダークモード' };
      dispatch(showToast({ message: `テーマを「${modeText[mode]}」に変更しました`, severity: 'info' }));
    }
    // 現在の値を次のレンダリングのために保存
    previousModeRef.current = mode;
  }, [mode, dispatch]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) =>
          prevMode === 'auto' ? 'light' : prevMode === 'light' ? 'dark' : 'auto'
        );
      },
      mode,
    }),
    [setMode, mode],
  );
  // ★★★★★ ここまで修正 ★★★★★

  const theme = useMemo(() => {
    if (mode === 'auto') {
      return prefersDarkMode ? darkTheme : lightTheme;
    }
    return mode === 'light' ? lightTheme : darkTheme;
  }, [mode, prefersDarkMode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeOverrides />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};