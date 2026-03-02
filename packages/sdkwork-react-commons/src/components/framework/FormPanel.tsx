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
  FormFieldDefinition,
  FormPanelSubmitMeta,
  FormPanelValues,
  FormValueChangeMeta,
  FrameworkComponentProps
} from './types';

const createDefaultValues = (
  fields: FormFieldDefinition[],
  defaults: FormPanelValues = {}
): FormPanelValues => {
  const next: FormPanelValues = { ...defaults };
  fields.forEach((field) => {
    if (next[field.key] === undefined && field.defaultValue !== undefined) {
      next[field.key] = field.defaultValue;
    }
  });
  return next;
};

type FieldRef = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

export interface FormPanelProps extends FrameworkComponentProps {
  panelId: string;
  title?: ReactNode;
  description?: ReactNode;
  fields: FormFieldDefinition[];
  value?: FormPanelValues;
  defaultValue?: FormPanelValues;
  columns?: 1 | 2;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  resetLabel?: string;
  hideSubmit?: boolean;
  hideReset?: boolean;
  extraActions?: ReactNode;
  onValueChange?: (value: FormPanelValues, meta: FormValueChangeMeta) => void;
  onSubmit?: (value: FormPanelValues, meta: FormPanelSubmitMeta) => void;
  onReset?: (value: FormPanelValues) => void;
}

export interface FormPanelHandle {
  submit: () => void;
  reset: () => void;
  focusField: (fieldKey: string) => void;
}

