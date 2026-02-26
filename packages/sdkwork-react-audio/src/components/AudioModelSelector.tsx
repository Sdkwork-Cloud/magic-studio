
import React from 'react';
import { ModelSelector } from '@sdkwork/react-commons';
import { AUDIO_PROVIDERS } from '../constants';

interface AudioModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    className?: string;
    disabled?: boolean;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const AudioModelSelector: React.FC<AudioModelSelectorProps> = ({ value, onChange, className, disabled, isOpen, onToggle }) => {
    return (
        <ModelSelector 
            value={value}
            onChange={onChange}
            providers={AUDIO_PROVIDERS}
            className={className}
            disabled={disabled}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};
