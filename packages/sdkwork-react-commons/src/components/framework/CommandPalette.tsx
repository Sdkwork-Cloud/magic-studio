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
import type {
  CommandPaletteCommand,
  CommandPaletteSelectMeta,
  FrameworkComponentProps
} from './types';

interface IndexedCommand {
  index: number;
  command: CommandPaletteCommand;
}

interface CommandGroup {
  id: string;
  label: string;
  commands: IndexedCommand[];
}

export interface CommandPaletteProps extends FrameworkComponentProps {
  paletteId: string;
  commands: CommandPaletteCommand[];
  title?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  query?: string;
  defaultQuery?: string;
  placeholder?: string;
  loading?: boolean;
  closeOnSelect?: boolean;
  showGroupLabel?: boolean;
  autoFocus?: boolean;
  maxVisibleCommands?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onOpenChange?: (open: boolean) => void;
  onQueryChange?: (query: string) => void;
  onSelect?: (command: CommandPaletteCommand, meta: CommandPaletteSelectMeta) => void;
}

export interface CommandPaletteHandle {
  focusSearch: () => void;
  clearQuery: () => void;
  setOpen: (open: boolean) => void;
  moveSelection: (delta: number) => void;
  selectActive: () => void;
}

const normalize = (value: string): string => value.trim().toLowerCase();

const commandMatches = (command: CommandPaletteCommand, query: string): boolean => {
  if (!query) {
    return true;
  }
  const bag = [
    command.label,
    command.description || '',
    ...(command.keywords || [])
  ]
    .join(' ')
    .toLowerCase();
  return bag.includes(query);
};

