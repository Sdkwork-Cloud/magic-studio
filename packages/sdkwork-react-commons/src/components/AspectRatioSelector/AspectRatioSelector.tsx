import React, { useState, useRef } from 'react';
import { ChevronDown, Monitor, Smartphone, Square, LayoutTemplate, Film, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Popover } from '../Popover';
import { useTranslation } from '@sdkwork/react-i18n';

export type AspectRatio = string;
export type Resolution = string;

interface SelectorOption {
    label: string;
    value: string;
}

interface AspectRatioSelectorProps {
    value: AspectRatio;
    onChange: (ratio: AspectRatio) => void;
    resolution?: Resolution;
    onResolutionChange?: (res: Resolution) => void;
    aspectRatioOptions?: SelectorOption[];
    resolutionOptions?: SelectorOption[];
    disabled?: boolean;
    className?: string;
    
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

const RATIO_CONFIG: Record<AspectRatio, { label: string, w: number, h: number, icon: any }> = {
    '21:9': { label: '21:9', w: 21, h: 9, icon: Film },
    '16:9': { label: '16:9', w: 16, h: 9, icon: Monitor },
    '3:2':  { label: '3:2',  w: 3,  h: 2, icon: LayoutTemplate },
    '4:3':  { label: '4:3',  w: 4,  h: 3, icon: LayoutTemplate },
    '1:1':  { label: '1:1',  w: 1,  h: 1, icon: Square },
    '3:4':  { label: '3:4',  w: 3,  h: 4, icon: LayoutTemplate },
    '2:3':  { label: '2:3',  w: 2,  h: 3, icon: LayoutTemplate },
    '9:16': { label: '9:16', w: 9,  h: 16, icon: Smartphone },
};

const DEFAULT_RESOLUTION_OPTIONS: SelectorOption[] = [
    { label: '2K', value: '2k' },
    { label: '4K', value: '4k' },
];

interface ResolutionProfile {
    shortEdge: number;
    longEdge: number;
}

const parseAspectRatio = (ratio: string): { label: string; w: number; h: number; icon: any } => {
    const normalized = typeof ratio === 'string' ? ratio.trim() : '';
    if (normalized in RATIO_CONFIG) {
        return RATIO_CONFIG[normalized as keyof typeof RATIO_CONFIG];
    }

    const [wToken, hToken] = normalized.split(':');
    const w = Number(wToken);
    const h = Number(hToken);
    if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) {
        const icon = w > h ? Monitor : h > w ? Smartphone : Square;
        return {
            label: normalized,
            w,
            h,
            icon,
        };
    }

    return RATIO_CONFIG['16:9'];
};

const RESOLUTION_PROFILE_MAP: Record<string, ResolutionProfile> = {
    '480p': { shortEdge: 480, longEdge: 854 },
    '720p': { shortEdge: 720, longEdge: 1280 },
    '1080p': { shortEdge: 1080, longEdge: 1920 },
    '1440p': { shortEdge: 1440, longEdge: 2560 },
    '2k': { shortEdge: 1440, longEdge: 2560 },
    '2160p': { shortEdge: 2160, longEdge: 3840 },
    '4k': { shortEdge: 2160, longEdge: 3840 },
    '4320p': { shortEdge: 4320, longEdge: 7680 },
    '8k': { shortEdge: 4320, longEdge: 7680 },
};

