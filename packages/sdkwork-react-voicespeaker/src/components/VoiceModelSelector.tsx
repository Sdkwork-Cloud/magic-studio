
import React, { useEffect, useState } from 'react';
import { fetchCreationModelProviders } from '@sdkwork/react-assets';
import { ModelSelector } from '@sdkwork/react-commons';
import { VOICE_PROVIDERS } from '../constants';

interface VoiceModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    className?: string;
    disabled?: boolean;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const VoiceModelSelector: React.FC<VoiceModelSelectorProps> = ({ value, onChange, className, disabled, isOpen, onToggle }) => {
    const [providers, setProviders] = useState(VOICE_PROVIDERS);

    useEffect(() => {
        let active = true;
        fetchCreationModelProviders('speech', VOICE_PROVIDERS)
            .then((resolvedProviders) => {
                if (active) {
                    setProviders(resolvedProviders);
                }
            })
            .catch(() => {
                if (active) {
                    setProviders(VOICE_PROVIDERS);
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
