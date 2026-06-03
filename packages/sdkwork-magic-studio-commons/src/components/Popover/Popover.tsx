import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    className?: string;
    width?: number | string;
    offset?: number;
    align?: 'start' | 'center' | 'end';
}

export const Popover: React.FC<PopoverProps> = ({ 
    isOpen, 
    onClose, 
    triggerRef, 
    children, 
    className = '', 
    width, 
    offset = 8,
    align = 'start' 
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });

    const updatePosition = useCallback(() => {
        if (!isOpen || !triggerRef.current || !contentRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const PADDING = 10;
        
        const unclampedLeft = align === 'center'
            ? triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2)
            : align === 'end'
                ? triggerRect.right - contentRect.width
                : triggerRect.left;
        const maxLeft = Math.max(PADDING, viewportW - contentRect.width - PADDING);
        const left = Math.min(Math.max(unclampedLeft, PADDING), maxLeft);

        const spaceBelow = viewportH - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const needsFlip = spaceBelow < contentRect.height + offset && spaceAbove > spaceBelow;
        const top = needsFlip
            ? triggerRect.top - contentRect.height - offset
            : triggerRect.bottom + offset;
        const originY = needsFlip ? 'bottom' : 'top';

        const triggerCenter = triggerRect.left + (triggerRect.width / 2);
        const originX = triggerCenter < left + (contentRect.width * 0.3)
            ? 'left'
            : triggerCenter > left + (contentRect.width * 0.7)
                ? 'right'
                : 'center';
        
        setStyle({
            top: `${top}px`,
            left: `${left}px`,
            width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
            position: 'fixed',
            zIndex: 9999,
            opacity: 1,
            pointerEvents: 'auto',
            transformOrigin: `${originY} ${originX}`
        });
    }, [align, isOpen, offset, triggerRef, width]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contentRef.current && !contentRef.current.contains(e.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, onClose, triggerRef, updatePosition]);

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            // Double check in next frame for layout shifts
            requestAnimationFrame(updatePosition);
        }
    }, [children, isOpen, updatePosition]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={contentRef}
            className={`
                bg-[#18181b] 
                border border-white/5 
                rounded-xl shadow-2xl
                animate-in fade-in zoom-in-95 duration-100 ease-out
                ${className}
            `}
            style={style}
            onMouseDown={e => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};
