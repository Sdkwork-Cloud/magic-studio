
import React, { useState, useRef, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { ModelSelectorProps } from './types';
import { Popover } from '../Popover';

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    value,
    onChange,
    providers,
    className = '',
    disabled = false,
    label,
    isOpen: controlledIsOpen,
    onToggle
}) => {
    const { t } = useTranslation();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    
    const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Flatten models to find the active one easily
    const allModels = useMemo(() => providers.flatMap(p => p.models), [providers]);
    const selectedModel = allModels.find(m => m.id === value) || allModels[0];
    
    // Find the provider that contains the currently selected model
    const currentProvider = useMemo(() => 
        providers.find(p => p.models.some(m => m.id === value)) || providers[0]
    , [providers, value]);

    // Initialize active provider when opening
    const handleOpen = () => {
        if (!disabled && providers.length > 0) {
            if (currentProvider) setActiveProviderId(currentProvider.id);
            if (onToggle) onToggle(!isOpen);
            else setInternalIsOpen(!isOpen);
        }
    };
    
    const handleClose = () => {
        if (onToggle) onToggle(false);
        else setInternalIsOpen(false);
    };

    const activeProvider = providers.find(p => p.id === activeProviderId) || providers[0];

    const handleModelSelect = (modelId: string) => {
        onChange(modelId);
        handleClose();
    };

    return (
        <>
            {/* Trigger Button */}
            <button 
                ref={triggerRef}
                onClick={handleOpen}
                disabled={disabled || providers.length === 0}
                className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-medium 
                    ${isOpen 
                        ? 'bg-[#27272a] border-white/20 text-white' 
                        : 'bg-[#18181b] border-[#333] hover:border-[#444] hover:bg-[#202023] text-gray-300'
                    }
                    ${(disabled || providers.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}
                    ${className}
                `}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Show Provider Icon if available */}
                    {currentProvider && (
                        <div className={`flex-shrink-0 ${currentProvider.color || 'text-gray-400'}`}>
                            {currentProvider.icon}
                        </div>
                    )}
                    <span className="truncate">{label || selectedModel?.name || t('common.modelSelector.selectModel', 'Select Model')}</span>
                </div>
                <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <Popover
                isOpen={isOpen}
                onClose={handleClose}
                triggerRef={triggerRef}
                width={480}
                className="flex flex-row h-[320px] bg-[#18181b] overflow-hidden"
            >
                {/* Left Column: Channels (Providers) */}
                <div className="w-[160px] flex-none bg-[#121212] border-r border-[#27272a] flex flex-col">
                    <div className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-[#121212] z-10 select-none flex-none">
                        {t('common.modelSelector.channel', 'Channel')}
                    </div>
                    <div className="p-2 space-y-0.5 overflow-y-auto custom-scrollbar flex-1">
                        {providers.map(provider => (
                            <button
                                key={provider.id}
                                onClick={() => setActiveProviderId(provider.id)}
                                className={`
                                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left
                                    ${activeProvider?.id === provider.id 
                                        ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/5 font-medium' 
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1c]'
                                    }
                                `}
                            >
                                <span className={provider.color || 'text-gray-400'}>{provider.icon}</span>
                                <span className="truncate">{provider.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Models */}
                <div className="flex-1 bg-[#18181b] flex flex-col min-w-0">
                    <div className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-[#18181b] z-10 border-b border-[#27272a] select-none flex-none">
                        {t('common.modelSelector.version', 'Version')}
                    </div>
                    <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                        {activeProvider?.models.map(model => {
                            const isSelected = value === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelSelect(model.id)}
                                    className={`
                                        w-full flex items-start gap-3 p-3 rounded-xl text-left border transition-all group
                                        ${isSelected 
                                            ? 'bg-[#252526] border-blue-500/30 shadow-md ring-1 ring-blue-500/10' 
                                            : 'border-transparent hover:bg-[#202022] hover:border-[#333]'
                                        }
                                    `}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-bold ${isSelected ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}`}>
                                                {model.name}
                                            </span>
                                            {model.badge && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold tracking-wide ${model.badgeColor || 'bg-gray-600'}`}>
                                                    {model.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 group-hover:text-gray-400">
                                            {model.description}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="mt-1">
                                            <Check size={14} className="text-blue-500" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {!activeProvider && (
                            <div className="p-4 text-center text-xs text-gray-500 italic">
                                {t('common.modelSelector.noModelsAvailable', 'No models available')}
                            </div>
                        )}
                    </div>
                </div>
            </Popover>
        </>
    );
};