export const FormPanel = forwardRef<FormPanelHandle, FormPanelProps>(
  (
    {
      id,
      className,
      style,
      testId,
      panelId,
      title,
      description,
      fields,
      value,
      defaultValue,
      columns = 1,
      disabled = false,
      loading = false,
      error = null,
      submitLabel = 'Save',
      resetLabel = 'Reset',
      hideSubmit = false,
      hideReset = false,
      extraActions,
      onValueChange,
      onSubmit,
      onReset
    },
    ref
  ) => {
    const initialValue = useMemo(() => createDefaultValues(fields, defaultValue), [defaultValue, fields]);
    const [internalValue, setInternalValue] = useState<FormPanelValues>(initialValue);
    const fieldRefs = useRef<Record<string, FieldRef>>({});

    useEffect(() => {
      if (value === undefined) {
        setInternalValue(initialValue);
      }
    }, [initialValue, value]);

    const activeValue = value ?? internalValue;

    const commitValue = (nextValue: FormPanelValues, meta: FormValueChangeMeta): void => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, meta);
    };

    const updateField = (key: string, next: unknown): void => {
      commitValue(
        {
          ...activeValue,
          [key]: next
        },
        {
          source: 'input',
          changedKey: key
        }
      );
    };

    const doSubmit = (source: FormPanelSubmitMeta['source']) => {
      onSubmit?.(activeValue, { source });
    };

    const doReset = () => {
      const resetValue = createDefaultValues(fields, defaultValue);
      commitValue(resetValue, { source: 'reset' });
      onReset?.(resetValue);
    };

    useImperativeHandle(
      ref,
      () => ({
        submit: () => doSubmit('programmatic'),
        reset: doReset,
        focusField: (fieldKey: string) => {
          fieldRefs.current[fieldKey]?.focus();
        }
      }),
      [activeValue, defaultValue, fields]
    );

    const renderField = (field: FormFieldDefinition) => {
      const fieldType = field.type || 'text';
      const fieldValue = activeValue[field.key];
      const resolvedDisabled = disabled || loading || field.disabled;
      const assignRef = (node: FieldRef) => {
        fieldRefs.current[field.key] = node;
      };

      if (fieldType === 'textarea') {
        return (
          <textarea
            ref={assignRef}
            value={String(fieldValue ?? '')}
            onChange={(event) => updateField(field.key, event.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={resolvedDisabled}
            className={cn(
              'min-h-[92px] w-full rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 py-2 text-sm',
              'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-primary)] placeholder:text-[var(--sdk-text-muted)]',
              'outline-none transition-colors duration-150 focus:border-[var(--sdk-primary)] disabled:cursor-not-allowed disabled:opacity-60'
            )}
          />
        );
      }

      if (fieldType === 'select') {
        return (
          <select
            ref={assignRef}
            value={String(fieldValue ?? '')}
            onChange={(event) => updateField(field.key, event.target.value)}
            required={field.required}
            disabled={resolvedDisabled}
            className={cn(
              'h-9 w-full rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-sm',
              'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-primary)]',
              'outline-none transition-colors duration-150 focus:border-[var(--sdk-primary)] disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            <option value="">Select...</option>
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      if (fieldType === 'switch' || fieldType === 'checkbox') {
        return (
          <label className="inline-flex h-9 items-center gap-2 text-sm text-[var(--sdk-text-secondary)]">
            <input
              ref={assignRef}
              type="checkbox"
              checked={Boolean(fieldValue)}
              onChange={(event) => updateField(field.key, event.target.checked)}
              disabled={resolvedDisabled}
              className="h-4 w-4 rounded border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)]"
            />
            <span>{field.placeholder || field.label}</span>
          </label>
        );
      }

      if (fieldType === 'number') {
        return (
          <input
            ref={assignRef}
            type="number"
            value={fieldValue === undefined || fieldValue === null ? '' : String(fieldValue)}
            onChange={(event) => {
              const nextRaw = event.target.value;
              updateField(field.key, nextRaw.length === 0 ? undefined : Number(nextRaw));
            }}
            min={field.min}
            max={field.max}
            step={field.step}
            placeholder={field.placeholder}
            required={field.required}
            disabled={resolvedDisabled}
            className={cn(
              'h-9 w-full rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-sm',
              'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-primary)] placeholder:text-[var(--sdk-text-muted)]',
              'outline-none transition-colors duration-150 focus:border-[var(--sdk-primary)] disabled:cursor-not-allowed disabled:opacity-60'
            )}
          />
        );
      }

      return (
        <input
          ref={assignRef}
          type={fieldType}
          value={String(fieldValue ?? '')}
          onChange={(event) => updateField(field.key, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={resolvedDisabled}
          className={cn(
            'h-9 w-full rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-sm',
            'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-primary)] placeholder:text-[var(--sdk-text-muted)]',
            'outline-none transition-colors duration-150 focus:border-[var(--sdk-primary)] disabled:cursor-not-allowed disabled:opacity-60'
          )}
        />
      );
    };

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
        {(title || description) && (
          <header className="border-b border-[var(--sdk-border)] p-3">
            {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
            {description ? <p className="mt-1 text-xs text-[var(--sdk-text-muted)]">{description}</p> : null}
          </header>
        )}

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            doSubmit('submit');
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault();
              doSubmit('keyboard');
            }
          }}
        >
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {error ? (
              <div className="mb-3 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-danger)]/40 bg-[var(--sdk-danger)]/10 px-3 py-2 text-xs text-[var(--sdk-danger)]">
                {error}
              </div>
            ) : null}

            <div className={cn('grid gap-3', columns === 2 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
              {fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  {(field.type || 'text') === 'checkbox' || (field.type || 'text') === 'switch' ? null : (
                    <label className="text-xs font-medium text-[var(--sdk-text-secondary)]">
                      {field.label}
                      {field.required ? <span className="ml-1 text-[var(--sdk-danger)]">*</span> : null}
                    </label>
                  )}
                  {renderField(field)}
                  {field.description ? (
                    <p className="text-[11px] text-[var(--sdk-text-muted)]">{field.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-[var(--sdk-border)] p-3">
            <div className="text-xs text-[var(--sdk-text-muted)]">
              {loading ? 'Saving changes...' : 'Press Ctrl+Enter to submit quickly.'}
            </div>
            <div className="flex items-center gap-2">
              {extraActions}
              {hideReset ? null : (
                <button
                  type="button"
                  onClick={doReset}
                  disabled={disabled || loading}
                  className={cn(
                    'h-8 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-xs',
                    'bg-[var(--sdk-surface-muted)] text-[var(--sdk-text-secondary)] transition-colors duration-150 hover:bg-[var(--sdk-surface-elevated)]',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {resetLabel}
                </button>
              )}
              {hideSubmit ? null : (
                <button
                  type="submit"
                  disabled={disabled || loading}
                  className={cn(
                    'h-8 rounded-[var(--sdk-radius-sm)] border border-[var(--sdk-border)] px-3 text-xs',
                    'bg-[var(--sdk-primary)] text-white transition-colors duration-150 hover:bg-[var(--sdk-primary-hover)]',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {submitLabel}
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    );
  }
);

FormPanel.displayName = 'FormPanel';
