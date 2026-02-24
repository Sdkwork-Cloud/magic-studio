
import React, { forwardRef } from 'react';

export interface InputFooterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    label: string;
    active?: boolean;
    suffix?: React.ReactNode;
    variant?: 'default' | 'ghost';
}

export const InputFooterButton = forwardRef<HTMLButtonElement, InputFooterButtonProps>(({ 
    icon, label, active, suffix, className = '', variant = 'default', ...props 
}, ref) => {
    
    // Base layout
    const baseStyles = "h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-medium transition-all select-none border whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";
    
    // Active state (e.g. dropdown open)
    const activeStyles = "text-white bg-[#27272a] border-white/10 shadow-sm";
    
    // Inactive state
    const inactiveStyles = "text-gray-400 hover:text-white hover:bg-[#ffffff0a] border-transparent hover:border-white/5";
    
    const disabledStyles = "opacity-50 cursor-not-allowed pointer-events-none";

    return (
        <button 
            ref={ref}
            type="button"
            className={`
                ${baseStyles}
                ${active ? activeStyles : inactiveStyles}
                ${props.disabled ? disabledStyles : ''}
                ${className}
            `}
            {...props}
        >
            {icon && (
                <span className={`transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {icon}
                </span>
            )}
            
            <span>{label}</span>
            
            {suffix && (
                <span className="ml-0.5 opacity-50 transition-opacity group-hover:opacity-100">
                    {suffix}
                </span>
            )}
        </button>
    );
});

InputFooterButton.displayName = 'InputFooterButton';
