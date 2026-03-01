import { useMemo } from 'react';
import { formatDate } from '../../utils/helpers';
import { ActionToolbar } from './ActionToolbar';
import { DataPanel } from './DataPanel';
import type { FrameworkComponentProps, SelectionChangeMeta, ToolbarAction } from './types';

export interface EntityCollectionItem {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  updatedAt?: string | number;
  status?: string;
}

export interface EntityCollectionPanelProps extends FrameworkComponentProps {
  panelId: string;
  title: string;
  description?: string;
  entities: EntityCollectionItem[];
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  query?: string;
  loading?: boolean;
  error?: string | null;
  onQueryChange?: (query: string) => void;
  onSelectionChange?: (selectedIds: string[], meta: SelectionChangeMeta<string>) => void;
  onOpen?: (entity: EntityCollectionItem) => void;
  onCreate?: () => void;
  onRefresh?: () => void;
  onDelete?: (entity: EntityCollectionItem) => void;
}

export const EntityCollectionPanel: React.FC<EntityCollectionPanelProps> = ({
  id,
  className,
  style,
  testId,
  panelId,
  title,
  description,
  entities,
  selectedIds,
  defaultSelectedIds,
  query,
  loading = false,
  error = null,
  onQueryChange,
  onSelectionChange,
  onOpen,
  onCreate,
  onRefresh,
  onDelete
}) => {
  const toolbarActions = useMemo<ToolbarAction[]>(() => {
    return [
      {
        id: 'create',
        label: 'Create',
        tone: 'primary',
        visible: typeof onCreate === 'function',
        onSelect: onCreate
      },
      {
        id: 'refresh',
        label: 'Refresh',
        visible: typeof onRefresh === 'function',
        onSelect: onRefresh
      }
    ];
  }, [onCreate, onRefresh]);

  return (
    <DataPanel
      id={id}
      className={className}
      style={style}
      testId={testId}
      panelId={panelId}
      title={title}
      description={description}
      items={entities}
      itemKey={(entity) => entity.id}
      selectMode="single"
      selectedKeys={selectedIds}
      defaultSelectedKeys={defaultSelectedIds}
      query={query}
      loading={loading}
      error={error}
      onQueryChange={onQueryChange}
      onSelectionChange={onSelectionChange}
      emptyTitle="No entities yet"
      emptyDescription="Create your first entity to start building your workflow."
      searchPlaceholder="Search entities..."
      toolbar={<ActionToolbar actions={toolbarActions} compact />}
      renderItem={(entity, context) => {
        return (
          <div className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--sdk-text-primary)]">{entity.title}</p>
              {entity.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--sdk-text-muted)]">{entity.description}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {entity.updatedAt ? (
                  <span className="text-[11px] text-[var(--sdk-text-muted)]">
                    Updated {formatDate(entity.updatedAt)}
                  </span>
                ) : null}
                {entity.status ? (
                  <span className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--sdk-text-muted)] ring-1 ring-[var(--sdk-border)]">
                    {entity.status}
                  </span>
                ) : null}
                {(entity.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded px-1.5 py-0.5 text-[10px] text-[var(--sdk-text-secondary)] ring-1 ring-[var(--sdk-border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  context.toggleSelection();
                  onOpen?.(entity);
                }}
                className="h-7 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] bg-[var(--sdk-surface-elevated)] px-2 text-xs text-[var(--sdk-text-secondary)] hover:bg-[var(--sdk-surface)]"
              >
                Open
              </button>
              {onDelete ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(entity);
                  }}
                  className="h-7 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] bg-[var(--sdk-surface-elevated)] px-2 text-xs text-[var(--sdk-danger)] hover:bg-[var(--sdk-surface)]"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        );
      }}
    />
  );
};
