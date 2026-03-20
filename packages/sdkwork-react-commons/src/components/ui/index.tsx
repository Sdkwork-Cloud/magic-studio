import React, {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Popover as BasePopover } from '../Popover/Popover';

type MarkerComponent<P = Record<string, never>> = React.FC<P> & {
  __uiKind: string;
};

const DIALOG_OVERLAY_CLASSNAME =
  'fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-6';
const SURFACE_CLASSNAME = 'w-full bg-[#18181b] text-gray-100';
const INPUT_CLASSNAME =
  'w-full rounded-xl border border-[#313138] bg-[#1a1a1d] px-3 py-2 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 hover:border-[#404046] focus:border-blue-500/60';
const TEXTAREA_CLASSNAME = `${INPUT_CLASSNAME} min-h-[96px] resize-y`;
const LABEL_CLASSNAME = 'block text-[10px] font-bold uppercase tracking-wider text-gray-500';

interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({ open: false });

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {open ? children : null}
    </DialogContext.Provider>
  );
};

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
  onInteractOutside?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      children,
      className,
      onInteractOutside,
      onMouseDown,
      showCloseButton = true,
      ...props
    },
    forwardedRef,
  ) => {
    const { open, onOpenChange } = useContext(DialogContext);
    const localRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) {
        return undefined;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onOpenChange?.(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onOpenChange]);

    if (!open || typeof document === 'undefined') {
      return null;
    }

    const assignRef = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
        return;
      }
      if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      onInteractOutside?.(event);
      if (!event.defaultPrevented) {
        onOpenChange?.(false);
      }
    };

    const content = (
      <div className={DIALOG_OVERLAY_CLASSNAME} onMouseDown={handleOverlayMouseDown}>
        <div
          {...props}
          className={cn(SURFACE_CLASSNAME, className)}
          onMouseDown={(event) => {
            event.stopPropagation();
            onMouseDown?.(event);
          }}
          ref={assignRef}
        >
          {showCloseButton ? (
            <button
              aria-label="Close dialog"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#2a2a30] hover:text-white"
              onClick={() => onOpenChange?.(false)}
              type="button"
            >
              <X size={18} />
            </button>
          ) : null}
          {children}
        </div>
      </div>
    );

    return createPortal(content, document.body);
  },
);

DialogContent.displayName = 'DialogContent';

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DialogClose: React.FC<DialogCloseProps> = ({
  asChild = false,
  children,
  onClick,
  type = 'button',
  ...props
}) => {
  const { onOpenChange } = useContext(DialogContext);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    if (!event.defaultPrevented) {
      onOpenChange?.(false);
    }
  };

  if (asChild && isValidElement(children)) {
    const element = children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>;
    return cloneElement(element, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        element.props.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button {...props} onClick={handleClick} type={type}>
      {children}
    </button>
  );
};

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return <input {...props} className={cn(INPUT_CLASSNAME, className)} ref={ref} type={type} />;
  },
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => {
    return <textarea {...props} className={cn(TEXTAREA_CLASSNAME, className)} ref={ref} rows={rows} />;
  },
);

Textarea.displayName = 'Textarea';

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return <label {...props} className={cn(LABEL_CLASSNAME, className)} ref={ref} />;
  },
);

Label.displayName = 'Label';

interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopoverContext = (): PopoverContextValue => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within Popover.');
  }
  return context;
};

export interface PopoverProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover: React.FC<PopoverProps> = ({
  children,
  defaultOpen = false,
  open,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isControlled = typeof open === 'boolean';
  const actualOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const value = useMemo<PopoverContextValue>(
    () => ({
      open: actualOpen,
      onOpenChange: handleOpenChange,
      triggerRef,
    }),
    [actualOpen],
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};

export interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ asChild = false, children }) => {
  const { open, onOpenChange, triggerRef } = usePopoverContext();
  const handleToggle = () => onOpenChange(!open);

  if (asChild) {
    return (
      <span
        className="inline-flex"
        onClick={handleToggle}
        ref={(node) => {
          triggerRef.current = node;
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      onClick={handleToggle}
      ref={(node) => {
        triggerRef.current = node;
      }}
      type="button"
    >
      {children}
    </button>
  );
};

export interface PopoverContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  side?: 'top' | 'bottom';
}

export const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  align = 'start',
  className,
}) => {
  const { open, onOpenChange, triggerRef } = usePopoverContext();

  return (
    <BasePopover
      align={align}
      className={className}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      triggerRef={triggerRef}
    >
      {children}
    </BasePopover>
  );
};

