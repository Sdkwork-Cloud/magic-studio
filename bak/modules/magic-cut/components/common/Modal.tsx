
import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    icon?: React.ReactNode;
    showCloseButton?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
    children: React.ReactNode;
}

const SIZE_CLASSES = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]'
};

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    showCloseButton = true,
    size = 'md',
    className = '',
    children
}) => {
    const [domReady, setDomReady] = React.useState(false);

    useEffect(() => {
        setDomReady(true);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen || !domReady) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div 
                className={`
                    w-full ${SIZE_CLASSES[size]} bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col
                    ${className}
                `}
                onClick={e => e.stopPropagation()}
            >
                {(title || showCloseButton) && (
                    <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {icon && (
                                <div className="p-2 bg-[#333] rounded-lg border border-[#444]">
                                    {icon}
                                </div>
                            )}
                            {title && (
                                <h3 className="text-white font-bold text-lg">{title}</h3>
                            )}
                        </div>
                        {showCloseButton && (
                            <button 
                                onClick={onClose} 
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>,
        document.body
    );
};

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger' | 'warning';
    icon?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    icon
}) => {
    const { Button } = React.useMemo(() => require('../../../components/Button/Button'), []);

    const iconBgColor = {
        default: 'bg-[#333]',
        danger: 'bg-red-500/10 border border-red-500/20 text-red-500',
        warning: 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
    }[variant];

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="sm" icon={icon}>
            <div className="p-6">
                {variant === 'warning' && (
                    <div className={`p-2 rounded-lg mb-4 w-fit ${iconBgColor}`}>
                        {icon || <X size={20} />}
                    </div>
                )}
                <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
            </div>
            <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
                <Button 
                    onClick={() => { onConfirm(); onClose(); }} 
                    className={variant === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}
                >
                    {confirmLabel}
                </Button>
            </div>
        </BaseModal>
    );
};
