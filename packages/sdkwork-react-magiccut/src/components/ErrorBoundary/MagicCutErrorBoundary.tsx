
import { ErrorBoundary, ErrorBoundaryProps, logger } from '@sdkwork/react-commons'
import React, { ReactNode } from 'react';
;
;

export interface MagicCutErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback'> {
    children: ReactNode;
    componentName?: string;
}

/**
 * MagicCut-specific Error Boundary
 * Provides specialized error handling for MagicCut components
 * with module-specific fallback UI and error reporting
 */
export const MagicCutErrorBoundary: React.FC<MagicCutErrorBoundaryProps> = ({
    children,
    componentName = 'MagicCut Component',
    onError,
    ...props
}) => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo): void => {
        // Log with MagicCut-specific context
        logger.error(`[${componentName}] Error caught:`, error.message, {
            componentStack: errorInfo.componentStack,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Call optional custom error handler
        if (onError) {
            onError(error, errorInfo);
        }
    };

    return (
        <ErrorBoundary
            {...props}
            onError={handleError}
            fallback={
                <MagicCutErrorFallback
                    componentName={componentName}
                />
            }
        >
            {children}
        </ErrorBoundary>
    );
};

/**
 * MagicCut-specific error fallback UI
 */
interface MagicCutErrorFallbackProps {
    componentName: string;
}

const MagicCutErrorFallback: React.FC<MagicCutErrorFallbackProps> = ({ componentName }) => {
    const handleReload = (): void => {
        window.location.reload();
    };

    const handleGoBack = (): void => {
        window.history.back();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-[#1e1e1e] border border-red-500/30 rounded-xl m-4">
            {/* Icon */}
            <div className="w-16 h-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
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
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-2">
                {componentName} Error
            </h3>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
                An unexpected error occurred in the video editor. Your project data is safe, but you may need to reload the page to continue editing.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                    onClick={handleReload}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reload Editor
                </button>
                <button
                    onClick={handleGoBack}
                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Go Back
                </button>
            </div>

            {/* Help Text */}
            <p className="text-gray-500 text-xs mt-6 text-center">
                If the problem persists, please save your work and contact support.
            </p>
        </div>
    );
};

export default MagicCutErrorBoundary;

