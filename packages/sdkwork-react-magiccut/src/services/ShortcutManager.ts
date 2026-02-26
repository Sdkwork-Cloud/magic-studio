
export interface ShortcutDefinition {
    id: string;
    keys: string[];
    action: () => void;
    description: string;
    category: 'playback' | 'editing' | 'navigation' | 'selection' | 'tools';
    when?: () => boolean;
}

export interface ShortcutContext {
    isTimelineFocused: boolean;
    isPlayerFocused: boolean;
    isEditingText: boolean;
    isModalOpen: boolean;
}

class ShortcutManager {
    private shortcuts: Map<string, ShortcutDefinition> = new Map();
    private keyMap: Map<string, Set<string>> = new Map();
    private context: ShortcutContext = {
        isTimelineFocused: false,
        isPlayerFocused: false,
        isEditingText: false,
        isModalOpen: false
    };
    
    private boundHandler = this.handleKeyDown.bind(this);
    private isAttached = false;

    register(definition: ShortcutDefinition) {
        this.shortcuts.set(definition.id, definition);
        
        definition.keys.forEach(keyCombo => {
            const normalized = this.normalizeKeyCombo(keyCombo);
            if (!this.keyMap.has(normalized)) {
                this.keyMap.set(normalized, new Set());
            }
            this.keyMap.get(normalized)!.add(definition.id);
        });
    }

    unregister(id: string) {
        const definition = this.shortcuts.get(id);
        if (!definition) return;
        
        definition.keys.forEach(keyCombo => {
            const normalized = this.normalizeKeyCombo(keyCombo);
            const ids = this.keyMap.get(normalized);
            if (ids) {
                ids.delete(id);
                if (ids.size === 0) {
                    this.keyMap.delete(normalized);
                }
            }
        });
        
        this.shortcuts.delete(id);
    }

    updateContext(context: Partial<ShortcutContext>) {
        this.context = { ...this.context, ...context };
    }

    attach() {
        if (this.isAttached) return;
        window.addEventListener('keydown', this.boundHandler);
        this.isAttached = true;
    }

    detach() {
        if (!this.isAttached) return;
        window.removeEventListener('keydown', this.boundHandler);
        this.isAttached = false;
    }

    private normalizeKeyCombo(combo: string): string {
        const parts = combo.toLowerCase().split('+').map(p => p.trim());
        const modifiers: string[] = [];
        let key = '';
        
        parts.forEach(part => {
            if (['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(part)) {
                modifiers.push(part === 'cmd' ? 'meta' : part);
            } else {
                key = part;
            }
        });
        
        modifiers.sort();
        return [...modifiers, key].join('+');
    }

    private getEventKeyCombo(e: KeyboardEvent): string {
        const modifiers: string[] = [];
        
        if (e.ctrlKey) modifiers.push('ctrl');
        if (e.altKey) modifiers.push('alt');
        if (e.shiftKey) modifiers.push('shift');
        if (e.metaKey) modifiers.push('meta');
        
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'arrowleft') key = 'left';
        if (key === 'arrowright') key = 'right';
        if (key === 'arrowup') key = 'up';
        if (key === 'arrowdown') key = 'down';
        
        modifiers.sort();
        return [...modifiers, key].join('+');
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (this.context.isEditingText || this.context.isModalOpen) {
            return;
        }
        
        const combo = this.getEventKeyCombo(e);
        const ids = this.keyMap.get(combo);
        
        if (!ids || ids.size === 0) return;
        
        for (const id of ids) {
            const definition = this.shortcuts.get(id);
            if (!definition) continue;
            
            if (definition.when && !definition.when()) continue;
            
            e.preventDefault();
            e.stopPropagation();
            definition.action();
            return;
        }
    }

    getAllShortcuts(): ShortcutDefinition[] {
        return Array.from(this.shortcuts.values());
    }

    getShortcutsByCategory(category: ShortcutDefinition['category']): ShortcutDefinition[] {
        return this.getAllShortcuts().filter(s => s.category === category);
    }

