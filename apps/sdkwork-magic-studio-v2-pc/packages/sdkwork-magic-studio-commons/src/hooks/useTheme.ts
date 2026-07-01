
import { useState, useEffect } from 'react';
import { ThemeMode } from '@sdkwork/magic-studio-types/theme-mode';

interface ThemeState {
  isDark: boolean;
  mode: ThemeMode;
}

let listeners: Array<(state: ThemeState) => void> = [];
let currentState: ThemeState = {
  isDark: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  mode: ThemeMode.SYSTEM
};

const notifyListeners = () => {
  listeners.forEach(listener => listener(currentState));
};

export const themeManager = {
  get isDark() { return currentState.isDark; },
  get mode() { return currentState.mode; },
  
  setMode: (mode: ThemeMode) => {
    const isDark = mode === ThemeMode.DARK
      ? true
      : mode === ThemeMode.LIGHT
        ? false
        : typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    
    currentState = { isDark, mode };
    notifyListeners();
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
  },
  
  subscribe: (listener: (state: ThemeState) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

export const useTheme = () => {
  const [state, setState] = useState<ThemeState>(currentState);
  
  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setState);
    return unsubscribe;
  }, []);
  
  return {
    isDark: state.isDark,
    mode: state.mode,
    setMode: themeManager.setMode
  };
};
