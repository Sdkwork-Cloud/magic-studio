import React from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { PromptTextInput } from '@sdkwork/react-assets';

interface ImageAdvancedSettingsSectionProps {
    showAdvanced: boolean;
    negativePrompt?: string;
    onToggleAdvanced: () => void;
    onNegativePromptChange: (value: string) => void;
}

export const ImageAdvancedSettingsSection: React.FC<ImageAdvancedSettingsSectionProps> = ({
    showAdvanced,
    negativePrompt,
    onToggleAdvanced,
    onNegativePromptChange
}) => {
    return (
        <div className="space-y-2">
            <div
                className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors py-2"
                onClick={onToggleAdvanced}
            >
                <Settings2 size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Advanced Settings</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
            </div>

            {showAdvanced && (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <PromptTextInput
                        label="Negative Prompt"
                        value={negativePrompt || ''}
                        onChange={onNegativePromptChange}
                        placeholder="blurry, distorted, low quality, bad anatomy..."
                        rows={2}
                        className="bg-[#121214]"
                    />
                </div>
            )}
        </div>
    );
};
