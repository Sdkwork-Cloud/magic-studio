
import { useState, useCallback } from 'react';
import type { ConfirmType, ConfirmButtonVariant } from './Confirm';

/**
 * Options for useConfirm hook
 */
export interface UseConfirmOptions {
    title: string;
    message?: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: ConfirmButtonVariant;
    showCancel?: boolean;
}

/**
 * Return type for useConfirm hook
 */
export interface UseConfirmReturn {
    /** Whether the confirm dialog is open */
    isOpen: boolean;
    /** Open the confirm dialog with options */
    confirm: (options: UseConfirmOptions) => Promise<boolean>;
    /** Close the confirm dialog */
    close: () => void;
    /** Current options for the confirm dialog */
    options: UseConfirmOptions | null;
    /** Handle confirm action */
    handleConfirm: () => void;
    /** Handle cancel action */
    handleCancel: () => void;
}

/**
 * Hook for managing confirm dialog state
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
 * 
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Item?',
 *       message: 'This action cannot be undone.',
 *       type: 'danger',
 *       confirmText: 'Delete'
 *     });
 * 
 *     if (confirmed) {
 *       // Perform delete
 *     }
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Delete</button>
 *       {isOpen && options && (
 *         <Confirm
 *           isOpen={isOpen}
 *           {...options}
 *           onConfirm={handleConfirm}
 *           onCancel={handleCancel}
 *         />
 *       )}
 *     </>
 *   );
 * };
 * ```
 */
export const useConfirm = (): UseConfirmReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<UseConfirmOptions | null>(null);
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((newOptions: UseConfirmOptions): Promise<boolean> => {
        setOptions(newOptions);
        setIsOpen(true);
        
        return new Promise((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setOptions(null);
        setResolveRef(null);
    }, []);

    const handleConfirm = useCallback(() => {
        resolveRef?.(true);
        close();
    }, [resolveRef, close]);

    const handleCancel = useCallback(() => {
        resolveRef?.(false);
        close();
    }, [resolveRef, close]);

    return {
        isOpen,
        confirm,
        close,
        options,
        handleConfirm,
        handleCancel
    };
};

export default useConfirm;
