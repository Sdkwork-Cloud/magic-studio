
import React, { useEffect, useState } from 'react';
import { fetchCreationModelProviders } from '@sdkwork/react-assets';
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
    const [providers, setProviders] = useState(AUDIO_PROVIDERS);

    useEffect(() => {
        let active = true;
        fetchCreationModelProviders('speech', AUDIO_PROVIDERS)
            .then((resolvedProviders) => {
                if (active) {
                    setProviders(resolvedProviders);
                }
            })
            .catch(() => {
                if (active) {
                    setProviders(AUDIO_PROVIDERS);
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
