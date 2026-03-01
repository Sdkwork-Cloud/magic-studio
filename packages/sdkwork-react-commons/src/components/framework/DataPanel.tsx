import {
  forwardRef,
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
  DataPanelItemRenderContext,
  FrameworkComponentProps,
  FrameworkSelectMode,
  SelectionChangeMeta
} from './types';

export interface DataPanelProps<TItem, TKey extends string | number = string>
  extends FrameworkComponentProps {
  panelId: string;
  title?: ReactNode;
  description?: ReactNode;
  items: TItem[];
  itemKey: (item: TItem, index: number) => TKey;
  renderItem: (item: TItem, context: DataPanelItemRenderContext<TKey>) => ReactNode;
  selectMode?: FrameworkSelectMode;
  selectedKeys?: TKey[];
  defaultSelectedKeys?: TKey[];
  onSelectionChange?: (selectedKeys: TKey[], meta: SelectionChangeMeta<TKey>) => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
}

export interface DataPanelHandle {
  focusSearch: () => void;
  clearSelection: () => void;
}

const isSelected = <TKey extends string | number>(keys: Set<TKey>, key: TKey): boolean => {
  return keys.has(key);
};

const DataPanelInner = <TItem, TKey extends string | number = string>(
  {
    id,
    className,
    style,
    testId,
    panelId,
    title,
    description,
    items,
    itemKey,
    renderItem,
    selectMode = 'none',
    selectedKeys,
    defaultSelectedKeys = [],
    onSelectionChange,
    query,
    onQueryChange,
    searchPlaceholder = 'Search...',
    toolbar,
    loading = false,
    error = null,
    emptyTitle = 'No data',
    emptyDescription = 'No records are available in this panel.',
    onRetry
  }: DataPanelProps<TItem, TKey>,
  ref: ForwardedRef<DataPanelHandle>
) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<TKey[]>(defaultSelectedKeys);

  const activeSelectedKeys = selectedKeys ?? internalSelectedKeys;
  const activeSelectedSet = useMemo(() => new Set(activeSelectedKeys), [activeSelectedKeys]);

  const updateSelection = (
    next: TKey[],
    meta: SelectionChangeMeta<TKey>
  ) => {
    if (selectedKeys === undefined) {
      setInternalSelectedKeys(next);
    }
    onSelectionChange?.(next, meta);
  };

  const toggleSelection = (key: TKey, source: SelectionChangeMeta<TKey>['source']) => {
    if (selectMode === 'none') {
      return;
    }

    if (selectMode === 'single') {
      const alreadySelected = activeSelectedSet.has(key);
      const next = alreadySelected ? [] : [key];
      updateSelection(next, { changedKey: key, selected: !alreadySelected, source });
      return;
    }

    const nextSet = new Set(activeSelectedSet);
    const selected = !nextSet.has(key);
    if (selected) {
      nextSet.add(key);
    } else {
      nextSet.delete(key);
    }
    updateSelection(Array.from(nextSet), { changedKey: key, selected, source });
  };

  useImperativeHandle(
    ref,
    () => ({
      focusSearch: () => {
        searchInputRef.current?.focus();
      },
      clearSelection: () => {
        updateSelection([], { selected: false, source: 'programmatic' });
      }
    }),
    [activeSelectedSet]
  );

  const showSearch = query !== undefined || typeof onQueryChange === 'function';

  return (
    <section
      id={id}
      data-testid={testId}
      data-panel-id={panelId}
      className={cn(
        'flex h-full min-h-0 flex-col rounded-[var(--sdk-radius-md)] border border-[var(--sdk-border)]',
        'bg-[var(--sdk-surface)] text-[var(--sdk-text-primary)]',
        className
      )}
      style={style}
    >
      <header className="flex flex-col gap-2 border-b border-[var(--sdk-border)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h3 className="truncate text-sm font-semibold">{title}</h3> : null}
            {description ? (
              <p className="mt-1 line-clamp-2 text-xs text-[var(--sdk-text-muted)]">{description}</p>
            ) : null}
          </div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </div>
        {showSearch ? (
          <input
            ref={searchInputRef}
            value={query || ''}
            onChange={(event) => onQueryChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'h-8 w-full rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-2 text-xs',
              'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-primary)] placeholder:text-[var(--sdk-text-muted)]',
              'outline-none ring-0 focus:border-[var(--sdk-primary)]'
            )}
          />
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-2">
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
          <div className="flex flex-col gap-2">
            {items.map((item, index) => {
              const key = itemKey(item, index);
              const selected = isSelected(activeSelectedSet, key);
              const context: DataPanelItemRenderContext<TKey> = {
                id: key,
                index,
                selected,
                toggleSelection: () => toggleSelection(key, 'programmatic')
              };

              return (
                <div
                  key={String(key)}
                  role={selectMode === 'none' ? undefined : 'option'}
                  aria-selected={selectMode === 'none' ? undefined : selected}
                  onClick={() => toggleSelection(key, 'click')}
                  className={cn(
                    'rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)]',
                    'transition-colors duration-150',
                    selectMode !== 'none' ? 'cursor-pointer hover:border-[var(--sdk-border-strong)]' : '',
                    selected ? 'border-[var(--sdk-primary)]' : ''
                  )}
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

type DataPanelComponent = <TItem, TKey extends string | number = string>(
  props: DataPanelProps<TItem, TKey> & { ref?: ForwardedRef<DataPanelHandle> }
) => ReactElement | null;

const DataPanelBase = forwardRef(DataPanelInner);
DataPanelBase.displayName = 'DataPanel';

export const DataPanel = DataPanelBase as DataPanelComponent;
