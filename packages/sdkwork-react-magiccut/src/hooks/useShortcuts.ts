import { shortcutManager, type ShortcutDefinition, type ShortcutContext } from '../utils/shortcutManager'
import { useEffect, useCallback, useRef } from 'react';
;
import { useMagicCutStore } from '../store/magicCutStore';
import { useMagicCutBus } from '../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../events';
import { buildMagicCutShortcutDefinitions } from '../domain/shortcuts/magicCutShortcutDefinitions';
import { createJklTransportHandlers } from '../domain/shortcuts/shortcutTransport';

export function useShortcuts() {
    const store = useMagicCutStore();
    const bus = useMagicCutBus();
    const isEditingTextRef = useRef(false);
    
    const {
        pause, seek, stepForward, stepBackward,
        undo, redo, canUndo, canRedo,
        selectAllClips, clearSelection, deleteSelected,
        copySelectedClips, pasteClips,
        splitClip, nudgeSelectedClips,
        setInPoint, setOutPoint, clearInOutPoints,
        toggleSnapping, toggleSkimming,
        totalDuration,
        playerController,
        useTransientState, store: transientStore
    } = store;
    
    const currentTime = useTransientState(s => s.currentTime);
    const zoomLevel = useTransientState(s => s.zoomLevel);
    const canUndoRef = useRef(canUndo);
    const canRedoRef = useRef(canRedo);
    const currentTimeRef = useRef(currentTime);
    const zoomLevelRef = useRef(zoomLevel);
    const totalDurationRef = useRef(totalDuration);

    useEffect(() => {
        canUndoRef.current = canUndo;
    }, [canUndo]);

    useEffect(() => {
        canRedoRef.current = canRedo;
    }, [canRedo]);

    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    useEffect(() => {
        totalDurationRef.current = totalDuration;
    }, [totalDuration]);
    
    const updateShortcutContext = useCallback((context: Partial<ShortcutContext>) => {
        shortcutManager.updateContext(context);
    }, []);
    
    const setEditingText = useCallback((isEditing: boolean) => {
        isEditingTextRef.current = isEditing;
        shortcutManager.updateContext({ isEditingText: isEditing });
    }, []);
    
    useEffect(() => {
        const jklTransport = createJklTransportHandlers({ playerController });
        const shortcuts: ShortcutDefinition[] = buildMagicCutShortcutDefinitions({
            emit: (event) => bus.emit(event),
            playPause: () => bus.emit(MagicCutEvents.PLAYBACK_TOGGLE),
            playForward: jklTransport.playForward,
            playBackward: jklTransport.playBackward,
            pausePlayback: jklTransport.pausePlayback,
            stepForward,
            stepBackward,
            jumpStart: () => seek(0),
            jumpEnd: () => seek(totalDurationRef.current),
            selectAll: selectAllClips,
            deselectAll: clearSelection,
            deleteSelected: () => deleteSelected(),
            rippleDeleteSelected: () => deleteSelected('ripple'),
            copySelected: copySelectedClips,
            paste: () => pasteClips(null, currentTimeRef.current),
            pasteInsert: () => pasteClips(null, currentTimeRef.current, 'insert'),
            undo,
            redo,
            canUndo: () => canUndoRef.current,
            canRedo: () => canRedoRef.current,
            split: splitClip,
            nudge: nudgeSelectedClips,
            setInPoint: () => setInPoint(currentTimeRef.current),
            setOutPoint: () => setOutPoint(currentTimeRef.current),
            clearInOut: clearInOutPoints,
            zoomIn: () => {
                transientStore.setState({ zoomLevel: Math.min(80, zoomLevelRef.current * 1.5) });
            },
            zoomOut: () => {
                transientStore.setState({ zoomLevel: Math.max(0.05, zoomLevelRef.current / 1.5) });
            },
            toggleSnapping: () => bus.emit(MagicCutEvents.TIMELINE_SNAP_TOGGLE),
            toggleSkimming: () => bus.emit(MagicCutEvents.TIMELINE_SKIMMING_TOGGLE),
            toggleLinkedSelection: () => transientStore.getState().toggleLinkedSelection(),
            setEditTool: (tool) => transientStore.getState().setEditTool(tool)
        });
        
        shortcuts.forEach(s => shortcutManager.register(s));
        shortcutManager.attach();
        
        return () => {
            shortcuts.forEach(s => shortcutManager.unregister(s.id));
            shortcutManager.detach();
        };
    }, [
        bus, transientStore, pause, playerController, stepForward, stepBackward,
        undo, redo, canUndo, canRedo, selectAllClips, clearSelection,
        deleteSelected, copySelectedClips, pasteClips, splitClip,
        nudgeSelectedClips, setInPoint, setOutPoint, clearInOutPoints,
        toggleSnapping, toggleSkimming, seek
    ]);
    
    return {
        updateShortcutContext,
        setEditingText,
        shortcuts: shortcutManager.getAllShortcuts(),
    };
}
