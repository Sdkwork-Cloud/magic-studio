
import React from 'react';
import { ModelSelector } from '../../../components/ModelSelector';
import { IMAGE_PROVIDERS } from '../constants';

interface ImageModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    className?: string;
    disabled?: boolean;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const ImageModelSelector: React.FC<ImageModelSelectorProps> = ({ value, onChange, className, disabled, isOpen, onToggle }) => {
    return (
        <ModelSelector 
            value={value}
            onChange={onChange}
            providers={IMAGE_PROVIDERS}
            className={className}
            disabled={disabled}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};
