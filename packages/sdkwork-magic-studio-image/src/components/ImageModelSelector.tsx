
import React, { useEffect, useState } from 'react';
import { fetchGenerationCatalogProviders } from '@sdkwork/magic-studio-assets/services';
import { ModelSelector } from '@sdkwork/magic-studio-commons';
import type { ModelProvider } from '@sdkwork/magic-studio-types/infrastructure';

interface ImageModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    className?: string;
    disabled?: boolean;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const ImageModelSelector: React.FC<ImageModelSelectorProps> = ({ value, onChange, className, disabled, isOpen, onToggle }) => {
    const [providers, setProviders] = useState<ModelProvider[]>([]);

    useEffect(() => {
        let active = true;
        fetchGenerationCatalogProviders('image')
            .then((resolvedProviders) => {
                if (active) {
                    setProviders(resolvedProviders);
                }
            })
            .catch(() => {
                if (active) {
                    setProviders([]);
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
