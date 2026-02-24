
import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, RotateCcw, Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react';

// --- Types ---
export interface PropertySectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    onReset?: () => void;
    className?: string;
    enabled?: boolean;
    onToggle?: (enabled: boolean) => void;
}

export interface ScrubbableInputProps {
    label?: React.ReactNode;
    value: number;
    onChange: (val: number) => void;
    step?: number;
    min?: number;
    max?: number;
    suffix?: string;
    icon?: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
}

export interface ColorPickerProps {
    label: string;
    value: string; // Hex or Rgba
    onChange: (val: string) => void;
    opacity?: number; // 0-1
    onOpacityChange?: (val: number) => void;
}

export interface DropdownProps {
    label?: string;
    value: string;
    options: { label: string; value: string; icon?: React.ReactNode }[];
    onChange: (val: string) => void;
    className?: string;
}

export interface ActionButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
}

export interface SliderRowProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
}

// --- Components ---

export const PropertySection: React.FC<PropertySectionProps> = ({ 
    title, children, defaultOpen = true, onReset, className = '', enabled, onToggle
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`border-b border-[#1f1f22] last:border-0 ${className}`}>
            <div 
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#1f1f22] transition-colors group select-none" 
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    <ChevronRight 
                        size={12} 
                        className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${enabled === false ? 'text-gray-600' : 'text-gray-400'}`}>
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {onToggle !== undefined && (
                        <button 
                            onClick={() => onToggle(!enabled)}
                            className={`p-1 rounded transition-colors ${enabled ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 hover:text-gray-500'}`}
                            title={enabled ? "Enabled" : "Disabled"}
                        >
                            {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                    )}
                    {onReset && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onReset(); }} 
                            className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#2a2a2d]"
                            title="Reset to default"
                        >
                            <RotateCcw size={10} />
                        </button>
                    )}
                </div>
            </div>
            {isOpen && (enabled !== false) && (
                <div className="px-3 pb-3 pt-1 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-100">
                    {children}
                </div>
            )}
        </div>
    );
};

