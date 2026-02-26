
import { AppSettings } from '../entities/settings.entity'
import { settingsService } from '../services/settingsService'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_SETTINGS } from '../constants';
import { i18nService, Locale } from '@sdkwork/react-i18n';

interface SettingsStoreContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
}

const SettingsStoreContext = createContext<SettingsStoreContextType | undefined>(undefined);

// Helper function to detect browser language
const detectSystemLanguage = (): Locale => {
  if (typeof navigator === 'undefined') return 'en';
  
  const lang = navigator.language;
  // Simple matching logic
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('ja')) return 'ja';
  
  // Default fallback
  return 'en';
};

export const SettingsStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to sync Language
  const syncLanguage = (lang: string) => {
      let targetLocale = lang;
      
      // Handle Auto-Detection
      if (lang === 'system') {
          targetLocale = detectSystemLanguage();
      }

      // Validate support
      if (['en', 'zh-CN', 'ja'].includes(targetLocale)) {
          i18nService.setLocale(targetLocale as Locale);
      } else {
          // Fallback if detection returns unsupported locale
          i18nService.setLocale('en');
      }
  };

  useEffect(() => {
    const load = async () => {
      const result = await settingsService.getSettings();
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
    
    await settingsService.updateSettings(newSettings);
  };

  const resetToDefaults = async () => {
    setSettings(DEFAULT_SETTINGS);
    syncLanguage(DEFAULT_SETTINGS.general.language);
    await settingsService.updateSettings(DEFAULT_SETTINGS);
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