    getShortcutDisplay(combo: string): string {
        return combo
            .split('+')
            .map(part => {
                switch (part.toLowerCase()) {
                    case 'ctrl': return '?';
                    case 'alt': return '?';
                    case 'shift': return '?';
                    case 'meta': case 'cmd': return '?';
                    case 'space': return 'ç©ºæ ¼';
                    case 'left': return 'â†?;
                    case 'right': return 'â†?;
                    case 'up': return 'â†?;
                    case 'down': return 'â†?;
                    default: return part.toUpperCase();
                }
            })
            .join('');
    }
}

export const shortcutManager = new ShortcutManager();

export const DEFAULT_SHORTCUTS: Omit<ShortcutDefinition, 'action'>[] = [
    { id: 'play-pause', keys: ['space'], description: 'Play/Pause', category: 'playback' },
    { id: 'play-forward', keys: ['l'], description: 'Play forward (press multiple times for faster)', category: 'playback' },
    { id: 'play-backward', keys: ['j'], description: 'Play backward (press multiple times for faster)', category: 'playback' },
    { id: 'pause-playback', keys: ['k'], description: 'Pause', category: 'playback' },
    { id: 'step-forward', keys: ['right'], description: 'Step forward one frame', category: 'navigation' },
    { id: 'step-backward', keys: ['left'], description: 'Step backward one frame', category: 'navigation' },
    { id: 'jump-start', keys: ['home'], description: 'Jump to start', category: 'navigation' },
    { id: 'jump-end', keys: ['end'], description: 'Jump to end', category: 'navigation' },
    { id: 'jump-clip-start', keys: ['shift+left'], description: 'Jump to clip start', category: 'navigation' },
    { id: 'jump-clip-end', keys: ['shift+right'], description: 'Jump to clip end', category: 'navigation' },
    { id: 'select-all', keys: ['ctrl+a'], description: 'Select all clips', category: 'selection' },
    { id: 'deselect-all', keys: ['ctrl+shift+a'], description: 'Deselect all', category: 'selection' },
    { id: 'delete', keys: ['delete', 'backspace'], description: 'Delete selected', category: 'editing' },
    { id: 'ripple-delete', keys: ['shift+delete'], description: 'Ripple delete', category: 'editing' },
    { id: 'copy', keys: ['ctrl+c'], description: 'Copy', category: 'editing' },
    { id: 'paste', keys: ['ctrl+v'], description: 'Paste', category: 'editing' },
    { id: 'cut', keys: ['ctrl+x'], description: 'Cut', category: 'editing' },
    { id: 'undo', keys: ['ctrl+z'], description: 'Undo', category: 'editing' },
    { id: 'redo', keys: ['ctrl+shift+z', 'ctrl+y'], description: 'Redo', category: 'editing' },
    { id: 'split', keys: ['ctrl+b', 's'], description: 'Split clip at playhead', category: 'editing' },
    { id: 'nudge-left', keys: [','], description: 'Nudge left 1 frame', category: 'editing' },
    { id: 'nudge-right', keys: ['.'], description: 'Nudge right 1 frame', category: 'editing' },
    { id: 'nudge-left-big', keys: ['shift+,'], description: 'Nudge left 10 frames', category: 'editing' },
    { id: 'nudge-right-big', keys: ['shift+.'], description: 'Nudge right 10 frames', category: 'editing' },
    { id: 'set-in-point', keys: ['i'], description: 'Set In point', category: 'editing' },
    { id: 'set-out-point', keys: ['o'], description: 'Set Out point', category: 'editing' },
    { id: 'clear-in-out', keys: ['ctrl+shift+x'], description: 'Clear In/Out points', category: 'editing' },
    { id: 'zoom-in', keys: ['+', '='], description: 'Zoom in timeline', category: 'navigation' },
    { id: 'zoom-out', keys: ['-'], description: 'Zoom out timeline', category: 'navigation' },
    { id: 'zoom-fit', keys: ['\\'], description: 'Zoom to fit', category: 'navigation' },
    { id: 'toggle-snapping', keys: ['n'], description: 'Toggle snapping', category: 'tools' },
    { id: 'toggle-skimming', keys: ['s'], description: 'Toggle skimming', category: 'tools' },
];

