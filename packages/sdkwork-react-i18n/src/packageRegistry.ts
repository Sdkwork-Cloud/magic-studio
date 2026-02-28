import { useState, useEffect } from 'react';
import { i18nService } from './I18nService';

export { packageI18nRegistry } from './registryInstance';
export { registerPackageI18n, getPackageI18nConfig } from './registryInstance';

export function usePackageTranslation(namespace: string) {
    const [locale, setLocale] = useState(i18nService.locale);
    
    useEffect(() => {
        const unsubscribe = i18nService.subscribe(setLocale);
        return () => { unsubscribe(); };
    }, []);
    
    const t = (key: string, params?: Record<string, string>): string => {
        const fullKey = `${namespace}.${key}`;
        return i18nService.t(fullKey, params);
    };
    
    return { t, locale, setLocale: (l: string) => i18nService.setLocale(l as any) };
}
