
import React, { forwardRef, useCallback } from 'react';
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-primary-500"
            />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={resolvedPlaceholder}
                className="app-surface-strong w-full rounded-xl border px-3 py-1.5 pl-9 pr-8 text-xs text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-primary-500/50"
            />
            {isLoading && (
                <Loader2
                    size={14}
                    className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-primary-500"
                />
            )}
            {value && !isLoading && (
                <button
                    onClick={handleClear}
                    className="app-header-action absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1"
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
    <div className="app-surface-subtle m-2 flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-dashed px-4 text-[var(--text-muted)]">
        {icon && (
            <div className="app-surface-strong flex h-10 w-10 items-center justify-center rounded-full">
                {icon}
            </div>
        )}
        <div className="text-center">
            <p className="text-xs font-medium text-[var(--text-primary)]">{title}</p>
            {description && (
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-2 flex items-center justify-center gap-1 text-[10px] text-primary-500 transition-colors hover:text-primary-400"
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
    return (
        <span className={`app-brand-badge text-[9px] font-semibold text-[var(--text-muted)] ${className}`}>
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
                app-header-action ${sizeMap[size]} rounded-xl transition-colors
                ${active ? 'bg-[color-mix(in_srgb,var(--theme-primary-500)_14%,transparent)] text-primary-500' : ''}
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
    <div className={`app-header-glass z-10 flex-none space-y-3 p-3 ${className}`}>
        <div className="flex items-center justify-between px-1 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[var(--text-primary)]">
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
        className="app-segmented-item flex flex-shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium"
        data-active={active ? 'true' : 'false'}
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
    <div className={`app-segmented-control flex items-center gap-1 overflow-x-auto no-scrollbar ${className}`}>
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

