import React, { useCallback, useEffect } from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Check, Trash2, HelpCircle, Info } from 'lucide-react';
import { Button } from '../Button';

/**
 * Confirm Dialog Type
 */
export type ConfirmType = 'danger' | 'warning' | 'info' | 'confirm';

/**
 * Confirm Button Variant
 */
export type ConfirmButtonVariant = 'primary' | 'danger' | 'secondary';

/**
 * Confirm Dialog Props
 */
export interface ConfirmProps {
    /** Whether the dialog is visible */
    isOpen: boolean;
    
    /** Dialog title */
    title: string;
    
    /** Dialog message or content */
    message?: string;
    
    /** Custom content to render instead of message */
    children?: React.ReactNode;
    
    /** Dialog type - affects icon and colors */
    type?: ConfirmType;
    
    /** Text for confirm button */
    confirmText?: string;
    
    /** Text for cancel button */
    cancelText?: string;
    
    /** Variant for confirm button */
    confirmVariant?: ConfirmButtonVariant;
    
    /** Whether to show cancel button */
    showCancel?: boolean;
    
    /** Whether confirm button is in loading state */
    isLoading?: boolean;
    
    /** Whether confirm button is disabled */
    confirmDisabled?: boolean;
    
    /** Callback when confirm is clicked */
    onConfirm: () => void | Promise<void>;
    
    /** Callback when cancel is clicked or dialog is dismissed */
    onCancel: () => void;
    
    /** Callback when dialog is closed (backdrop click or escape key) */
    onClose?: () => void;
    
    /** Additional CSS class for the dialog */
    className?: string;
    
    /** Whether to close on backdrop click */
    closeOnBackdropClick?: boolean;
    
    /** Whether to close on escape key */
    closeOnEscape?: boolean;
    
    /** Custom icon to override default */
    customIcon?: React.ReactNode;
    
    /** Whether to show close button in header */
    showCloseButton?: boolean;
}

/**
 * Icon configuration for each confirm type
 */
const TYPE_CONFIG: Record<ConfirmType, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
    danger: {
        icon: <Trash2 size={24} />,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
    },
    warning: {
        icon: <AlertTriangle size={24} />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20'
    },
    info: {
        icon: <Info size={24} />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
    },
    confirm: {
        icon: <HelpCircle size={24} />,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20'
    }
};

/**
 * Button variant mapping
 */
const BUTTON_VARIANTS: Record<ConfirmButtonVariant, 'primary' | 'danger' | 'secondary'> = {
    primary: 'primary',
    danger: 'danger',
    secondary: 'secondary'
};

/**
 * Confirm Dialog Component
 * 
 * A reusable confirmation dialog with support for different types,
 * custom content, and flexible configuration.
 * 
 * @example
 * ```tsx
 * <Confirm
 *   isOpen={showDeleteConfirm}
 *   title="Delete Track?"
 *   message="This action cannot be undone."
 *   type="danger"
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDeleteConfirm(false)}
 * />
 * ```
 */
export const Confirm: React.FC<ConfirmProps> = ({
    isOpen,
    title,
    message,
    children,
    type = 'confirm',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    showCancel = true,
    isLoading = false,
    confirmDisabled = false,
    onConfirm,
    onCancel,
    onClose,
    className = '',
    closeOnBackdropClick = true,
    closeOnEscape = true,
    customIcon,
    showCloseButton = true
}) => {
    const typeConfig = TYPE_CONFIG[type];

    // Auto-focus confirm button when dialog opens
    useEffect(() => {
        if (isOpen) {
            // Focus will be handled by the button's autoFocus or natural tab order
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (onClose) onClose();
                else onCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose, onCancel]);

    // Handle backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
            if (onClose) onClose();
            else onCancel();
        }
    }, [closeOnBackdropClick, onClose, onCancel]);

    // Handle confirm with loading state
    const handleConfirm = useCallback(async () => {
        if (isLoading || confirmDisabled) return;
        await onConfirm();
    }, [isLoading, confirmDisabled, onConfirm]);

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
        >
            <div 
                className={`
                    w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl 
                    overflow-hidden flex flex-col animate-in zoom-in-95 duration-200
                    ${className}
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`
                            p-2 rounded-lg border ${typeConfig.bgColor} ${typeConfig.borderColor}
                            ${typeConfig.color}
                        `}>
                            {customIcon ?? typeConfig.icon}
                        </div>
                        
                        {/* Title */}
                        <h3 
                            id="confirm-title" 
                            className="text-white font-semibold text-lg"
                        >
                            {title}
                        </h3>
                    </div>
                    
                    {/* Close Button */}
                    {showCloseButton && (
                        <button 
                            onClick={() => { if (onClose) onClose(); else onCancel(); }}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 p-6">
                    {children ?? (
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {message}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex items-center justify-end gap-3">
                    {showCancel && (
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant={BUTTON_VARIANTS[confirmVariant]}
                        size="md"
                        onClick={handleConfirm}
                        disabled={isLoading || confirmDisabled}
                        className="min-w-[80px]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle 
                                        className="opacity-25" 
                                        cx="12" cy="12" r="10" 
                                        stroke="currentColor" 
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path 
                                        className="opacity-75" 
                                        fill="currentColor" 
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                {confirmVariant === 'danger' && <Trash2 size={16} />}
                                {confirmVariant !== 'danger' && type === 'confirm' && <Check size={16} />}
                                {confirmText}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Confirm;