const resolveResolutionProfile = (resolution: string): ResolutionProfile => {
    const normalized = resolution.trim().toLowerCase();
    if (!normalized) {
        return { shortEdge: 1440, longEdge: 2560 };
    }
    if (RESOLUTION_PROFILE_MAP[normalized]) {
        return RESOLUTION_PROFILE_MAP[normalized];
    }

    const match = normalized.match(/^(\d+)\s*(p|k)$/);
    if (!match) {
        return { shortEdge: 1440, longEdge: 2560 };
    }

    const numeric = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return { shortEdge: 1440, longEdge: 2560 };
    }

    if (unit === 'p') {
        return {
            shortEdge: numeric,
            longEdge: Math.round(numeric * 16 / 9),
        };
    }

    const longEdge = numeric * 1280;
    return {
        shortEdge: Math.round(longEdge * 9 / 16),
        longEdge,
    };
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
    value,
    onChange,
    resolution = '2k',
    onResolutionChange,
    aspectRatioOptions,
    resolutionOptions = DEFAULT_RESOLUTION_OPTIONS,
    disabled = false,
    className = '',
    isOpen: controlledIsOpen,
    onToggle
}) => {
    const { t } = useTranslation();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isMenuOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    
    const triggerRef = useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
        if (disabled) return;
        const newState = !isMenuOpen;
        if (onToggle) onToggle(newState);
        else setInternalIsOpen(newState);
    };

    const closeMenu = () => {
        if (onToggle) onToggle(false);
        else setInternalIsOpen(false);
    };

    const config = parseAspectRatio(value);
    const resolutionProfile = resolveResolutionProfile(resolution);
    
    const widthPx = config.w >= config.h
        ? Math.round(resolutionProfile.shortEdge * (config.w / config.h))
        : resolutionProfile.shortEdge;
    const heightPx = config.h > config.w
        ? Math.round(resolutionProfile.shortEdge * (config.h / config.w))
        : resolutionProfile.shortEdge;
    const ratioChoices = (aspectRatioOptions && aspectRatioOptions.length > 0
        ? aspectRatioOptions
        : (Object.keys(RATIO_CONFIG) as AspectRatio[]).map((ratio) => ({
            label: ratio,
            value: ratio,
        }))
    ).filter((option) => option.value);

    const RatioButton = ({ ratio }: { ratio: SelectorOption }) => {
        const isActive = value === ratio.value;
        const c = parseAspectRatio(ratio.value);
        
        const iconStyle: React.CSSProperties = {
            width: c.w >= c.h ? '20px' : `${20 * (c.w/c.h)}px`,
            height: c.h > c.w ? '20px' : `${20 * (c.h/c.w)}px`,
            border: isActive ? '2px solid white' : '1.5px solid #71717a',
            borderRadius: '2px',
            transition: 'all 0.2s'
        };

        return (
            <button
                onClick={() => { onChange(ratio.value); }}
                className={`
                    group flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all duration-200
                    ${isActive 
                        ? 'bg-[#27272a] border-gray-600 shadow-inner' 
                        : 'bg-transparent border-transparent hover:bg-[#1a1a1c] hover:border-[#27272a]'
                    }
                `}
            >
                <div className="h-6 flex items-center justify-center">
                    <div style={iconStyle} className="group-hover:border-gray-400" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {c.label}
                </span>
            </button>
        );
    };

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border border-transparent
                    ${isMenuOpen 
                        ? 'bg-[#27272a] text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-[#ffffff08]'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${className}
                `}
            >
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                   <div 
                        className={`border-[1.5px] rounded-[1px] transition-colors ${isMenuOpen ? 'border-current' : 'border-gray-500 group-hover:border-current'}`}
                        style={{
                            width: config.w >= config.h ? '12px' : `${12 * (config.w/config.h)}px`,
                            height: config.h > config.w ? '12px' : `${12 * (config.h/config.w)}px`
                        }} 
                   />
                </div>
                <span>{config.label}</span>
                <ChevronDown size={10} className={`transition-transform duration-300 opacity-50 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <Popover
                isOpen={isMenuOpen}
                onClose={closeMenu}
                triggerRef={triggerRef}
                width={340}
                className="p-4 flex flex-col gap-5 bg-[#0e0e10]"
            >
                <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 pl-1">
                        {t('aspectRatio.selectRatio')}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                        {ratioChoices.map((ratio) => (
                            <RatioButton key={ratio.value} ratio={ratio} />
                        ))}
                    </div>
                </div>

                {onResolutionChange && resolutionOptions.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 pl-1">
                            {t('aspectRatio.selectResolution')}
                        </div>
                        <div className="flex bg-[#18181b] p-1 rounded-xl border border-[#27272a] gap-1">
                            {resolutionOptions.map((option) => {
                                const isPremium = option.value.trim().toLowerCase() === '4k';
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => onResolutionChange(option.value)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${resolution === option.value ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {option.label}
                                        {isPremium && <Sparkles size={10} className="text-yellow-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 pl-1">
                        {t('aspectRatio.dimensions')}
                    </div>
                    <div className="flex items-center gap-3 bg-[#18181b] px-4 py-3 rounded-xl border border-[#27272a]">
                        <div className="flex-1">
                            <label className="text-[9px] text-gray-600 block mb-1 uppercase font-bold">W</label>
                            <div className="text-sm font-mono text-gray-300">{widthPx}</div>
                        </div>
                        <div className="text-gray-600">
                            <LinkIcon size={14} />
                        </div>
                        <div className="flex-1 text-right">
                            <label className="text-[9px] text-gray-600 block mb-1 uppercase font-bold">H</label>
                            <div className="text-sm font-mono text-gray-300">{heightPx}</div>
                        </div>
                        <div className="text-xs font-bold text-gray-600 pl-2 border-l border-[#27272a]">
                            PX
                        </div>
                    </div>
                </div>
            </Popover>
        </>
    );
};
