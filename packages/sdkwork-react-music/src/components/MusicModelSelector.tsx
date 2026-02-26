
import React from 'react';
import { ModelSelector } from '@sdkwork/react-commons';
import { MUSIC_PROVIDERS } from '../constants';

interface MusicModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    className?: string;
    disabled?: boolean;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const MusicModelSelector: React.FC<MusicModelSelectorProps> = ({ value, onChange, className, disabled, isOpen, onToggle }) => {
    return (
        <ModelSelector 
            value={value}
            onChange={onChange}
            providers={MUSIC_PROVIDERS}
            className={className}
            disabled={disabled}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};
