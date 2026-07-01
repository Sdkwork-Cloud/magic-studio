import React from 'react';
import { ChooseAsset } from '@sdkwork/magic-studio-assets/choose-asset';
import type { Asset } from '@sdkwork/magic-studio-types/assets';
import type { VideoInputResourceRef, VideoInputResourceType } from '../../entities';
import { toVideoInputSelectableAsset } from '../../utils/videoInputResource';

interface SubjectReferenceSectionProps {
    value?: VideoInputResourceRef;
    onChange: (asset: Asset | null) => void;
    title?: string;
    accepts?: VideoInputResourceType[];
    label?: string;
}

export const SubjectReferenceSection: React.FC<SubjectReferenceSectionProps> = ({
    value,
    onChange,
    title = 'Subject Reference',
    accepts = ['image'],
    label = 'Upload Subject'
}) => {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
            <FieldLabel>{title}</FieldLabel>
            <ChooseAsset
                value={toVideoInputSelectableAsset(value)}
                onChange={onChange}
                accepts={accepts}
                domain="video-studio"
                projectReference={{
                    slot: 'subject-reference',
                    metadata: {
                        source: 'subject-reference-section',
                    },
                }}
                aspectRatio="aspect-video"
                className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-48"
                label={label}
            />
        </div>
    );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {children}
    </label>
);
