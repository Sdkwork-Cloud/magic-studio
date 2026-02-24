
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface AccessibilityContextType {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    focusManager: {
        focusNext: () => void;
        focusPrevious: () => void;
        focusFirst: () => void;
        focusLast: () => void;
        trapFocus: (containerRef: React.RefObject<HTMLElement>) => () => void;
    };
    highContrastMode: boolean;
    reducedMotion: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
};

interface AccessibilityProviderProps {
    children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
    const announcerRef = useRef<HTMLDivElement>(null);
    const focusableElementsRef = useRef<HTMLElement[]>([]);
    
    const [highContrastMode] = useState(() => 
        window.matchMedia('(prefers-contrast: more)').matches
    );
    
    const [reducedMotion] = useState(() => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!announcerRef.current) return;
        
        announcerRef.current.setAttribute('aria-live', priority);
        announcerRef.current.textContent = '';
        
        requestAnimationFrame(() => {
            if (announcerRef.current) {
                announcerRef.current.textContent = message;
            }
        });
    }, []);

    const updateFocusableElements = useCallback(() => {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');
        
        focusableElementsRef.current = Array.from(
            document.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter(el => el.offsetParent !== null);
    }, []);

    const focusManager = {
        focusNext: useCallback(() => {
            updateFocusableElements();
            const elements = focusableElementsRef.current;
            const current = document.activeElement as HTMLElement;
            const currentIndex = elements.indexOf(current);
            
            if (currentIndex < elements.length - 1) {
                elements[currentIndex + 1].focus();
            } else if (elements.length > 0) {
                elements[0].focus();
            }
        }, [updateFocusableElements]),

        focusPrevious: useCallback(() => {
            updateFocusableElements();
            const elements = focusableElementsRef.current;
            const current = document.activeElement as HTMLElement;
            const currentIndex = elements.indexOf(current);
            
            if (currentIndex > 0) {
                elements[currentIndex - 1].focus();
            } else if (elements.length > 0) {
                elements[elements.length - 1].focus();
            }
        }, [updateFocusableElements]),

        focusFirst: useCallback(() => {
            updateFocusableElements();
            const elements = focusableElementsRef.current;
            if (elements.length > 0) {
                elements[0].focus();
            }
        }, [updateFocusableElements]),

        focusLast: useCallback(() => {
            updateFocusableElements();
            const elements = focusableElementsRef.current;
            if (elements.length > 0) {
                elements[elements.length - 1].focus();
            }
        }, [updateFocusableElements]),

        trapFocus: useCallback((containerRef: React.RefObject<HTMLElement>) => {
            const container = containerRef.current;
            if (!container) return () => {};

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                const focusableElements = container.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
                );
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            };

            container.addEventListener('keydown', handleKeyDown);
            return () => container.removeEventListener('keydown', handleKeyDown);
        }, [])
    };

    return (
        <AccessibilityContext.Provider value={{ announce, focusManager, highContrastMode, reducedMotion }}>
            {children}
            <div
                ref={announcerRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0
                }}
            />
        </AccessibilityContext.Provider>
    );
};

export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean = true) {
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = container.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [containerRef, isActive]);
}

export function useAnnounce() {
    const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        let el = document.getElementById('a11y-announcer');
        if (!el) {
            el = document.createElement('div');
            el.id = 'a11y-announcer';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
            el.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;
            document.body.appendChild(el);
        }
        setAnnouncer(el);

        return () => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        };
    }, []);

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!announcer) return;
        
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = '';
        
        requestAnimationFrame(() => {
            if (announcer) {
                announcer.textContent = message;
            }
        });
    }, [announcer]);

    return announce;
}

export function useKeyboardNavigation({
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    enabled = true
}: {
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onEnter?: () => void;
    onEscape?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
    onPageUp?: () => void;
    onPageDown?: () => void;
    enabled?: boolean;
}) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                    onArrowUp?.();
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    onArrowDown?.();
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    onArrowLeft?.();
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    onArrowRight?.();
                    e.preventDefault();
                    break;
                case 'Enter':
                    onEnter?.();
                    break;
                case 'Escape':
                    onEscape?.();
                    break;
                case 'Home':
                    onHome?.();
                    e.preventDefault();
                    break;
                case 'End':
                    onEnd?.();
                    e.preventDefault();
                    break;
                case 'PageUp':
                    onPageUp?.();
                    e.preventDefault();
                    break;
                case 'PageDown':
                    onPageDown?.();
                    e.preventDefault();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onHome, onEnd, onPageUp, onPageDown]);
}
