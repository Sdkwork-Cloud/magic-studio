
import React, { useEffect, useState } from 'react';
import { fetchCreationModelProviders } from '@sdkwork/react-assets';
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
    const [providers, setProviders] = useState(MUSIC_PROVIDERS);

    useEffect(() => {
        let active = true;
        fetchCreationModelProviders('music', MUSIC_PROVIDERS)
            .then((resolvedProviders) => {
                if (active) {
                    setProviders(resolvedProviders);
                }
            })
            .catch(() => {
                if (active) {
                    setProviders(MUSIC_PROVIDERS);
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
