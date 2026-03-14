import React from 'react';
import { SettingTextArea } from '@sdkwork/react-settings';

interface VoicePreviewTextSectionProps {
    value: string;
    onChange: (value: string) => void;
}

export const VoicePreviewTextSection: React.FC<VoicePreviewTextSectionProps> = ({
    value,
    onChange
}) => {
    return (
        <div className="pt-2 border-t border-[#27272a]">
            <SettingTextArea
                label="Preview Text"
                description="Text to speak for the generated preview."
                value={value}
                onChange={onChange}
                rows={2}
                fullWidth
                placeholder="Hello, this is a preview of my new voice."
            />
        </div>
    );
};
