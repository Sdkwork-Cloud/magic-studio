import React from 'react';

import { UploadAudioGenerationModal } from './UploadAudioGenerationModal';
import { UploadCharacterGenerationModal } from './UploadCharacterGenerationModal';
import { UploadImageGenerationModal } from './UploadImageGenerationModal';
import { UploadMusicGenerationModal } from './UploadMusicGenerationModal';
import { type ImportData, type ImportDataType } from './types';
import { UploadVideoGenerationModal } from './UploadVideoGenerationModal';

interface UploadGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
    initialType?: ImportDataType;
}

export const UploadGenerationModal: React.FC<UploadGenerationModalProps> = ({
    onClose,
    onImport,
    initialType = 'image',
}) => {
    const sharedProps = {
        onClose,
        onImport,
    };

    switch (initialType) {
        case 'video':
            return <UploadVideoGenerationModal {...sharedProps} />;
        case 'music':
            return <UploadMusicGenerationModal {...sharedProps} />;
        case 'audio':
            return <UploadAudioGenerationModal {...sharedProps} />;
        case 'character':
            return <UploadCharacterGenerationModal {...sharedProps} />;
        case 'image':
        default:
            return <UploadImageGenerationModal {...sharedProps} />;
    }
};
