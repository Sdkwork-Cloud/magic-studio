import React from 'react';
import { Mic2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import type { VoiceGenerationMode, VoiceModeAvailability } from './types';
import { VoiceModelSelector } from '../VoiceModelSelector';
import { VoiceModeTabs } from './VoiceModeTabs';

interface VoicePanelHeaderProps {
    model: string;
    mode: VoiceGenerationMode;
    availability: Partial<Record<VoiceGenerationMode, VoiceModeAvailability>>;
    onModelChange: (modelId: string) => void;
    onModeChange: (mode: VoiceGenerationMode) => void;
}

export const VoicePanelHeader: React.FC<VoicePanelHeaderProps> = ({
    model,
    mode,
    availability,
    onModelChange,
    onModeChange
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
            <div className="px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/20 ring-1 ring-white/10">
                        <Mic2 size={16} fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-white leading-none">{t('studio.voice.title')}</h2>
                        <span className="text-[10px] text-gray-500 font-medium">Voice Creation</span>
                    </div>
                </div>

                <VoiceModelSelector
                    value={model}
                    onChange={onModelChange}
                    className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                />
            </div>

            <VoiceModeTabs
                mode={mode}
                availability={availability}
                hideUnsupportedModes
                onModeChange={onModeChange}
            />
        </div>
    );
};
