import React from 'react';
import { ModelSelector } from 'sdkwork-react-commons';
import { VIDEO_PROVIDERS } from '../constants';

interface VideoModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    className?: string;
    disabled?: boolean;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const VideoModelSelector: React.FC<VideoModelSelectorProps> = ({ value, onChange, className, disabled, isOpen, onToggle }) => {
    return (
        <ModelSelector 
            value={value}
            onChange={onChange}
            providers={VIDEO_PROVIDERS}
            className={className}
            disabled={disabled}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};