import { useCallback } from 'react';
import { useTranslation } from '@sdkwork/react-i18n';

type MagicCutTranslationKey = string;

export function useMagicCutTranslation() {
    const { t, locale } = useTranslation();

    const tmc = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        const fullKey = `magicCut.${key}`;
        const result = t(fullKey, options);
        return result;
    }, [t]);

    const tc = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`common.${key}`, options);
    }, [tmc]);

    const tp = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`player.${key}`, options);
    }, [tmc]);

    const tl = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`timeline.${key}`, options);
    }, [tmc]);

    const tr = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`resources.${key}`, options);
    }, [tmc]);

    const tpr = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`properties.${key}`, options);
    }, [tmc]);

    const te = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`export.${key}`, options);
    }, [tmc]);

    const ts = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`shortcuts.${key}`, options);
    }, [tmc]);

    const terr = useCallback((key: MagicCutTranslationKey, options?: Record<string, any>): string => {
        return tmc(`errors.${key}`, options);
    }, [tmc]);

    return {
        t: tmc,
        tc,
        tp,
        tl,
        tr,
        tpr,
        te,
        ts,
        terr,
        locale,
        isZh: locale.startsWith('zh'),
        isEn: locale.startsWith('en')
    };
}

export const formatTime = (seconds: number, locale: string = 'en'): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    if (h > 0) {
        return locale.startsWith('zh')
            ? `${h}\u5c0f\u65f6${m}\u5206${s}\u79d2`
            : `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return locale.startsWith('zh')
        ? `${m}\u5206${s}\u79d2`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const formatDuration = (seconds: number, locale: string = 'en'): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return locale.startsWith('zh')
            ? `${h}\u65f6${m}\u5206${s}\u79d2`
            : `${h}h ${m}m ${s}s`;
    }

    if (m > 0) {
        return locale.startsWith('zh')
            ? `${m}\u5206${s}\u79d2`
            : `${m}m ${s}s`;
    }

    return locale.startsWith('zh')
        ? `${s}\u79d2`
        : `${s}s`;
};

export const formatFileSize = (bytes: number, locale: string = 'en'): string => {
    const units = locale.startsWith('zh')
        ? ['\u5b57\u8282', 'KB', 'MB', 'GB', 'TB']
        : ['B', 'KB', 'MB', 'GB', 'TB'];

    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

export const formatBitrate = (bps: number, locale: string = 'en'): string => {
    if (bps >= 1000000) {
        return locale.startsWith('zh')
            ? `${(bps / 1000000).toFixed(1)} Mbps`
            : `${(bps / 1000000).toFixed(1)} Mbps`;
    }
    return locale.startsWith('zh')
        ? `${(bps / 1000).toFixed(1)} Kbps`
        : `${(bps / 1000).toFixed(1)} Kbps`;
};
