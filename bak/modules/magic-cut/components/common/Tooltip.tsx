
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface BaseOverlayProps {
    position?: Position;
    gap?: number;
}

const useOverlayPosition = (position: Position, gap: number) => {
    const triggerRef = useRef<HTMLDivElement>(null);

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current) return { x: 0, y: 0 };

        const rect = triggerRef.current.getBoundingClientRect();

        switch (position) {
            case 'top':
                return { x: rect.left + rect.width / 2, y: rect.top - gap };
            case 'bottom':
                return { x: rect.left + rect.width / 2, y: rect.bottom + gap };
            case 'left':
                return { x: rect.left - gap, y: rect.top + rect.height / 2 };
            case 'right':
                return { x: rect.right + gap, y: rect.top + rect.height / 2 };
            default:
                return { x: rect.left, y: rect.bottom + gap };
        }
    }, [position, gap]);

    const getTransform = () => {
        switch (position) {
            case 'top': return 'translate(-50%, -100%)';
            case 'bottom': return 'translate(-50%, 0)';
            case 'left': return 'translate(-100%, -50%)';
            case 'right': return 'translate(0, -50%)';
            default: return 'translate(-50%, 0)';
        }
    };

    return { triggerRef, calculatePosition, getTransform };
};

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: Position;
    delay?: number;
    disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 300,
    disabled = false
}) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [domReady, setDomReady] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { triggerRef, calculatePosition, getTransform } = useOverlayPosition(position, 8);

    useEffect(() => setDomReady(true), []);

    const showTooltip = useCallback(() => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => {
            setCoords(calculatePosition());
            setVisible(true);
        }, delay);
    }, [delay, disabled, calculatePosition]);

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(false);
    }, []);

    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className="inline-block"
            >
                {children}
            </div>
            {domReady && visible && createPortal(
                <div
                    className="fixed z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-800 border border-gray-700 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: coords.x, top: coords.y, transform: getTransform() }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};

interface PopoverProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: Position;
    trigger?: 'click' | 'hover';
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const Popover: React.FC<PopoverProps> = ({
    content,
    children,
    position = 'bottom',
    trigger = 'click',
    disabled = false,
    onOpenChange
}) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [domReady, setDomReady] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const { triggerRef, calculatePosition, getTransform } = useOverlayPosition(position, 4);

    useEffect(() => setDomReady(true), []);

    const showPopover = useCallback(() => {
        if (disabled) return;
        setCoords(calculatePosition());
        setVisible(true);
        onOpenChange?.(true);
    }, [disabled, calculatePosition, onOpenChange]);

    const hidePopover = useCallback(() => {
        setVisible(false);
        onOpenChange?.(false);
    }, [onOpenChange]);

    useEffect(() => {
        if (!visible) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (triggerRef.current && popoverRef.current &&
                !triggerRef.current.contains(e.target as Node) &&
                !popoverRef.current.contains(e.target as Node)) {
                hidePopover();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') hidePopover();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [visible, hidePopover]);

    const triggerProps = trigger === 'click'
        ? { onClick: visible ? hidePopover : showPopover }
        : { onMouseEnter: showPopover, onMouseLeave: hidePopover };

    return (
        <>
            <div ref={triggerRef} className="inline-block" {...triggerProps}>
                {children}
            </div>
            {domReady && visible && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[9999] bg-[#252526] border border-[#454545] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: coords.x, top: coords.y, transform: getTransform() }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};
