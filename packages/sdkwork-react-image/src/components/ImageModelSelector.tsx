
import React, { useEffect, useState } from 'react';
import { fetchCreationModelProviders } from '@sdkwork/react-assets';
import { ModelSelector } from '@sdkwork/react-commons';
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
    const [providers, setProviders] = useState(IMAGE_PROVIDERS);

    useEffect(() => {
        let active = true;
        fetchCreationModelProviders('image', IMAGE_PROVIDERS)
            .then((resolvedProviders) => {
                if (active) {
                    setProviders(resolvedProviders);
                }
            })
            .catch(() => {
                if (active) {
                    setProviders(IMAGE_PROVIDERS);
                }
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <ModelSelector 
            value={value}
            onChange={onChange}
            providers={providers}
            className={className}
            disabled={disabled}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};
