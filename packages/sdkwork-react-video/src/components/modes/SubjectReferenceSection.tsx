import React from 'react';
import { ChooseAsset } from '@sdkwork/react-assets';
import type { Asset } from '@sdkwork/react-commons';

interface SubjectReferenceSectionProps {
    value?: string;
    onChange: (asset: Asset | null) => void;
}

export const SubjectReferenceSection: React.FC<SubjectReferenceSectionProps> = ({ value, onChange }) => {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
            <FieldLabel>Subject Reference</FieldLabel>
            <ChooseAsset
                value={value || null}
                onChange={onChange}
                accepts={['image']}
                domain="video-studio"
                aspectRatio="aspect-video"
                className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-48"
                label="Upload Subject"
            />
        </div>
    );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {children}
    </label>
);
