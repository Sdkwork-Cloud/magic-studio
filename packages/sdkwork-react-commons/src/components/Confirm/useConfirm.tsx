import React, { useState, useCallback } from 'react';
import { Confirm, type ConfirmProps, type ConfirmType, type ConfirmButtonVariant } from './Confirm';

export interface UseConfirmOptions {
    title?: string;
    message?: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: ConfirmButtonVariant;
    showCancel?: boolean;
    customIcon?: React.ReactNode;
}

export interface UseConfirmReturn {
    confirm: (options: UseConfirmOptions) => Promise<boolean>;
    ConfirmDialog: React.FC;
}

interface PendingConfirm {
    resolve: (value: boolean) => void;
    options: UseConfirmOptions;
}

export const useConfirm = (): UseConfirmReturn => {
    const [pending, setPending] = useState<PendingConfirm | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<UseConfirmOptions>({});

    const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(options);
            setPending({ resolve, options });
            setIsOpen(true);
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        if (pending) {
            pending.resolve(true);
            setPending(null);
        }
        setIsOpen(false);
    }, [pending]);

    const handleCancel = useCallback(() => {
        if (pending) {
            pending.resolve(false);
            setPending(null);
        }
        setIsOpen(false);
    }, [pending]);

    const ConfirmDialog: React.FC = () => {
        if (!isOpen) return null;

        return (
            <Confirm
                isOpen={isOpen}
                title={options.title || 'Confirm'}
                message={options.message}
                type={options.type || 'confirm'}
                confirmText={options.confirmText || 'Confirm'}
                cancelText={options.cancelText || 'Cancel'}
                confirmVariant={options.confirmVariant || 'primary'}
                showCancel={options.showCancel ?? true}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        );
    };

    return { confirm, ConfirmDialog };
};

export type { ConfirmProps } from './Confirm';
