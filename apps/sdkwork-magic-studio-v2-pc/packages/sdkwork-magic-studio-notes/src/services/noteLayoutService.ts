const SIDEBAR_WIDTH_KEY = 'notes_sidebar_width';
const DEFAULT_SIDEBAR_WIDTH = 260;

class NoteLayoutService {
    getSidebarWidth(defaultValue: number = DEFAULT_SIDEBAR_WIDTH): number {
        if (typeof window === 'undefined') {
            return defaultValue;
        }
        try {
            const saved = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
            const parsed = saved ? parseInt(saved, 10) : NaN;
            return Number.isFinite(parsed) ? parsed : defaultValue;
        } catch (error) {
            console.warn('[NoteLayoutService] Failed to read sidebar width', error);
            return defaultValue;
        }
    }

    saveSidebarWidth(width: number): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    }
}

export const noteLayoutService = new NoteLayoutService();
