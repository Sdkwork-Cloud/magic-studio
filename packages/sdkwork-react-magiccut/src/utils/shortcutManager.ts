export interface ShortcutDefinition {
    id: string;
    keys: string[];
    description: string;
    category: string;
    action: () => void;
}

export interface ShortcutContext {
    isEditingText: boolean;
    isPlaying: boolean;
    [key: string]: unknown;
}

class ShortcutManager {
    private shortcuts: Map<string, ShortcutDefinition> = new Map();
    private context: ShortcutContext = {
        isEditingText: false,
        isPlaying: false
    };
    private handler: ((e: KeyboardEvent) => void) | null = null;
    private isAttached = false;

    register(shortcut: ShortcutDefinition): void {
        this.shortcuts.set(shortcut.id, shortcut);
    }

    unregister(id: string): void {
        this.shortcuts.delete(id);
    }

    updateContext(context: Partial<ShortcutContext>): void {
        this.context = { ...this.context, ...context };
    }

    getContext(): ShortcutContext {
        return this.context;
    }

    attach(): void {
        if (this.isAttached) return;
        this.handler = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;
            if (this.context.isEditingText) return;

            const key = this.getKeyString(e);
            for (const shortcut of this.shortcuts.values()) {
                if (shortcut.keys.includes(key)) {
                    e.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        };
        document.addEventListener('keydown', this.handler);
        this.isAttached = true;
    }

    detach(): void {
        if (!this.isAttached || !this.handler) return;
        document.removeEventListener('keydown', this.handler);
        this.handler = null;
        this.isAttached = false;
    }

    getAllShortcuts(): ShortcutDefinition[] {
        return Array.from(this.shortcuts.values());
    }

    private getKeyString(e: KeyboardEvent): string {
        const parts: string[] = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'arrowleft') key = 'left';
        if (key === 'arrowright') key = 'right';
        if (key === 'arrowup') key = 'up';
        if (key === 'arrowdown') key = 'down';
        parts.push(key);
        return parts.join('+');
    }
}

export const shortcutManager = new ShortcutManager();
