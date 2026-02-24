import { useEffect } from 'react';

interface UseCanvasKeyboardOptions {
    onUndo: () => void;
    onRedo: () => void;
    onSelectAll: () => void;
    onDuplicate: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onGroup: () => void;
    onUngroup: () => void;
    onDelete: () => void;
    onClearSelection: () => void;
    onNudge: (dx: number, dy: number) => void;
    onSpaceDown: () => void;
    onSpaceUp: () => void;
    onEscape: () => void;
}

export function useCanvasKeyboard(options: UseCanvasKeyboardOptions) {
    const {
        onUndo, onRedo, onSelectAll, onDuplicate, onCopy, onPaste,
        onGroup, onUngroup, onDelete, onClearSelection, onNudge,
        onSpaceDown, onSpaceUp, onEscape
    } = options;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
            
            const isCtrl = e.ctrlKey || e.metaKey;
            
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                onSpaceDown();
            }
            
            if (isCtrl) {
                switch (e.key.toLowerCase()) {
                    case 'z': 
                        e.preventDefault(); 
                        e.shiftKey ? onRedo() : onUndo(); 
                        break;
                    case 'a': 
                        e.preventDefault(); 
                        onSelectAll(); 
                        break;
                    case 'd': 
                        e.preventDefault(); 
                        onDuplicate(); 
                        break;
                    case 'c': 
                        e.preventDefault(); 
                        onCopy(); 
                        break;
                    case 'v': 
                        e.preventDefault(); 
                        onPaste(); 
                        break;
                    case 'g': 
                        e.preventDefault(); 
                        e.shiftKey ? onUngroup() : onGroup(); 
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                onEscape();
            }
            
            if (e.key === 'Backspace' || e.key === 'Delete') {
                onDelete();
            }
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                switch (e.key) {
                    case 'ArrowUp': onNudge(0, -step); break;
                    case 'ArrowDown': onNudge(0, step); break;
                    case 'ArrowLeft': onNudge(-step, 0); break;
                    case 'ArrowRight': onNudge(step, 0); break;
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                onSpaceUp();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onUndo, onRedo, onSelectAll, onDuplicate, onCopy, onPaste, onGroup, onUngroup, onDelete, onClearSelection, onNudge, onSpaceDown, onSpaceUp, onEscape]);
}
