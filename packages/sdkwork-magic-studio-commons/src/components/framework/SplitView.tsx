import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { cn } from '../../utils/helpers';
import type { FrameworkComponentProps, SplitViewSizeChangeMeta } from './types';

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

export interface SplitViewProps extends FrameworkComponentProps {
  direction?: 'horizontal' | 'vertical';
  primary: ReactNode;
  secondary: ReactNode;
  resizable?: boolean;
  primarySize?: number;
  defaultPrimarySize?: number;
  minPrimarySize?: number;
  maxPrimarySize?: number;
  minSecondarySize?: number;
  dividerSize?: number;
  onPrimarySizeChange?: (size: number, meta: SplitViewSizeChangeMeta) => void;
  onResizeStart?: () => void;
  onResizeEnd?: (size: number) => void;
}

export interface SplitViewHandle {
  setPrimarySize: (size: number) => void;
  resetPrimarySize: () => void;
}

interface DragState {
  startPosition: number;
  startSize: number;
}

export const SplitView = forwardRef<SplitViewHandle, SplitViewProps>(
  (
    {
      id,
      className,
      style,
      testId,
      direction = 'horizontal',
      primary,
      secondary,
      resizable = true,
      primarySize,
      defaultPrimarySize = 320,
      minPrimarySize = 180,
      maxPrimarySize = Number.POSITIVE_INFINITY,
      minSecondarySize = 160,
      dividerSize = 6,
      onPrimarySizeChange,
      onResizeStart,
      onResizeEnd
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const [internalPrimarySize, setInternalPrimarySize] = useState(defaultPrimarySize);
    const currentSizeRef = useRef(primarySize ?? defaultPrimarySize);

    const activePrimarySize = primarySize ?? internalPrimarySize;

    useEffect(() => {
      currentSizeRef.current = activePrimarySize;
    }, [activePrimarySize]);

    const resolveContainerSize = (): number => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return 0;
      }
      return direction === 'horizontal' ? rect.width : rect.height;
    };

    const resolveMaxPrimarySize = (): number => {
      const containerSize = resolveContainerSize();
      if (containerSize <= 0) {
        return maxPrimarySize;
      }
      const bySecondary = Math.max(minPrimarySize, containerSize - minSecondarySize - dividerSize);
      return Math.min(maxPrimarySize, bySecondary);
    };

    const commitPrimarySize = (nextSize: number, meta: SplitViewSizeChangeMeta): number => {
      const bounded = clamp(nextSize, minPrimarySize, resolveMaxPrimarySize());
      if (primarySize === undefined) {
        setInternalPrimarySize(bounded);
      }
      onPrimarySizeChange?.(bounded, meta);
      currentSizeRef.current = bounded;
      return bounded;
    };

    useImperativeHandle(
      ref,
      () => ({
        setPrimarySize: (size: number) => {
          commitPrimarySize(size, { source: 'programmatic', delta: 0 });
        },
        resetPrimarySize: () => {
          commitPrimarySize(defaultPrimarySize, { source: 'programmatic', delta: 0 });
        }
      }),
      [defaultPrimarySize, maxPrimarySize, minPrimarySize, minSecondarySize, primarySize]
    );

    useEffect(() => {
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current) {
        return;
      }
      const currentPosition = direction === 'horizontal' ? event.clientX : event.clientY;
      const delta = currentPosition - dragStateRef.current.startPosition;
      commitPrimarySize(dragStateRef.current.startSize + delta, { source: 'drag', delta });
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current) {
        return;
      }
      dragStateRef.current = null;
      onResizeEnd?.(currentSizeRef.current);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    const handleDividerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!resizable) {
        return;
      }
      event.preventDefault();
      dragStateRef.current = {
        startPosition: direction === 'horizontal' ? event.clientX : event.clientY,
        startSize: activePrimarySize
      };
      onResizeStart?.();
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };

    const primaryStyle = useMemo(() => {
      if (direction === 'horizontal') {
        return { width: activePrimarySize };
      }
      return { height: activePrimarySize };
    }, [activePrimarySize, direction]);

    return (
      <div
        id={id}
        data-testid={testId}
        ref={containerRef}
        className={cn(
          'flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-[var(--sdk-surface)]',
          direction === 'horizontal' ? 'flex-row' : 'flex-col',
          className
        )}
        style={style}
      >
        <section
          className={cn(
            'shrink-0 overflow-auto border-[var(--sdk-border)]',
            direction === 'horizontal' ? 'min-w-0 border-r' : 'min-h-0 border-b'
          )}
          style={primaryStyle}
        >
          {primary}
        </section>

        <div
          role={resizable ? 'separator' : undefined}
          aria-orientation={direction}
          onPointerDown={handleDividerPointerDown}
          className={cn(
            'group relative shrink-0 bg-[var(--sdk-surface-muted)] transition-colors duration-150',
            resizable ? '' : 'pointer-events-none',
            direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'
          )}
          style={direction === 'horizontal' ? { width: dividerSize } : { height: dividerSize }}
        >
          <span
            className={cn(
              'absolute bg-[var(--sdk-border-strong)] opacity-40 transition-opacity duration-150 group-hover:opacity-100',
              direction === 'horizontal'
                ? 'left-1/2 top-0 h-full w-px -translate-x-1/2'
                : 'left-0 top-1/2 h-px w-full -translate-y-1/2'
            )}
          />
        </div>

        <section className="min-h-0 min-w-0 flex-1 overflow-auto">{secondary}</section>
      </div>
    );
  }
);

SplitView.displayName = 'SplitView';
