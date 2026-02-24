
import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>;
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
    const [transformOrigin, setTransformOrigin] = useState('top left');

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
    }, [isOpen]);

    const updatePosition = () => {
        if (!isOpen || !triggerRef.current || !contentRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        
        const PADDING = 10;
        
        // --- Horizontal Positioning ---
        let left = 0;
        if (align === 'center') {
            left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
        } else if (align === 'end') {
            left = triggerRect.right - contentRect.width;
        } else {
            left = triggerRect.left;
        }
        
        // Boundary check X
        if (left + contentRect.width > viewportW - PADDING) {
            left = Math.max(PADDING, viewportW - contentRect.width - PADDING);
        }
        if (left < PADDING) {
            left = PADDING;
        }

        // --- Vertical Positioning ---
        let top = 0;
        let originY = 'top';
        let originX = 'left';

        const spaceBelow = viewportH - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        
        // Flip logic: Prefer bottom, but flip if tight
        const needsFlip = spaceBelow < contentRect.height + offset && spaceAbove > spaceBelow;
        
        if (needsFlip) {
            top = triggerRect.top - contentRect.height - offset;
            originY = 'bottom';
        } else {
            top = triggerRect.bottom + offset;
            originY = 'top';
        }

        // Determine X origin for animation based on trigger center relative to content
        const triggerCenter = triggerRect.left + (triggerRect.width / 2);
        if (triggerCenter < left + (contentRect.width * 0.3)) originX = 'left';
        else if (triggerCenter > left + (contentRect.width * 0.7)) originX = 'right';
        else originX = 'center';
        
        setTransformOrigin(`${originY} ${originX}`);
        
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
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            // Double check in next frame for layout shifts
            requestAnimationFrame(updatePosition);
        } else {
            // Reset when closed to ensure clean animation start next time
            setStyle(prev => ({ ...prev, opacity: 0, pointerEvents: 'none' }));
        }
    }, [isOpen, children, width, offset, align]);

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
