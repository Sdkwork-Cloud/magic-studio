
import React, { useRef, useState } from 'react';
import { ChevronDown, RotateCcw, AlertCircle, X, FolderOpen, Copy, Check, File, Eye, EyeOff } from 'lucide-react';
import { platform } from '@sdkwork/react-core';
import { useTranslation } from '@sdkwork/react-i18n';

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
        <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 select-none flex items-center justify-between border-b border-[var(--border-color)] pb-2">
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
                ${isModified ? 'bg-primary-500 opacity-100' : 'bg-transparent opacity-0'}
            `} title="Modified from default" />

            {/* Label Section */}
            {label && (
                <div className={`flex-1 min-w-0 ${isVertical ? 'w-full' : 'max-w-[40%] pt-2'}`}>
                    <label className={labelClassName || `block text-sm font-medium leading-none ${error ? 'text-[var(--status-danger-fg)]' : 'text-[var(--text-primary)]'}`}>
                        {label}
                    </label>
                    {description && <div className="mt-1.5 text-xs text-[var(--text-muted)] leading-relaxed text-balance">{description}</div>}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--status-danger-fg)] font-medium animate-in slide-in-from-left-1">
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
                                transition-all p-1 rounded hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]
                                ${isModified
                                    ? 'text-[var(--text-muted)] hover:text-primary-500 opacity-100'
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
                    relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)]
                    ${props.checked ? 'bg-primary-600' : 'bg-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--text-muted)_55%,var(--bg-panel-strong))]'}
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
                    w-full appearance-none cursor-pointer bg-[var(--bg-panel-strong)] border hover:border-[var(--border-strong)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all shadow-sm h-9
                    ${props.error ? 'border-[var(--status-danger-fg)] focus:border-[var(--status-danger-fg)] focus:ring-[var(--status-danger-fg)]/20' : 'border-[var(--border-color)]'}
                `}
            >
                {props.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover/select:text-[var(--text-secondary)] transition-colors pointer-events-none" />
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
                        w-full bg-[var(--bg-panel-strong)] border hover:border-[var(--border-strong)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-[var(--text-muted)] shadow-sm h-9
                        ${props.fontMono ? 'font-mono text-[13px]' : ''}
                        ${props.error ? 'border-[var(--status-danger-fg)] focus:border-[var(--status-danger-fg)] focus:ring-[var(--status-danger-fg)]/20' : 'border-[var(--border-color)]'}
                        ${isPassword ? 'pr-9' : ''}
                    `}
                />

                {isPassword && (
                     <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}

                {!isPassword && props.value && (
                    <button
                        onClick={() => { props.onChange(''); inputRef.current?.focus(); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover/input:opacity-100 transition-opacity"
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
                    w-full bg-[var(--bg-panel-strong)] border border-[var(--border-color)] rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-[var(--text-muted)] shadow-sm resize-y text-[var(--text-primary)]
                    ${props.fontMono ? 'font-mono text-xs leading-relaxed' : ''}
                    ${props.error ? 'border-[var(--status-danger-fg)]' : 'hover:border-[var(--border-strong)]'}
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
                            w-full bg-[var(--bg-panel-strong)] border text-sm text-[var(--text-primary)] rounded-l-lg px-3 py-2 h-9
                            focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors
                            placeholder:text-[var(--text-muted)] truncate font-mono shadow-sm
                            ${props.error ? 'border-[var(--status-danger-fg)]' : 'border-[var(--border-color)] hover:border-[var(--border-strong)]'}
                            ${isDesktop ? 'cursor-default' : ''}
                        `}
                        title={props.value}
                    />

                    {/* Inner Actions */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/input:opacity-100 transition-opacity bg-[var(--bg-panel-strong)] pl-1">
                        <button
                            onClick={handleCopy}
                        className="p-1 text-[var(--text-muted)] hover:text-primary-500 transition-colors rounded"
                            title={isCopied ? t('common.actions.copied') : t('common.actions.copy')}
                        >
                            {isCopied ? <Check size={12} className="text-[var(--status-success-fg)]" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                {isDesktop && (
                    <button
                        onClick={handleBrowse}
                        className="flex-none flex items-center justify-center px-4 h-9 bg-[var(--bg-panel-subtle)] border-y border-r border-[var(--border-color)] rounded-r-lg hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] text-[var(--text-secondary)] transition-colors shadow-sm z-10"
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
                            w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                            bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]
                            ${props.error ? 'accent-red-500' : ''}
                        `}
                    />
                    {/* Tooltip on Drag */}
                    {isDragging && (
                        <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--border-color)] bg-[var(--text-primary)] px-2 py-1 text-[10px] text-[var(--bg-panel-strong)] shadow-xl animate-in fade-in zoom-in-95 duration-100">
                            {props.value}{props.unit}
                            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-[var(--border-color)] bg-[var(--text-primary)]" />
                        </div>
                    )}
                </div>
                <div className={`
                    text-xs font-mono px-2.5 py-1.5 rounded border min-w-[60px] text-center transition-colors
                    ${props.error
                        ? 'bg-[color-mix(in_srgb,var(--status-danger-fg)_10%,transparent)] text-[var(--status-danger-fg)] border-[color-mix(in_srgb,var(--status-danger-fg)_24%,transparent)]'
                        : 'bg-[var(--bg-panel-strong)] text-[var(--text-primary)] border-[var(--border-color)]'
                    }
                `}>
                    {props.value}{props.unit}
                </div>
            </div>
        </SettingRow>
    );
};
