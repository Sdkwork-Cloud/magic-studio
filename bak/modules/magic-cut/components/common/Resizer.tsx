
import React, { memo, useCallback } from 'react';

export interface ResizerProps {
    orientation: 'vertical' | 'horizontal';
    onMouseDown?: (e: React.MouseEvent) => void;
    className?: string;
}

export const Resizer: React.FC<ResizerProps> = memo(({ orientation, onMouseDown, className = '' }) => {
    return (
        <div
            className={`
                flex-none z-50 flex items-center justify-center transition-colors hover:bg-blue-600/50 delay-75
                ${orientation === 'vertical' ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'}
                ${className}
            `}
            onMouseDown={onMouseDown}
        >
            <div className={`bg-[#1a1a1a] ${orientation === 'vertical' ? 'w-[1px] h-full' : 'h-[1px] w-full'}`} />
        </div>
    );
});

Resizer.displayName = 'Resizer';
