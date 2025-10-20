import React, { createContext, useMemo, useContext, useEffect, useRef } from 'react';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/theme';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ThemeOverrides } from './ThemeOverrides';
import { useAppDispatch } from '@/app/hooks'; 
import { showToast } from '@/features/toast/toastSlice';

const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'auto',
});

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeRegistry = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useLocalStorage<'auto' | 'light' | 'dark'>('themeMode', 'auto');
  const dispatch = useAppDispatch();
  const isInitialMount = useRef(true); // 初回マウントかどうかを判定するフラグ
  
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // ★★★★★ ここからが修正箇所です ★★★★★
  // mode の変更を副作用として検知し、トーストを表示する
  useEffect(() => {
    // 初回マウント時はトーストを表示しない
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const modeText = { auto: 'システム設定に連動', light: 'ライトモード', dark: 'ダークモード' };
    dispatch(showToast({ message: `テーマを「${modeText[mode]}」に変更しました`, severity: 'info' }));
  }, [mode, dispatch]); // modeが変更された時にこのeffectを実行

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        // stateの更新ロジックのみに専念させる
        setMode((prevMode) => 
          prevMode === 'auto' ? 'light' : prevMode === 'light' ? 'dark' : 'auto'
        );
      },
      mode,
    }),
    [setMode, mode], // dispatchは依存配列から削除
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