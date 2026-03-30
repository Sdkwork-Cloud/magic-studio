
import React, { forwardRef, useMemo, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useMagicCutTranslation } from '../../hooks/useMagicCutTranslation';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    onClear?: () => void;
    className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
    value,
    onChange,
    placeholder,
    isLoading = false,
    onClear,
    className = ''
}, ref) => {
    const { tc } = useMagicCutTranslation();
    const resolvedPlaceholder = placeholder ?? tc('searchPlaceholder');
    const handleClear = useCallback(() => {
        onChange('');
        onClear?.();
    }, [onChange, onClear]);

    return (
        <div className={`relative group ${className}`}>
            <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" 
            />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={resolvedPlaceholder}
                className="w-full bg-[#121212] border border-[#27272a] hover:border-[#3f3f46] rounded-lg pl-9 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
            />
            {isLoading && (
                <Loader2 
                    size={14} 
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" 
                />
            )}
            {value && !isLoading && (
                <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
});

SearchInput.displayName = 'SearchInput';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action
}) => (
    <div className="flex flex-col items-center justify-center h-32 text-gray-500 gap-3 border-2 border-dashed border-[#27272a] rounded-xl m-2 bg-[#121212]">
        {icon && (
            <div className="w-10 h-10 bg-[#1e1e1e] rounded-full flex items-center justify-center">
                {icon}
            </div>
        )}
        <div className="text-center">
            <p className="text-xs font-medium">{title}</p>
            {description && (
                <p className="text-[10px] text-gray-600 mt-1">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1 justify-center mx-auto"
                >
                    {action.label}
                </button>
            )}
        </div>
    </div>
);

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className = ''
}) => {
    const sizeMap = {
        sm: 'w-1 h-1',
        md: 'w-1.5 h-1.5',
        lg: 'w-2 h-2'
    };

    return (
        <div className={`flex justify-center py-8 gap-1.5 ${className}`}>
            <div className={`${sizeMap[size]} bg-blue-500 rounded-full animate-bounce`} />
            <div className={`${sizeMap[size]} bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]`} />
            <div className={`${sizeMap[size]} bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]`} />
        </div>
    );
};

interface BadgeProps {
    count: number;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, className = '' }) => {
    if (count === 0) return null;
    
    return (
        <span className={`bg-[#1a1a1a] px-1.5 rounded text-[9px] text-gray-500 border border-white/5 ${className}`}>
            {count > 999 ? '999+' : count}
        </span>
    );
};

interface TabItem {
    id: string;
    label: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface TabBarProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className = ''
}) => (
    <div className={`flex-none h-9 border-b border-[#1a1a1a] bg-[#09090b] flex items-center px-1 overflow-x-auto no-scrollbar gap-1 ${className}`}>
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                    flex items-center gap-1.5 px-3 h-full border-b-2 text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap
                    ${activeTab === tab.id 
                        ? 'border-blue-500 text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }
                `}
            >
                {tab.icon && (
                    <tab.icon 
                        size={12} 
                        className={activeTab === tab.id ? 'text-blue-400' : 'opacity-50'} 
                    />
                )}
                {tab.label}
            </button>
        ))}
    </div>
);

interface IconButtonProps {
    icon: React.ReactNode;
    onClick?: () => void;
    title?: string;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onClick,
    title,
    active = false,
    disabled = false,
    className = '',
    size = 'md'
}) => {
    const sizeMap = {
        sm: 'p-1',
        md: 'p-1.5',
        lg: 'p-2'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                ${sizeMap[size]} rounded hover:bg-[#1a1a1a] transition-colors
                ${active ? 'text-white bg-[#27272a]' : 'text-gray-500 hover:text-white'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
        >
            {icon}
        </button>
    );
};

interface PanelHeaderProps {
    title: string;
    count?: number;
    actions?: React.ReactNode;
    className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
    title,
    count,
    actions,
    className = ''
}) => (
    <div className={`p-3 border-b border-white/5 space-y-3 bg-[#050505] z-10 flex-none ${className}`}>
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-gray-300">
                {title}
                {count !== undefined && <Badge count={count} />}
            </span>
            {actions && <div className="flex gap-1">{actions}</div>}
        </div>
    </div>
);

interface FilterTabProps {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    active: boolean;
    onClick: () => void;
}

export const FilterTab: React.FC<FilterTabProps> = ({ label, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 border
            ${active 
                ? 'bg-[#1e1e20] text-white border-white/10 shadow-sm' 
                : 'bg-transparent text-gray-500 border-transparent hover:text-white hover:bg-[#121212]'
            }
        `}
    >
        <Icon size={12} />
        {label}
    </button>
);

interface FilterBarProps {
    tabs: Array<{
        id: string;
        label: string;
        icon: React.ComponentType<{ size?: number }>;
    }>;
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className = ''
}) => (
    <div className={`flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 ${className}`}>
        {tabs.map(tab => (
            <FilterTab
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
            />
        ))}
    </div>
);

