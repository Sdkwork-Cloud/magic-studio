
import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toast: (options: Omit<Toast, 'id'>) => string;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    const icons = {
        success: <CheckCircle size={18} className="text-green-400" />,
        error: <AlertCircle size={18} className="text-red-400" />,
        warning: <AlertTriangle size={18} className="text-yellow-400" />,
        info: <Info size={18} className="text-blue-400" />
    };
    return icons[type];
};

const ToastItem: React.FC<{
    toast: Toast;
    onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(onDismiss, toast.duration || 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onDismiss]);

    const bgColors = {
        success: 'bg-green-900/90 border-green-700',
        error: 'bg-red-900/90 border-red-700',
        warning: 'bg-yellow-900/90 border-yellow-700',
        info: 'bg-blue-900/90 border-blue-700'
    };

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-lg border shadow-lg
                animate-in slide-in-from-right-full duration-300
                ${bgColors[toast.type]}
            `}
        >
            <ToastIcon type={toast.type} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-gray-300 mt-1">{toast.message}</p>
                )}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="text-xs text-blue-300 hover:text-blue-200 mt-2 font-medium"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [domReady, setDomReady] = useState(false);

    useEffect(() => {
        setDomReady(true);
    }, []);

    const toast = useCallback((options: Omit<Toast, 'id'>): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { ...options, id }]);
        return id;
    }, []);

    const success = useCallback((title: string, message?: string) => 
        toast({ type: 'success', title, message }), [toast]);

    const error = useCallback((title: string, message?: string) => 
        toast({ type: 'error', title, message }), [toast]);

    const warning = useCallback((title: string, message?: string) => 
        toast({ type: 'warning', title, message }), [toast]);

    const info = useCallback((title: string, message?: string) => 
        toast({ type: 'info', title, message }), [toast]);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss, dismissAll }}>
            {children}
            {domReady && createPortal(
                <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-auto">
                    {toasts.map(t => (
                        <ToastItem
                            key={t.id}
                            toast={t}
                            onDismiss={() => dismiss(t.id)}
                        />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};
