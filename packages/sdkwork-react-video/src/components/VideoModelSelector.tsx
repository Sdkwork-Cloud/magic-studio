
import React, { useEffect, useState } from 'react';
import { fetchCreationModelProviders } from '@sdkwork/react-assets';
import { ModelSelector } from '@sdkwork/react-commons';
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
    const [providers, setProviders] = useState(VIDEO_PROVIDERS);

    useEffect(() => {
        let active = true;
        fetchCreationModelProviders('video', VIDEO_PROVIDERS)
            .then((resolvedProviders) => {
                if (active) {
                    setProviders(resolvedProviders);
                }
            })
            .catch(() => {
                if (active) {
                    setProviders(VIDEO_PROVIDERS);
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
