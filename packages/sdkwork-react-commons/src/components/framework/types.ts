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

export type FrameworkResizeSource = 'drag' | 'programmatic';

export interface SplitViewSizeChangeMeta {
  source: FrameworkResizeSource;
  delta: number;
}

export type FormFieldType = 'text' | 'password' | 'number' | 'textarea' | 'select' | 'switch' | 'checkbox';

export interface FormFieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  description?: string;
  type?: FormFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  options?: FormFieldOption[];
  min?: number;
  max?: number;
  step?: number;
}

export type FormPanelValues = Record<string, unknown>;

export interface FormValueChangeMeta {
  source: 'input' | 'reset' | 'programmatic';
  changedKey?: string;
}

export interface FormPanelSubmitMeta {
  source: 'submit' | 'keyboard' | 'programmatic';
}

export interface VirtualizedListItemRenderContext<TKey extends string | number> {
  id: TKey;
  index: number;
  top: number;
  height: number;
}

export interface CommandPaletteCommand {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  groupId?: string;
  groupLabel?: string;
  shortcut?: string;
  keywords?: string[];
  disabled?: boolean;
  visible?: boolean;
  onSelect?: () => void;
}

export interface CommandPaletteSelectMeta {
  source: 'click' | 'keyboard' | 'programmatic';
  query: string;
}