export const CommandPalette = forwardRef<CommandPaletteHandle, CommandPaletteProps>(
  (
    {
      id,
      className,
      style,
      testId,
      paletteId,
      commands,
      title = 'Command Palette',
      open,
      defaultOpen = false,
      query,
      defaultQuery = '',
      placeholder = 'Search commands...',
      loading = false,
      closeOnSelect = true,
      showGroupLabel = true,
      autoFocus = true,
      maxVisibleCommands = 100,
      emptyTitle = 'No command found',
      emptyDescription = 'Try a different keyword.',
      onOpenChange,
      onQueryChange,
      onSelect
    },
    ref
  ) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const [internalQuery, setInternalQuery] = useState(defaultQuery);
    const [activeIndex, setActiveIndex] = useState(-1);

    const activeOpen = open ?? internalOpen;
    const activeQuery = query ?? internalQuery;

    const setOpen = (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const setQuery = (nextQuery: string) => {
      if (query === undefined) {
        setInternalQuery(nextQuery);
      }
      onQueryChange?.(nextQuery);
    };

    const filteredCommands = useMemo(() => {
      const q = normalize(activeQuery);
      return commands
        .filter((item) => item.visible !== false)
        .filter((item) => commandMatches(item, q))
        .slice(0, maxVisibleCommands);
    }, [activeQuery, commands, maxVisibleCommands]);

    const groupedCommands = useMemo<CommandGroup[]>(() => {
      let nextIndex = 0;
      const bucket = new Map<string, CommandGroup>();

      filteredCommands.forEach((command) => {
        const groupId = command.groupId || 'general';
        const groupLabel = command.groupLabel || 'General';
        const current = bucket.get(groupId);
        if (!current) {
          bucket.set(groupId, {
            id: groupId,
            label: groupLabel,
            commands: [{ index: nextIndex, command }]
          });
        } else {
          current.commands.push({ index: nextIndex, command });
        }
        nextIndex += 1;
      });

      return Array.from(bucket.values());
    }, [filteredCommands]);

    const indexedCommands = useMemo<IndexedCommand[]>(() => {
      return groupedCommands.flatMap((group) => group.commands);
    }, [groupedCommands]);

    const moveSelection = (delta: number): void => {
      if (indexedCommands.length === 0) {
        setActiveIndex(-1);
        return;
      }
      setActiveIndex((prev) => {
        const next = prev < 0 ? 0 : (prev + delta + indexedCommands.length) % indexedCommands.length;
        return next;
      });
    };

    const selectCommand = (
      target: CommandPaletteCommand | undefined,
      source: CommandPaletteSelectMeta['source']
    ) => {
      if (!target || target.disabled) {
        return;
      }
      target.onSelect?.();
      onSelect?.(target, { source, query: activeQuery });
      if (closeOnSelect) {
        setOpen(false);
      }
    };

    const selectActive = () => {
      const command = indexedCommands.find((item) => item.index === activeIndex)?.command;
      selectCommand(command, 'programmatic');
    };

    useEffect(() => {
      if (!activeOpen) {
        return;
      }
      if (autoFocus) {
        const timer = window.setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
        return () => window.clearTimeout(timer);
      }
    }, [activeOpen, autoFocus]);

    useEffect(() => {
      if (!activeOpen) {
        setActiveIndex(-1);
        return;
      }
      setActiveIndex(indexedCommands.length > 0 ? 0 : -1);
    }, [activeOpen, activeQuery, indexedCommands.length]);

    useImperativeHandle(
      ref,
      () => ({
        focusSearch: () => {
          searchInputRef.current?.focus();
        },
        clearQuery: () => {
          setQuery('');
        },
        setOpen,
        moveSelection,
        selectActive
      }),
      [indexedCommands, activeIndex, activeQuery]
    );

    if (!activeOpen) {
      return null;
    }

    return (
      <section
        id={id}
        data-testid={testId}
        data-palette-id={paletteId}
        className={cn(
          'flex h-full min-h-[300px] w-full max-w-[720px] flex-col overflow-hidden rounded-[var(--sdk-radius-lg)] border border-[var(--sdk-border)]',
          'bg-[var(--sdk-surface)] text-[var(--sdk-text-primary)]',
          className
        )}
        style={style}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveSelection(1);
            return;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveSelection(-1);
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const command = indexedCommands.find((item) => item.index === activeIndex)?.command;
            selectCommand(command, 'keyboard');
            return;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          }
        }}
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--sdk-border)] p-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={cn(
              'h-7 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-2 text-xs',
              'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-secondary)] hover:bg-[var(--sdk-surface-elevated)]'
            )}
          >
            Esc
          </button>
        </header>

        <div className="border-b border-[var(--sdk-border)] p-3">
          <input
            ref={searchInputRef}
            value={activeQuery}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className={cn(
              'h-9 w-full rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-sm',
              'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-primary)] placeholder:text-[var(--sdk-text-muted)]',
              'outline-none transition-colors duration-150 focus:border-[var(--sdk-primary)]'
            )}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex h-24 items-center justify-center text-sm text-[var(--sdk-text-muted)]">
              Loading commands...
            </div>
          ) : null}

          {!loading && indexedCommands.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-[var(--sdk-text-secondary)]">{emptyTitle}</p>
              <p className="text-xs text-[var(--sdk-text-muted)]">{emptyDescription}</p>
            </div>
          ) : null}

          {!loading &&
            groupedCommands.map((group) => (
              <div key={group.id} className="mb-3 last:mb-0">
                {showGroupLabel ? (
                  <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--sdk-text-muted)]">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {group.commands.map(({ command, index }) => (
                    <button
                      key={command.id}
                      type="button"
                      onClick={() => selectCommand(command, 'click')}
                      disabled={command.disabled}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-[var(--sdk-radius-sm)] border border-transparent px-2 py-2 text-left',
                        'transition-colors duration-150',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        index === activeIndex
                          ? 'border-[var(--sdk-primary)] bg-[var(--sdk-primary)]/15'
                          : 'hover:bg-[var(--sdk-surface-muted)]'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {command.icon ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center text-[var(--sdk-text-muted)]">
                            {command.icon}
                          </span>
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[var(--sdk-text-primary)]">{command.label}</p>
                          {command.description ? (
                            <p className="truncate text-[11px] text-[var(--sdk-text-muted)]">
                              {command.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {command.shortcut ? (
                        <kbd className="rounded border border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--sdk-text-muted)]">
                          {command.shortcut}
                        </kbd>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    );
  }
);

CommandPalette.displayName = 'CommandPalette';
