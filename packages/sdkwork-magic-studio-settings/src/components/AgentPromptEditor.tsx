import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { useTranslation } from '@sdkwork/magic-studio-i18n';

interface AgentPromptEditorProps {
    value: string;
    onChange: (value: string) => void;
    onEnhance?: (currentText: string) => Promise<void>;
    isEnhancing?: boolean;
    rows?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const AgentPromptEditor: React.FC<AgentPromptEditorProps> = ({
    value,
    onChange,
    onEnhance,
    isEnhancing = false,
    rows = 8,
    placeholder,
    className,
    disabled = false,
}) => {
    const { t } = useTranslation();
    const isEnhanceDisabled = disabled || isEnhancing || !value.trim();

    return (
        <div
            className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm transition-colors dark:border-[#333] dark:bg-[#121214] ${className || ''}`}
        >
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                className="min-h-[180px] w-full resize-y border-0 bg-transparent px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition-colors placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-100 dark:placeholder:text-gray-600"
            />

            <div className="flex items-center justify-between border-t border-gray-200 bg-white/80 px-3 py-2 dark:border-[#2d2d2d] dark:bg-[#18181b]">
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    {t('assetCenter.promptInput.charCount', { count: String(value.length) })}
                </div>

                {onEnhance ? (
                    <button
                        type="button"
                        data-testid="enhance-trigger"
                        onClick={() => {
                            void onEnhance(value);
                        }}
                        disabled={isEnhanceDisabled}
                        className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-[11px] font-medium text-purple-500 transition-colors hover:border-purple-500/20 hover:bg-purple-500/10 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-transparent disabled:hover:bg-transparent dark:text-purple-300 dark:hover:text-white"
                        title={t('assetCenter.promptInput.optimizeWithAi')}
                    >
                        {isEnhancing ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Sparkles size={12} />
                        )}
                        {isEnhancing
                            ? t('assetCenter.promptInput.enhancing')
                            : t('assetCenter.promptInput.enhance')}
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default AgentPromptEditor;
export { AgentPromptEditor };
