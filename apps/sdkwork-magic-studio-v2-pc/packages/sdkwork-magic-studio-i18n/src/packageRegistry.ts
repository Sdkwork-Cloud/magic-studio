import { useState, useEffect } from 'react';
import { i18nService } from './I18nService.ts';

export { packageI18nRegistry } from './registryInstance.ts';
export { registerPackageI18n, getPackageI18nConfig } from './registryInstance.ts';

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
    
    return {
        t,
        locale,
        setLocale: (l: string) => {
            void i18nService.setLocale(l as any);
        },
    };
}
