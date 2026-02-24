export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatNumber(num: number, locale = 'en-US'): string {
    return new Intl.NumberFormat(locale).format(num);
}

export function formatDate(date: Date | string | number, locale = 'en-US'): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] !== undefined) {
            if (isObject(source[key]) && isObject(result[key])) {
                result[key] = deepMerge(result[key], source[key] as any);
            } else {
                result[key] = source[key] as any;
            }
        }
    }
    
    return result;
}

export const pathUtils = {
    detectSeparator(path: string): string {
        if (path.includes('\\')) return '\\';
        return '/';
    },

    join(...segments: string[]): string {
        if (segments.length === 0) return '';
        
        const hasBackslash = segments.some(s => s.includes('\\'));
        const sep = hasBackslash ? '\\' : '/';
        
        let joined = segments
            .filter(seg => seg !== null && seg !== undefined && seg !== '')
            .map((seg, index) => {
                let s = seg;
                s = s.replace(/[/\\]/g, sep);
                
                if (s.length > 1 && s.endsWith(sep)) s = s.slice(0, -1);
                if (index !== 0 && s.startsWith(sep)) s = s.slice(1);
                
                return s;
            })
            .join(sep);

        if (joined.length > 1 && joined.endsWith(sep)) {
            joined = joined.slice(0, -1);
        }

        return joined;
    },

    dirname(path: string): string {
        const sep = this.detectSeparator(path);
        let p = path;
        if (p.endsWith(sep) && p.length > 1) p = p.slice(0, -1);
        
        const parts = p.split(sep);
        if (parts.length <= 1) return path;
        parts.pop();
        return parts.join(sep) || sep;
    },

    basename(path: string): string {
        const sep = this.detectSeparator(path);
        let p = path;
        while (p.length > 1 && p.endsWith(sep)) {
            p = p.slice(0, -1);
        }
        return p.split(sep).pop() || '';
    },

    extname(path: string): string {
        const base = this.basename(path);
        if (base.startsWith('.')) return '';
        const idx = base.lastIndexOf('.');
        if (idx === -1) return '';
        return base.substring(idx);
    },
  
    normalize(path: string): string {
        const sep = this.detectSeparator(path);
        let res = path.replace(/[/\\]/g, sep);
        if (res.length > 1 && res.endsWith(sep)) res = res.slice(0, -1);
        return res;
    },

    isBinary(path: string): boolean {
        const binaryExts = new Set([
            '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
            '.mp3', '.wav', '.mp4', '.mov', '.avi',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.zip', '.tar', '.gz', '.7z', '.rar',
            '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.class', '.pyc', '.wasm'
        ]);
        const ext = this.extname(path).toLowerCase();
        return binaryExts.has(ext);
    }
};
