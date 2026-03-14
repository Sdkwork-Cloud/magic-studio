import React from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { StyleSelector } from '@sdkwork/react-assets';
import { IMAGE_STYLES } from '../../constants';
import { ImagePanelLabel } from './ImagePanelLabel';

interface ImageStyleSectionProps {
    styleId?: string;
    showStyleMenu: boolean;
    onStyleChange: (value: string) => void;
    onStyleMenuToggle: (open: boolean) => void;
}

export const ImageStyleSection: React.FC<ImageStyleSectionProps> = ({
    styleId,
    showStyleMenu,
    onStyleChange,
    onStyleMenuToggle
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-2">
            <ImagePanelLabel icon={<Settings2 size={12} />}>
                {t('studio.common.style')}
            </ImagePanelLabel>
            <StyleSelector
                value={styleId || 'none'}
                onChange={onStyleChange}
                options={IMAGE_STYLES}
                className="w-full bg-[#121214] border-[#27272a] hover:border-[#444] h-10 justify-between px-3"
                isOpen={showStyleMenu}
                onToggle={onStyleMenuToggle}
            />
        </div>
    );
};
