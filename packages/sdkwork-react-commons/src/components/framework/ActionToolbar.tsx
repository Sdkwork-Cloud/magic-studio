import { type FC } from 'react';
import { cn } from '../../utils/helpers';
import type { FrameworkComponentProps, ToolbarAction } from './types';

export interface ActionToolbarProps extends FrameworkComponentProps {
  actions: ToolbarAction[];
  compact?: boolean;
  direction?: 'horizontal' | 'vertical';
  stretch?: boolean;
  align?: 'start' | 'center' | 'end' | 'between';
  onAction?: (actionId: string, action: ToolbarAction) => void;
}

const toneClassMap: Record<NonNullable<ToolbarAction['tone']>, string> = {
  default: 'bg-[var(--sdk-surface-muted)] hover:bg-[var(--sdk-surface-elevated)] text-[var(--sdk-text-secondary)]',
  primary: 'bg-[var(--sdk-primary)] hover:bg-[var(--sdk-primary-hover)] text-white',
  danger: 'bg-[var(--sdk-danger)] hover:bg-[var(--sdk-danger-hover)] text-white'
};

const alignClassMap: Record<NonNullable<ActionToolbarProps['align']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between'
};

export const ActionToolbar: FC<ActionToolbarProps> = ({
  id,
  className,
  style,
  testId,
  actions,
  compact = false,
  direction = 'horizontal',
  stretch = false,
  align = 'start',
  onAction
}) => {
  const visibleActions = actions.filter((action) => action.visible !== false);
  const buttonSizeClass = compact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm';
  const layoutClass =
    direction === 'vertical'
      ? 'flex-col'
      : 'flex-row flex-wrap';
  const alignClass =
    direction === 'vertical'
      ? align === 'center'
        ? 'items-center'
        : align === 'end'
          ? 'items-end'
          : 'items-stretch'
      : alignClassMap[align];

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn('flex gap-2', layoutClass, alignClass, className)}
      style={style}
    >
      {visibleActions.map((action) => {
        const tone = action.tone || 'default';
        return (
          <button
            key={action.id}
            type="button"
            title={action.tooltip}
            disabled={action.disabled || action.loading}
            onClick={() => {
              action.onSelect?.();
              onAction?.(action.id, action);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] transition-colors duration-150',
              'disabled:cursor-not-allowed disabled:opacity-50',
              stretch ? 'w-full justify-start' : 'justify-center',
              buttonSizeClass,
              toneClassMap[tone]
            )}
          >
            {action.icon ? <span className="inline-flex items-center">{action.icon}</span> : null}
            <span>{action.loading ? 'Processing...' : action.label}</span>
          </button>
        );
      })}
    </div>
  );
};