const SELECT_TRIGGER_KIND = 'SelectTrigger';
const SELECT_VALUE_KIND = 'SelectValue';
const SELECT_CONTENT_KIND = 'SelectContent';
const SELECT_ITEM_KIND = 'SelectItem';

const withMarker = <P,>(component: React.FC<P>, kind: string): MarkerComponent<P> => {
  return Object.assign(component, { __uiKind: kind });
};

const isMarkerElement = <P,>(node: React.ReactNode, kind: string): node is React.ReactElement<P> => {
  return isValidElement(node) && (node.type as MarkerComponent<P>).__uiKind === kind;
};

export interface SelectProps {
  children: React.ReactNode;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}

interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectContentProps {
  children?: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children?: React.ReactNode;
  disabled?: boolean;
  value: string;
}

const SelectTriggerBase: React.FC<SelectTriggerProps> = () => null;
const SelectValueBase: React.FC<SelectValueProps> = () => null;
const SelectContentBase: React.FC<SelectContentProps> = () => null;
const SelectItemBase: React.FC<SelectItemProps> = () => null;

export const SelectTrigger = withMarker<SelectTriggerProps>(SelectTriggerBase, SELECT_TRIGGER_KIND);
export const SelectValue = withMarker<SelectValueProps>(SelectValueBase, SELECT_VALUE_KIND);
export const SelectContent = withMarker<SelectContentProps>(SelectContentBase, SELECT_CONTENT_KIND);
export const SelectItem = withMarker<SelectItemProps>(SelectItemBase, SELECT_ITEM_KIND);

const extractPlaceholder = (node: React.ReactNode): string | undefined => {
  let placeholder: string | undefined;

  Children.forEach(node, (child) => {
    if (!placeholder && isMarkerElement(child, SELECT_VALUE_KIND)) {
      placeholder = (child.props as SelectValueProps).placeholder;
    }
  });

  return placeholder;
};

const extractItems = (node: React.ReactNode): SelectItemProps[] => {
  const items: SelectItemProps[] = [];

  Children.forEach(node, (child) => {
    if (isMarkerElement(child, SELECT_ITEM_KIND)) {
      items.push(child.props as SelectItemProps);
    }
  });

  return items;
};

export const Select: React.FC<SelectProps> = ({ children, disabled = false, onValueChange, value = '' }) => {
  let triggerClassName = '';
  let placeholder: string | undefined;
  let items: SelectItemProps[] = [];

  Children.forEach(children, (child) => {
    if (isMarkerElement(child, SELECT_TRIGGER_KIND)) {
      const triggerProps = child.props as SelectTriggerProps;
      triggerClassName = triggerProps.className || '';
      placeholder = extractPlaceholder(triggerProps.children);
      return;
    }

    if (isMarkerElement(child, SELECT_CONTENT_KIND)) {
      items = extractItems((child.props as SelectContentProps).children);
    }
  });

  const hasPlaceholder = Boolean(placeholder && !items.some((item) => item.value === ''));

  return (
    <div className="relative">
      <select
        className={cn(
          'w-full appearance-none rounded-xl border border-[#313138] bg-[#1a1a1d] px-3 py-2 pr-9 text-sm text-gray-100 outline-none transition-colors hover:border-[#404046] focus:border-blue-500/60',
          triggerClassName,
        )}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value}
      >
        {hasPlaceholder ? (
          <option disabled value="">
            {placeholder}
          </option>
        ) : null}
        {items.map((item) => (
          <option disabled={item.disabled} key={item.value || '__empty'} value={item.value}>
            {item.children}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
    </div>
  );
};
