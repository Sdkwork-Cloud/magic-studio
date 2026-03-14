import React from 'react';
import { Copy, UserPlus } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import type { VoiceModeTabsProps } from './types';

const MODE_META: Record<
    'design' | 'clone',
    { icon: React.ReactNode; labelKey: string }
> = {
    design: {
        icon: <UserPlus size={14} />,
        labelKey: 'studio.voice.design'
    },
    clone: {
        icon: <Copy size={14} />,
        labelKey: 'studio.voice.clone'
    }
};

export const VoiceModeTabs: React.FC<VoiceModeTabsProps> = ({
    mode,
    availability,
    hideUnsupportedModes = true,
    onModeChange
}) => {
    const { t } = useTranslation();
    const modes: Array<'design' | 'clone'> = ['design', 'clone'];
    const visibleModes = hideUnsupportedModes
        ? modes.filter((id) => availability[id]?.enabled !== false)
        : modes;
    const tabs = visibleModes.length > 0 ? visibleModes : modes;

    return (
        <div className="flex items-center px-6 gap-6 border-t border-[#1c1c1f]">
            {tabs.map((id) => {
                const item = MODE_META[id];
                const isActive = mode === id;
                const isDisabled = availability[id]?.enabled === false;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => {
                            if (!isDisabled) {
                                onModeChange(id);
                            }
                        }}
                        disabled={isDisabled}
                        title={availability[id]?.reason || t(item.labelKey)}
                        className={`relative py-3 flex items-center gap-2 text-xs font-medium transition-colors select-none ${
                            isActive
                                ? 'text-green-400'
                                : isDisabled
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {item.icon}
                        {t(item.labelKey)}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-t-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
