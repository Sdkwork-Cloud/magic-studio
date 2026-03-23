import React from 'react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { PromptTextInput, createPromptTextInputCapabilityProps } from '@sdkwork/react-assets';
import { ImagePanelLabel } from './ImagePanelLabel';

interface ImagePromptSectionProps {
    prompt: string;
    isGenerating: boolean;
    onPromptChange: (value: string) => void;
    onEnhance: (text: string) => Promise<string>;
}

export const ImagePromptSection: React.FC<ImagePromptSectionProps> = ({
    prompt,
    isGenerating,
    onPromptChange,
    onEnhance
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-2">
            <ImagePanelLabel icon={<Wand2 size={12} className="text-purple-500" />}>
                {t('studio.common.prompt')}
            </ImagePanelLabel>
            <PromptTextInput
                {...createPromptTextInputCapabilityProps('IMAGE')}
                label={null}
                value={prompt}
                onChange={onPromptChange}
                placeholder="Describe the image you want to create..."
                rows={6}
                disabled={isGenerating}
                className="bg-[#121214]"
                onEnhance={onEnhance}
            />
        </div>
    );
};