export const ScrubbableInput: React.FC<ScrubbableInputProps> = ({ 
    label, value, onChange, step = 1, min = -Infinity, max = Infinity, suffix = '', icon, className = '', fullWidth
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const startVal = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); 
        startX.current = e.clientX;
        startVal.current = value;
        setIsDragging(true);
        
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX.current;
        let multiplier = 1;
        if (ev.shiftKey) multiplier = 0.1;
        if (ev.altKey) multiplier = 10;
        
        let newVal = startVal.current + (dx * step * multiplier);
        newVal = Math.round(newVal * 1000) / 1000;
        
        if (newVal < min) newVal = min;
        if (newVal > max) newVal = max;
        
        onChange(newVal);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) onChange(val);
    };

    return (
        <div className={`flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-md px-2 py-1 group hover:border-[#3f3f46] focus-within:border-blue-500/50 transition-colors ${fullWidth ? 'w-full' : ''} ${className}`}>
            {(label || icon) && (
                <div 
                    className={`flex items-center gap-1.5 cursor-ew-resize select-none shrink-0 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                    onMouseDown={handleMouseDown}
                    title="Drag to adjust"
                >
                    {icon && <span className="opacity-80">{icon}</span>}
                    {label && <span className="text-[10px] font-medium uppercase tracking-wide min-w-[10px]">{label}</span>}
                </div>
            )}
            
            <div className="flex-1 min-w-0 flex items-center justify-end gap-0.5">
                <input
                    type="number"
                    className="w-full bg-transparent text-[11px] text-gray-200 outline-none font-mono text-right appearance-none p-0"
                    value={value}
                    onChange={handleChange}
                    step={step}
                />
                {suffix && <span className="text-[9px] text-gray-600 font-mono select-none shrink-0">{suffix}</span>}
            </div>
        </div>
    );
};

export const SliderRow: React.FC<SliderRowProps> = ({ 
    label, value, onChange, min = 0, max = 100, step = 1, defaultValue
}) => {
    return (
        <div className="flex items-center gap-3 h-6">
            <span className="text-[10px] text-gray-400 w-16 truncate">{label}</span>
            <div className="flex-1 relative h-full flex items-center group">
                {/* Track */}
                <div className="absolute left-0 right-0 h-1 bg-[#27272a] rounded-full overflow-hidden">
                    {/* Fill from center if min < 0, else from left */}
                    <div 
                        className="absolute h-full bg-blue-600/50 group-hover:bg-blue-500 transition-colors"
                        style={{ 
                            left: min < 0 ? '50%' : '0%',
                            width: `${Math.abs(value) / (max - min) * 100}%`, // Rough visual approx
                            transform: min < 0 && value < 0 ? 'translateX(-100%)' : 'none'
                        }}
                    />
                </div>
                <input 
                    type="range"
                    min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-full opacity-0 cursor-pointer absolute z-10"
                />
                {/* Thumb Visual */}
                <div 
                    className="absolute w-2.5 h-2.5 bg-gray-400 group-hover:bg-white rounded-full shadow-sm pointer-events-none transition-all"
                    style={{ 
                        left: `${((value - min) / (max - min)) * 100}%`,
                        transform: 'translateX(-50%)'
                    }}
                />
            </div>
            <div 
                className={`text-[9px] font-mono w-8 text-right cursor-pointer hover:text-blue-400 ${value !== defaultValue ? 'text-blue-300' : 'text-gray-500'}`}
                onClick={() => defaultValue !== undefined && onChange(defaultValue)}
            >
                {Math.round(value * 100) / 100}
            </div>
        </div>
    );
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, opacity, onOpacityChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label className="text-[11px] text-gray-400 font-medium">{label}</label>
                <div className="flex items-center gap-1.5">
                    <div 
                        className="w-8 h-5 rounded border border-white/10 cursor-pointer relative overflow-hidden shadow-sm hover:scale-105 transition-transform"
                        style={{ backgroundColor: value }}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input 
                            ref={inputRef}
                            type="color" 
                            value={value} 
                            onChange={(e) => onChange(e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                    </div>
                    
                    <div className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 focus-within:border-blue-500/50">
                        <span className="text-[10px] text-gray-500 mr-0.5">#</span>
                        <input 
                            type="text" 
                            value={value.replace('#', '')}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                    onChange('#' + val);
                                }
                            }}
                            className="w-12 bg-transparent text-[10px] font-mono text-gray-300 outline-none uppercase"
                            maxLength={6}
                        />
                    </div>
                </div>
            </div>

            {onOpacityChange && opacity !== undefined && (
                <SliderRow 
                    label="Opacity" 
                    value={opacity} 
                    onChange={onOpacityChange} 
                    min={0} max={1} step={0.01} 
                    defaultValue={1}
                />
            )}
        </div>
    );
};

export const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, className }) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[11px] text-gray-400 font-medium">{label}</label>}
            <div className="relative group w-full">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none bg-[#09090b] border border-[#27272a] rounded-md px-2 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500/50 hover:border-[#3f3f46] cursor-pointer"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-gray-300" />
            </div>
        </div>
    );
};

export const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onClick, isLoading, variant = 'secondary', className }) => {
    let bgClass = "bg-[#252526] hover:bg-[#333] border-[#333] text-gray-300 hover:text-white";
    if (variant === 'primary') bgClass = "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-sm";
    if (variant === 'danger') bgClass = "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400";

    return (
        <button 
            onClick={onClick}
            disabled={isLoading}
            className={`
                flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
                ${bgClass}
                ${className}
            `}
        >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : React.cloneElement(icon as any, { size: 12 })}
            <span>{label}</span>
        </button>
    );
};

export const SegmentedControl: React.FC<{ 
    options: { value: string; icon?: React.ReactNode; label?: string }[], 
    value: string, 
    onChange: (val: string) => void 
}> = ({ options, value, onChange }) => (
    <div className="flex bg-[#09090b] rounded-md border border-[#27272a] p-0.5 w-full">
        {options.map((opt) => (
            <button 
                key={opt.value}
                onClick={() => onChange(opt.value)} 
                className={`
                    flex-1 flex justify-center items-center py-1 rounded-[3px] transition-all text-[10px] font-medium gap-1.5
                    ${value === opt.value 
                        ? 'bg-[#27272a] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
                    }
                `}
                title={opt.label}
            >
                {opt.icon}
                {opt.label}
            </button>
        ))}
    </div>
);

