
import React, { useRef, useState } from 'react';
import { ChevronDown, RotateCcw, AlertCircle, X, FolderOpen, Copy, Check, File, Eye, EyeOff } from 'lucide-react';
import { platform } from 'sdkwork-react-core';
import { useTranslation } from 'sdkwork-react-i18n';

// --- Types ---
interface BaseProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
    isModified?: boolean;
    onReset?: () => void;
    error?: string | null;
    className?: string;
    /** Controls layout direction. Default is 'horizontal' */
    layout?: 'horizontal' | 'vertical'; 
    /** If true, the control fills the available width */
    fullWidth?: boolean;
    /** Custom class for the label */
    labelClassName?: string;
}

// --- Section Wrapper ---
export const SettingsSection: React.FC<{ title: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${className || ''}`}>
        <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 select-none flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d2d] pb-2">
            {title}
        </h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

// --- Row Wrapper ---
const SettingRow: React.FC<BaseProps & { children: React.ReactNode }> = ({ 
    label, description, children, disabled, isModified, onReset, error, layout = 'horizontal', fullWidth, labelClassName 
}) => {
    const isVertical = layout === 'vertical' || fullWidth;

    return (
        <div className={`
            group relative p-1 rounded-lg transition-all duration-200
            ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}
            ${isVertical ? 'flex flex-col gap-2' : 'flex items-start justify-between gap-6'}
        `}>
            {/* Modified Indicator */}
            <div className={`
                absolute -left-2 top-2 bottom-2 w-[3px] rounded-r transition-opacity duration-300
                ${isModified ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0'}
            `} title="Modified from default" />

            {/* Label Section */}
            {label && (
                <div className={`flex-1 min-w-0 ${isVertical ? 'w-full' : 'max-w-[40%] pt-2'}`}>
                    <label className={labelClassName || `block text-sm font-medium leading-none ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {label}
                    </label>
                    {description && <div className="mt-1.5 text-xs text-gray-500 leading-relaxed text-balance">{description}</div>}
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium animate-in slide-in-from-left-1">
                            <AlertCircle size={12} />
                            {error}
                        </div>
                    )}
                </div>
            )}
            
            {/* Control Section */}
            <div className={`
                flex items-center gap-2
                ${isVertical ? 'w-full' : 'flex-1 justify-end min-w-0'}
            `}>
                <div className={`relative ${fullWidth || isVertical ? 'w-full' : 'w-auto min-w-[200px]'}`}>
                    {children}
                </div>
                
                {/* Reset Button (Only show if not full width/vertical layout to avoid layout shifts, or handle differently) */}
                {!fullWidth && (
                    <div className="w-6 h-6 flex items-center justify-center flex-none">
                        <button 
                            onClick={onReset}
                            disabled={!isModified}
                            className={`
                                transition-all p-1 rounded hover:bg-gray-200 dark:hover:bg-[#333]
                                ${isModified 
                                    ? 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 opacity-100' 
                                    : 'opacity-0 pointer-events-none'
                                }
                            `}
                            title="Reset to default"
                            aria-label="Reset setting"
                        >
                            <RotateCcw size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Toggle Switch ---
interface ToggleProps extends BaseProps {
    checked: boolean;
    onChange: (val: boolean) => void;
}
export const SettingToggle: React.FC<ToggleProps> = (props) => (
    <SettingRow {...props}>
        <div className="flex justify-end w-full">
            <button
                onClick={() => props.onChange(!props.checked)}
                role="switch"
                aria-checked={props.checked}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e]
                    ${props.checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-[#3f3f46] hover:bg-gray-400 dark:hover:bg-[#4a4a52]'}
                `}
            >
                <span className="sr-only">Use setting</span>
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm
                        ${props.checked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    </SettingRow>
);

// --- Select Dropdown ---
interface SelectProps extends BaseProps {
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
}
export const SettingSelect: React.FC<SelectProps> = (props) => (
    <SettingRow {...props}>
        <div className="relative group/select w-full">
            <select
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                className={`
                    w-full appearance-none cursor-pointer bg-gray-50 dark:bg-[#252526] border hover:border-gray-400 dark:hover:border-[#52525b] text-sm text-gray-900 dark:text-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm h-9
                    ${props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#333]'}
                `}
            >
                {props.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover/select:text-gray-600 dark:group-hover/select:text-gray-300 transition-colors pointer-events-none" />
        </div>
    </SettingRow>
);

// --- Text Input ---
interface InputProps extends BaseProps {
    value: string;
    placeholder?: string;
    type?: 'text' | 'password' | 'number';
    onChange: (val: string) => void;
    fontMono?: boolean;
    autoFocus?: boolean;
}
export const SettingInput: React.FC<InputProps> = (props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === 'password';
    
    // Auto-detect layout: if placeholder is long or it's a key, prefer full width
    const effectiveLayout = props.layout || (props.fontMono || isPassword ? 'vertical' : 'horizontal');
    const effectiveFullWidth = props.fullWidth ?? (effectiveLayout === 'vertical');

    return (
        <SettingRow {...props} layout={effectiveLayout} fullWidth={effectiveFullWidth}>
            <div className="relative group/input w-full">
                <input
                    ref={inputRef}
                    autoFocus={props.autoFocus}
                    type={isPassword && !showPassword ? 'password' : 'text'}
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                    placeholder={props.placeholder}
                    className={`
                        w-full bg-gray-50 dark:bg-[#252526] border hover:border-gray-400 dark:hover:border-[#52525b] text-sm text-gray-900 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-400 dark:placeholder-gray-600 shadow-sm h-9
                        ${props.fontMono ? 'font-mono text-[13px]' : ''}
                        ${props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#333]'}
                        ${isPassword ? 'pr-9' : ''}
                    `}
                />
                
                {isPassword && (
                     <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}

                {!isPassword && props.value && (
                    <button 
                        onClick={() => { props.onChange(''); inputRef.current?.focus(); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover/input:opacity-100 transition-opacity"
                        tabIndex={-1}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        </SettingRow>
    );
};

// --- Text Area ---
interface TextAreaProps extends BaseProps {
    value: string;
    placeholder?: string;
    rows?: number;
    fontMono?: boolean;
    onChange: (val: string) => void;
}
export const SettingTextArea: React.FC<TextAreaProps> = (props) => {
    return (
        <SettingRow {...props} layout="vertical" fullWidth>
             <textarea 
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                rows={props.rows || 3}
                placeholder={props.placeholder}
                className={`
                    w-full bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-400 dark:placeholder-gray-600 shadow-sm resize-y text-gray-900 dark:text-gray-200
                    ${props.fontMono ? 'font-mono text-xs leading-relaxed' : ''}
                    ${props.error ? 'border-red-500' : 'hover:border-gray-400 dark:hover:border-[#52525b]'}
                `}
            />
        </SettingRow>
    );
};

// --- Standardized Path Input ---
interface PathInputProps extends BaseProps {
    value: string;
    onChange: (val: string) => void;
    type: 'file' | 'folder';
    placeholder?: string;
}

export const SettingPathInput: React.FC<PathInputProps> = (props) => {
    const { t } = useTranslation();
    const isDesktop = platform.getPlatform() === 'desktop';
    const [isCopied, setIsCopied] = useState(false);

    const handleBrowse = async () => {
        let result: string | null = null;
        try {
            if (props.type === 'folder') {
                result = await platform.selectDir();
            } else {
                const files = await platform.selectFile({ multiple: false });
                if (files.length > 0) result = files[0];
            }
            if (result) props.onChange(result);
        } catch (e) {
            console.error('Failed to select path', e);
        }
    };

    const handleCopy = () => {
        if (!props.value) return;
        platform.copy(props.value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <SettingRow {...props} layout="vertical" fullWidth>
            <div className="flex items-center gap-0 w-full">
                <div className="relative flex-1 group/input min-w-0">
                    <input
                        type="text"
                        value={props.value}
                        onChange={isDesktop ? undefined : (e) => props.onChange(e.target.value)}
                        readOnly={isDesktop}
                        placeholder={props.placeholder}
                        className={`
                            w-full bg-gray-50 dark:bg-[#252526] border text-sm text-gray-900 dark:text-gray-200 rounded-l-lg px-3 py-2 h-9
                            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors 
                            placeholder-gray-400 dark:placeholder-gray-600 truncate font-mono shadow-sm
                            ${props.error ? 'border-red-500' : 'border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#52525b]'}
                            ${isDesktop ? 'cursor-default' : ''}
                        `}
                        title={props.value}
                    />
                    
                    {/* Inner Actions */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/input:opacity-100 transition-opacity bg-gray-50 dark:bg-[#252526] pl-1">
                        <button 
                            onClick={handleCopy}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded"
                            title={isCopied ? t('common.actions.copied') : t('common.actions.copy')}
                        >
                            {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                {isDesktop && (
                    <button
                        onClick={handleBrowse}
                        className="flex-none flex items-center justify-center px-4 h-9 bg-gray-100 dark:bg-[#2d2d2d] border-y border-r border-gray-200 dark:border-[#333] rounded-r-lg hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-gray-600 dark:text-gray-300 transition-colors shadow-sm z-10"
                        title={t('common.actions.browse')}
                    >
                        {props.type === 'folder' ? <FolderOpen size={14} /> : <File size={14} />}
                    </button>
                )}
            </div>
        </SettingRow>
    );
};

// --- Slider ---
interface SliderProps extends BaseProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
}
export const SettingSlider: React.FC<SliderProps> = (props) => {
    const [isDragging, setIsDragging] = useState(false);
    
    return (
        <SettingRow {...props}>
            <div className="flex items-center gap-4 w-full">
                <div className="relative h-6 flex items-center flex-1">
                    <input
                        type="range"
                        min={props.min}
                        max={props.max}
                        step={props.step || 1}
                        value={props.value}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        onTouchEnd={() => setIsDragging(false)}
                        onChange={(e) => props.onChange(Number(e.target.value))}
                        className={`
                            w-full h-1.5 bg-gray-200 dark:bg-[#3f3f46] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                            ${props.error ? 'accent-red-500' : ''}
                        `}
                    />
                    {/* Tooltip on Drag */}
                    {isDragging && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap z-10">
                            {props.value}{props.unit}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                    )}
                </div>
                <div className={`
                    text-xs font-mono px-2.5 py-1.5 rounded border min-w-[60px] text-center transition-colors
                    ${props.error 
                        ? 'bg-red-500/10 text-red-500 border-red-500/30' 
                        : 'bg-white dark:bg-[#252526] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333]'
                    }
                `}>
                    {props.value}{props.unit}
                </div>
            </div>
        </SettingRow>
    );
};
