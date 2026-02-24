
import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { InputFooterButton } from './InputFooterButton';
import { Popover } from '../../Popover';

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

interface InputSelectProps {
    label?: string; // If not provided, uses selected option label
    icon?: React.ReactNode;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    width?: number; // Width of the popover
}

export const InputSelect: React.FC<InputSelectProps> = ({
    label,
    icon,
    value,
    options,
    onChange,
    disabled = false,
    className = '',
    width = 200
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const activeOption = options.find(o => o.value === value);
    const displayLabel = label || activeOption?.label || value;

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <>
            <InputFooterButton
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                active={isOpen}
                disabled={disabled}
                icon={icon || activeOption?.icon}
                label={displayLabel}
                suffix={<ChevronDown size={10} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                className={className}
            />

            <Popover
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                triggerRef={triggerRef}
                width={width}
                className="p-1 flex flex-col gap-0.5 bg-[#18181b] border border-[#27272a]"
            >
                {options.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={`
                                w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors group
                                ${isSelected 
                                    ? 'bg-[#27272a] text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-[#202022]'
                                }
                            `}
                        >
                            {opt.icon && (
                                <span className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                    {opt.icon}
                                </span>
                            )}
                            
                            <div className="flex-1 min-w-0 flex flex-col">
                                <span className="truncate font-medium">{opt.label}</span>
                                {opt.description && (
                                    <span className="truncate text-[9px] text-gray-600 group-hover:text-gray-500">
                                        {opt.description}
                                    </span>
                                )}
                            </div>

                            {isSelected && <Check size={12} className="text-blue-500 ml-2" />}
                        </button>
                    );
                })}
            </Popover>
        </>
    );
};
