import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactElement,
  type ReactNode
} from 'react';
import { cn } from '../../utils/helpers';
import type {
  FrameworkComponentProps,
  VirtualizedListItemRenderContext
} from './types';

export interface VirtualizedListProps<TItem, TKey extends string | number = string>
  extends FrameworkComponentProps {
  listId: string;
  items: TItem[];
  itemKey: (item: TItem, index: number) => TKey;
  itemHeight: number;
  overscan?: number;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  onReachEnd?: () => void;
  renderItem: (item: TItem, context: VirtualizedListItemRenderContext<TKey>) => ReactNode;
}

export interface VirtualizedListHandle {
  scrollToTop: () => void;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
}

const VirtualizedListInner = <TItem, TKey extends string | number = string>(
  {
    id,
    className,
    style,
    testId,
    listId,
    items,
    itemKey,
    itemHeight,
    overscan = 4,
    height = '100%',
    loading = false,
    error = null,
    emptyTitle = 'No data',
    emptyDescription = 'No records are available in this list.',
    onRetry,
    onReachEnd,
    renderItem
  }: VirtualizedListProps<TItem, TKey>,
  ref: ForwardedRef<VirtualizedListHandle>
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(typeof height === 'number' ? height : 0);
  const reachedEndRef = useRef(false);

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    if (typeof height === 'number') {
      setViewportHeight(height);
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setViewportHeight(element.clientHeight);
    };
    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [height]);

  const totalHeight = items.length * itemHeight;
  const visibleViewport = Math.max(viewportHeight, 1);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + visibleViewport) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [endIndex, items, startIndex]);

  useEffect(() => {
    if (!onReachEnd) {
      return;
    }

    const atEnd = items.length > 0 && endIndex >= items.length;
    if (atEnd && !reachedEndRef.current) {
      reachedEndRef.current = true;
      onReachEnd();
      return;
    }
    if (!atEnd) {
      reachedEndRef.current = false;
    }
  }, [endIndex, items.length, onReachEnd]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      },
      scrollToIndex: (index: number, align = 'start') => {
        const element = containerRef.current;
        if (!element) {
          return;
        }
        const boundedIndex = Math.max(0, Math.min(index, items.length - 1));
        const itemTop = boundedIndex * itemHeight;
        let nextTop = itemTop;

        if (align === 'center') {
          nextTop = itemTop - visibleViewport / 2 + itemHeight / 2;
        } else if (align === 'end') {
          nextTop = itemTop - visibleViewport + itemHeight;
        }

        const maxTop = Math.max(0, totalHeight - visibleViewport);
        element.scrollTo({
          top: Math.max(0, Math.min(nextTop, maxTop)),
          behavior: 'smooth'
        });
      }
    }),
    [itemHeight, items.length, totalHeight, visibleViewport]
  );

  return (
    <section
      id={id}
      data-testid={testId}
      data-list-id={listId}
      className={cn(
        'flex h-full min-h-0 flex-col rounded-[var(--sdk-radius-md)] border border-[var(--sdk-border)]',
        'bg-[var(--sdk-surface)] text-[var(--sdk-text-primary)]',
        className
      )}
      style={style}
    >
      <div
        ref={containerRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        className="min-h-0 flex-1 overflow-auto"
        style={{ height: resolvedHeight }}
      >
        {loading ? (
          <div className="flex h-28 items-center justify-center text-sm text-[var(--sdk-text-muted)]">
            Loading...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex h-28 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-[var(--sdk-danger)]">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  'h-8 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-xs',
                  'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-secondary)] hover:bg-[var(--sdk-surface-elevated)]'
                )}
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-[var(--sdk-text-secondary)]">{emptyTitle}</p>
            <p className="max-w-[30rem] text-xs text-[var(--sdk-text-muted)]">{emptyDescription}</p>
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="relative w-full" style={{ height: `${totalHeight}px` }}>
            {visibleItems.map((item, itemIndex) => {
              const index = startIndex + itemIndex;
              const key = itemKey(item, index);
              const top = index * itemHeight;
              const context: VirtualizedListItemRenderContext<TKey> = {
                id: key,
                index,
                top,
                height: itemHeight
              };
              return (
                <div
                  key={String(key)}
                  className="absolute left-0 w-full"
                  style={{
                    top: `${top}px`,
                    height: `${itemHeight}px`
                  }}
                >
                  {renderItem(item, context)}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
};

type VirtualizedListComponent = <TItem, TKey extends string | number = string>(
  props: VirtualizedListProps<TItem, TKey> & { ref?: ForwardedRef<VirtualizedListHandle> }
) => ReactElement | null;

const VirtualizedListBase = forwardRef(VirtualizedListInner);
VirtualizedListBase.displayName = 'VirtualizedList';

export const VirtualizedList = VirtualizedListBase as VirtualizedListComponent;
