
import { AppSettings } from '../entities'
import { settingsBusinessService } from '../services'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_SETTINGS } from '../constants';
import {
  DEFAULT_LOCALE,
  getRequestedLocaleFromSearch,
  i18nService,
  Locale,
  resolveLocale,
} from '@sdkwork/react-i18n';

interface SettingsStoreContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
}

const SettingsStoreContext = createContext<SettingsStoreContextType | undefined>(undefined);

// Helper function to detect browser language
const detectSystemLanguage = (): Locale => {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  return resolveLocale({
    browserLanguages: navigator.languages,
    defaultLocale: DEFAULT_LOCALE,
  });
};

const resolveRuntimeLocale = (lang: string): Locale => {
  const requestedLocale = typeof window !== 'undefined'
    ? getRequestedLocaleFromSearch(window.location.search)
    : null;

  if (requestedLocale) {
    return resolveLocale({
      requestedLocale,
      defaultLocale: DEFAULT_LOCALE,
    });
  }

  if (lang === 'system') {
    return detectSystemLanguage();
  }

  return resolveLocale({
    requestedLocale: lang,
    defaultLocale: DEFAULT_LOCALE,
  });
};

export const SettingsStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Sync the runtime locale while preserving explicit request overrides.
  const syncLanguage = (lang: string) => {
      i18nService.setLocale(resolveRuntimeLocale(lang));
  };

  useEffect(() => {
    const load = async () => {
      const result = await settingsBusinessService.getSettings();
      if (result.success && result.data) {
          setSettings(result.data);
          syncLanguage(result.data.general.language);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    // Real-time updates
    syncLanguage(newSettings.general.language);
    
    await settingsBusinessService.updateSettings(newSettings);
  };

  const resetToDefaults = async () => {
    setSettings(DEFAULT_SETTINGS);
    syncLanguage(DEFAULT_SETTINGS.general.language);
    await settingsBusinessService.updateSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsStoreContext.Provider value={{ settings, updateSettings, resetToDefaults, isLoading }}>
      {children}
    </SettingsStoreContext.Provider>
  );
};

export const useSettingsStore = () => {
  const context = useContext(SettingsStoreContext);
  if (!context) throw new Error('useSettingsStore must be used within a SettingsStoreProvider');
  return context;
};

