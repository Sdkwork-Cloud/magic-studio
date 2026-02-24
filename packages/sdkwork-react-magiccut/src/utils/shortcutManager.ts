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
    private keyHandlers: Map<string, (e: KeyboardEvent) => void> = new Map();

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
        const handler = (e: KeyboardEvent) => {
            const key = this.getKeyString(e);
            for (const shortcut of this.shortcuts.values()) {
                if (shortcut.keys.includes(key)) {
                    e.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        };
        this.keyHandlers.set('default', handler);
        document.addEventListener('keydown', handler);
    }

    detach(): void {
        const handler = this.keyHandlers.get('default');
        if (handler) {
            document.removeEventListener('keydown', handler);
            this.keyHandlers.delete('default');
        }
    }

    getAllShortcuts(): ShortcutDefinition[] {
        return Array.from(this.shortcuts.values());
    }

    private getKeyString(e: KeyboardEvent): string {
        const parts: string[] = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }
}

export const shortcutManager = new ShortcutManager();
