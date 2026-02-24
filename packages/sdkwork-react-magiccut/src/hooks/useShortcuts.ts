import { shortcutManager, type ShortcutDefinition, type ShortcutContext } from '../utils/shortcutManager'
import { useEffect, useCallback, useRef } from 'react';
;
import { useMagicCutStore } from '../store/magicCutStore';
import { useMagicCutBus } from '../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../events';

export function useShortcuts() {
    const store = useMagicCutStore();
    const bus = useMagicCutBus();
    const isEditingTextRef = useRef(false);
    
    const {
        pause, seek, stepForward, stepBackward,
        undo, redo, canUndo, canRedo,
        selectAllClips, clearSelection, deleteSelectedClips,
        copySelectedClips, pasteClips,
        splitClip, nudgeSelectedClips,
        setInPoint, setOutPoint, clearInOutPoints,
        toggleSnapping,
        totalDuration,
        useTransientState, store: transientStore
    } = store;
    
    const currentTime = useTransientState(s => s.currentTime);
    const zoomLevel = useTransientState(s => s.zoomLevel);
    
    const updateShortcutContext = useCallback((context: Partial<ShortcutContext>) => {
        shortcutManager.updateContext(context);
    }, []);
    
    const setEditingText = useCallback((isEditing: boolean) => {
        isEditingTextRef.current = isEditing;
        shortcutManager.updateContext({ isEditingText: isEditing });
    }, []);
    
    useEffect(() => {
        const shortcuts: ShortcutDefinition[] = [
            {
                id: 'play-pause',
                keys: ['space'],
                description: 'Play/Pause',
                category: 'playback',
                action: () => {
                    bus.emit(MagicCutEvents.PLAYBACK_TOGGLE);
                }
            },
            {
                id: 'play-forward',
                keys: ['l'],
                description: 'Play forward',
                category: 'playback',
                action: () => {
                    const state = transientStore.getState();
                    if (state.isPlaying && state.playbackDirection === 1) {
                        const newRate = Math.min(8, state.playbackRate * 2);
                        transientStore.setState({ playbackRate: newRate });
                    } else {
                        transientStore.setState({ playbackDirection: 1, playbackRate: 1, isPlaying: true });
                    }
                }
            },
            {
                id: 'play-backward',
                keys: ['j'],
                description: 'Play backward',
                category: 'playback',
                action: () => {
                    const state = transientStore.getState();
                    if (state.isPlaying && state.playbackDirection === -1) {
                        const newRate = Math.min(8, state.playbackRate * 2);
                        transientStore.setState({ playbackRate: newRate });
                    } else {
                        transientStore.setState({ playbackDirection: -1, playbackRate: 1, isPlaying: true });
                    }
                }
            },
            {
                id: 'pause-playback',
                keys: ['k'],
                description: 'Pause',
                category: 'playback',
                action: () => {
                    pause();
                }
            },
            {
                id: 'step-forward',
                keys: ['right'],
                description: 'Step forward',
                category: 'navigation',
                action: () => {
                    stepForward();
                }
            },
            {
                id: 'step-backward',
                keys: ['left'],
                description: 'Step backward',
                category: 'navigation',
                action: () => {
                    stepBackward();
                }
            },
            {
                id: 'jump-start',
                keys: ['home'],
                description: 'Jump to start',
                category: 'navigation',
                action: () => {
                    seek(0);
                }
            },
            {
                id: 'jump-end',
                keys: ['end'],
                description: 'Jump to end',
                category: 'navigation',
                action: () => {
                    seek(totalDuration);
                }
            },
            {
                id: 'select-all',
                keys: ['ctrl+a'],
                description: 'Select all',
                category: 'selection',
                action: () => {
                    selectAllClips();
                }
            },
            {
                id: 'deselect-all',
                keys: ['ctrl+shift+a'],
                description: 'Deselect all',
                category: 'selection',
                action: () => {
                    clearSelection();
                }
            },
            {
                id: 'delete',
                keys: ['delete', 'backspace'],
                description: 'Delete selected',
                category: 'editing',
                action: () => {
                    deleteSelectedClips();
                }
            },
            {
                id: 'copy',
                keys: ['ctrl+c'],
                description: 'Copy',
                category: 'editing',
                action: () => {
                    copySelectedClips();
                }
            },
            {
                id: 'paste',
                keys: ['ctrl+v'],
                description: 'Paste',
                category: 'editing',
                action: () => {
                    pasteClips(null, currentTime);
                }
            },
            {
                id: 'undo',
                keys: ['ctrl+z'],
                description: 'Undo',
                category: 'editing',
                action: () => {
                    if (canUndo) undo();
                }
            },
            {
                id: 'redo',
                keys: ['ctrl+shift+z', 'ctrl+y'],
                description: 'Redo',
                category: 'editing',
                action: () => {
                    if (canRedo) redo();
                }
            },
            {
                id: 'split',
                keys: ['ctrl+b'],
                description: 'Split clip',
                category: 'editing',
                action: () => {
                    splitClip();
                }
            },
            {
                id: 'nudge-left',
                keys: [','],
                description: 'Nudge left',
                category: 'editing',
                action: () => {
                    nudgeSelectedClips(-1);
                }
            },
            {
                id: 'nudge-right',
                keys: ['.'],
                description: 'Nudge right',
                category: 'editing',
                action: () => {
                    nudgeSelectedClips(1);
                }
            },
            {
                id: 'nudge-left-big',
                keys: ['shift+,'],
                description: 'Nudge left 10 frames',
                category: 'editing',
                action: () => {
                    nudgeSelectedClips(-10);
                }
            },
            {
                id: 'nudge-right-big',
                keys: ['shift+.'],
                description: 'Nudge right 10 frames',
                category: 'editing',
                action: () => {
                    nudgeSelectedClips(10);
                }
            },
            {
                id: 'set-in-point',
                keys: ['i'],
                description: 'Set In point',
                category: 'editing',
                action: () => {
                    setInPoint(currentTime);
                }
            },
            {
                id: 'set-out-point',
                keys: ['o'],
                description: 'Set Out point',
                category: 'editing',
                action: () => {
                    setOutPoint(currentTime);
                }
            },
            {
                id: 'clear-in-out',
                keys: ['ctrl+shift+x'],
                description: 'Clear In/Out',
                category: 'editing',
                action: () => {
                    clearInOutPoints();
                }
            },
            {
                id: 'zoom-in',
                keys: ['+', '='],
                description: 'Zoom in',
                category: 'navigation',
                action: () => {
                    transientStore.setState({ zoomLevel: Math.min(80, zoomLevel * 1.5) });
                }
            },
            {
                id: 'zoom-out',
                keys: ['-'],
                description: 'Zoom out',
                category: 'navigation',
                action: () => {
                    transientStore.setState({ zoomLevel: Math.max(0.05, zoomLevel / 1.5) });
                }
            },
            {
                id: 'toggle-snapping',
                keys: ['n'],
                description: 'Toggle snapping',
                category: 'tools',
                action: () => {
                    toggleSnapping();
                }
            },
            {
                id: 'tool-select',
                keys: ['v'],
                description: 'Selection Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('select');
                }
            },
            {
                id: 'tool-trim',
                keys: ['t'],
                description: 'Trim Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('trim');
                }
            },
            {
                id: 'tool-ripple',
                keys: ['r'],
                description: 'Ripple Edit Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('ripple');
                }
            },
            {
                id: 'tool-roll',
                keys: ['e'],
                description: 'Roll Edit Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('roll');
                }
            },
            {
                id: 'tool-slip',
                keys: ['y'],
                description: 'Slip Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('slip');
                }
            },
            {
                id: 'tool-slide',
                keys: ['u'],
                description: 'Slide Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('slide');
                }
            },
            {
                id: 'tool-razor',
                keys: ['c'],
                description: 'Razor Tool',
                category: 'tools',
                action: () => {
                    transientStore.getState().setEditTool('razor');
                }
            },
        ];
        
        shortcuts.forEach(s => shortcutManager.register(s));
        shortcutManager.attach();
        
        return () => {
            shortcuts.forEach(s => shortcutManager.unregister(s.id));
            shortcutManager.detach();
        };
    }, [
        bus, transientStore, pause, stepForward, stepBackward,
        undo, redo, canUndo, canRedo, selectAllClips, clearSelection,
        deleteSelectedClips, copySelectedClips, pasteClips, splitClip,
        nudgeSelectedClips, setInPoint, setOutPoint, clearInOutPoints,
        toggleSnapping, totalDuration, currentTime, zoomLevel
    ]);
    
    return {
        updateShortcutContext,
        setEditingText,
        shortcuts: shortcutManager.getAllShortcuts(),
    };
}

