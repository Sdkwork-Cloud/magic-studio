import type { CSSProperties, ReactNode } from 'react';

export interface FrameworkComponentProps {
  id?: string;
  className?: string;
  style?: CSSProperties;
  testId?: string;
}

export type FrameworkComponentStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface FrameworkEventContext {
  source: string;
  timestamp: number;
}

export type FrameworkEventHandler<TPayload = void> = (
  payload: TPayload,
  context: FrameworkEventContext
) => void;

export type FrameworkSelectMode = 'none' | 'single' | 'multiple';

export interface SelectionChangeMeta<TKey extends string | number> {
  changedKey?: TKey;
  selected: boolean;
  source: 'click' | 'programmatic' | 'keyboard';
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  tooltip?: string;
  disabled?: boolean;
  loading?: boolean;
  visible?: boolean;
  tone?: 'default' | 'primary' | 'danger';
  onSelect?: () => void;
}

export interface DataPanelItemRenderContext<TKey extends string | number> {
  id: TKey;
  index: number;
  selected: boolean;
  toggleSelection: () => void;
}

