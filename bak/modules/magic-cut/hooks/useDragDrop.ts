
import { useCallback, useRef, useState } from 'react';

interface DragState<T> {
    isDragging: boolean;
    data: T | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
}

interface UseDragOptions<T> {
    onDragStart?: (data: T, e: React.MouseEvent) => void;
    onDragMove?: (data: T, deltaX: number, deltaY: number, e: MouseEvent) => void;
    onDragEnd?: (data: T, e: MouseEvent) => void;
    threshold?: number;
}

interface UseDragResult<T> {
    state: DragState<T>;
    startDrag: (data: T, e: React.MouseEvent) => void;
    cancelDrag: () => void;
}

export function useDrag<T>({
    onDragStart,
    onDragMove,
    onDragEnd,
    threshold = 3
}: UseDragOptions<T> = {}): UseDragResult<T> {
    const [state, setState] = useState<DragState<T>>({
        isDragging: false,
        data: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        offsetX: 0,
        offsetY: 0
    });

    const stateRef = useRef(state);
    stateRef.current = state;

    const cancelDrag = useCallback(() => {
        setState(prev => ({ ...prev, isDragging: false, data: null }));
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const current = stateRef.current;
        if (!current.data) return;

        const deltaX = e.clientX - current.startX;
        const deltaY = e.clientY - current.startY;

        if (!current.isDragging) {
            if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
                setState(prev => ({ ...prev, isDragging: true }));
                onDragStart?.(current.data, e as any);
            }
            return;
        }

        setState(prev => ({
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY,
            offsetX: deltaX,
            offsetY: deltaY
        }));

        onDragMove?.(current.data, deltaX, deltaY, e);
    }, [threshold, onDragStart, onDragMove]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        const current = stateRef.current;
        
        if (current.isDragging && current.data) {
            onDragEnd?.(current.data, e);
        }

        setState(prev => ({ ...prev, isDragging: false, data: null }));
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [onDragEnd, handleMouseMove]);

    const startDrag = useCallback((data: T, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setState({
            isDragging: false,
            data,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            offsetX: 0,
            offsetY: 0
        });

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);

    return { state, startDrag, cancelDrag };
}

interface DropState {
    isOver: boolean;
    canDrop: boolean;
}

interface UseDropOptions<T> {
    onDragOver?: (e: React.DragEvent) => boolean;
    onDrop: (data: T, e: React.DragEvent) => void;
    acceptTypes?: string[];
}

interface UseDropResult {
    state: DropState;
    bind: {
        onDragOver: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
}

export function useDrop<T>({
    onDragOver,
    onDrop,
    acceptTypes
}: UseDropOptions<T>): UseDropResult {
    const [state, setState] = useState<DropState>({
        isOver: false,
        canDrop: false
    });

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const canDrop = onDragOver ? onDragOver(e) : true;
        
        setState(prev => ({
            ...prev,
            isOver: true,
            canDrop
        }));
    }, [onDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setState(prev => ({ ...prev, isOver: false }));
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setState(prev => ({ ...prev, isOver: false }));

        try {
            const jsonData = e.dataTransfer.getData('application/json');
            if (jsonData) {
                const data = JSON.parse(jsonData) as T;
                onDrop(data, e);
            }
        } catch (err) {
            console.warn('[useDrop] Failed to parse drop data', err);
        }
    }, [onDrop]);

    return {
        state,
        bind: {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop
        }
    };
}

interface UseDragDropResult<T> {
    drag: UseDragResult<T>;
    drop: UseDropResult;
}

export function useDragDrop<T>(
    dragOptions: UseDragOptions<T>,
    dropOptions: UseDropOptions<T>
): UseDragDropResult<T> {
    const drag = useDrag(dragOptions);
    const drop = useDrop(dropOptions);

    return { drag, drop };
}
