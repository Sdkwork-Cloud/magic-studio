
import { useState, useEffect } from 'react';
import { themeManager } from './ThemeManager';
import { ThemeMode } from './types';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(themeManager.isDark);
  
  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setIsDark);
    return () => { unsubscribe(); };
  }, []);

  const setMode = (mode: ThemeMode) => {
    themeManager.setMode(mode);
  };

  return {
    isDark,
    mode: themeManager.mode,
    setMode
  };
};
