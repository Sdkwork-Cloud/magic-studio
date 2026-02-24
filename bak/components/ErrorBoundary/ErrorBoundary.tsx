import React, { ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';

export interface ErrorBoundaryProps {
    children?: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Universal Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the application
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    constructor(props: ErrorBoundaryProps) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to logger
        logger.error('ErrorBoundary caught an error:', error.message, {
            componentStack: errorInfo.componentStack,
            stack: error.stack
        });

        // Update state with error info
        this.setState({
            errorInfo
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps): void {
        const { resetOnPropsChange, resetKeys } = this.props;
        const { hasError } = this.state;

        if (!hasError) return;

        // Reset error state when resetKeys change
        if (resetKeys && resetKeys.length > 0) {
            const hasResetKeyChanged = resetKeys.some(
                (key, index) => key !== prevProps.resetKeys?.[index]
            );
            if (hasResetKeyChanged) {
                this.resetError();
            }
        }

        // Reset error state when any prop changes (if enabled)
        if (resetOnPropsChange && prevProps !== this.props) {
            this.resetError();
        }
    }

    resetError = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Render custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Render default error UI
            return <DefaultErrorFallback error={error} onReset={this.resetError} />;
        }

        return children;
    }
}

/**
 * Default error fallback UI
 */
interface DefaultErrorFallbackProps {
    error: Error | null;
    onReset: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, onReset }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-[#1e1e1e] border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
                <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
                <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
            </div>

            <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
                An error occurred in this component. You can try to recover or refresh the page.
            </p>

            {error && (
                <div className="w-full max-w-md mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded overflow-auto">
                    <p className="text-red-400 text-xs font-mono break-all">
                        {error.message}
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                >
                    Try Again
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
};

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
    const WrappedComponent: React.FC<P> = (props) => {
        return (
            <ErrorBoundary {...errorBoundaryProps}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

export default ErrorBoundary;