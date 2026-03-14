import React, { useEffect, useRef, useState } from 'react';
import { FolderOpen, Layers, Loader2, Upload, X } from 'lucide-react';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/react-assets';
import { ImagePanelLabel } from './ImagePanelLabel';

interface ImageReferenceSectionProps {
    referenceImages: string[];
    maxReferenceImages: number;
    onChangeReferences: (value: string[]) => void;
    onUploadLocalFiles: (files: FileList) => Promise<void>;
    onOpenAssetModal: () => void;
}

const isRenderableUrl = (value: string): boolean => {
    return (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        value.startsWith('asset:')
    );
};

export const ImageReferenceSection: React.FC<ImageReferenceSectionProps> = ({
    referenceImages,
    maxReferenceImages,
    onChangeReferences,
    onUploadLocalFiles,
    onOpenAssetModal
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHoveringAddCard, setIsHoveringAddCard] = useState(false);
    const [isAddMenuPinned, setIsAddMenuPinned] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [resolvedReferenceImages, setResolvedReferenceImages] = useState<string[]>([]);

    const showAddMenu = isHoveringAddCard || isAddMenuPinned;

    useEffect(() => {
        if (referenceImages.length === 0) {
            setResolvedReferenceImages([]);
            return;
        }

        let cancelled = false;
        const resolveSources = async () => {
            const resolved = await Promise.all(
                referenceImages.map(async (source) => {
                    const url = await resolveAssetUrlByAssetIdFirst(source);
                    if (url) {
                        return url;
                    }
                    return isRenderableUrl(source) ? source : '';
                })
            );
            if (!cancelled) {
                setResolvedReferenceImages(resolved);
            }
        };

        void resolveSources();
        return () => {
            cancelled = true;
        };
    }, [referenceImages]);

    const removeReference = (index: number): void => {
        const next = referenceImages.filter((_, idx) => idx !== index);
        onChangeReferences(next);
    };

    const triggerLocalUpload = (event?: React.MouseEvent): void => {
        event?.stopPropagation();
        fileInputRef.current?.click();
    };

    const triggerAssetSelect = (event?: React.MouseEvent): void => {
        event?.stopPropagation();
        setIsAddMenuPinned(false);
        onOpenAssetModal();
    };

    const handleFileInputChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        try {
            setIsUploading(true);
            await onUploadLocalFiles(event.target.files);
        } catch (error) {
            console.error(error);
        } finally {
            event.target.value = '';
            setIsUploading(false);
            setIsAddMenuPinned(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <ImagePanelLabel icon={<Layers size={12} />}>Reference Images</ImagePanelLabel>
                <span className="text-[9px] text-gray-500 bg-[#1a1a1c] px-1.5 py-0.5 rounded border border-[#27272a]">
                    {referenceImages.length}/{maxReferenceImages}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {referenceImages.map((_, index) => (
                    <div key={`${referenceImages[index]}-${index}`} className="relative aspect-video rounded-lg overflow-hidden border border-[#27272a] group bg-[#121214]">
                        {resolvedReferenceImages[index] ? (
                            <img
                                src={resolvedReferenceImages[index]}
                                className="w-full h-full object-cover"
                                alt={`Reference ${index + 1}`}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                Resolving...
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => removeReference(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                            <X size={10} />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[9px] font-mono text-gray-300">
                            {index + 1}
                        </div>
                    </div>
                ))}

                {referenceImages.length < maxReferenceImages && (
                    <div
                        className="aspect-video bg-[#121214] border border-dashed border-[#333] hover:border-purple-500/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a1a1c] transition-colors relative gap-1 group/add"
                        onMouseEnter={() => setIsHoveringAddCard(true)}
                        onMouseLeave={() => {
                            setIsHoveringAddCard(false);
                            setIsAddMenuPinned(false);
                        }}
                        onClick={() => setIsAddMenuPinned((prev) => !prev)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setIsAddMenuPinned((prev) => !prev);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={`absolute inset-0 rounded-lg bg-[#0b0b0d]/70 transition-opacity duration-200 ${showAddMenu ? 'opacity-100' : 'opacity-0 group-hover/add:opacity-100'} pointer-events-none`} />
                        {isUploading ? (
                            <Loader2 size={16} className="animate-spin text-purple-300" />
                        ) : (
                            <PlusIcon highlighted={showAddMenu} />
                        )}
                        <span className={`text-[10px] font-medium transition-colors ${showAddMenu ? 'text-gray-200' : 'text-gray-500 group-hover/add:text-gray-300'}`}>
                            {isUploading ? 'Uploading...' : 'Add Reference'}
                        </span>

                        <div
                            className={`
                                absolute left-2 right-2 bottom-2 rounded-md border border-[#2d2d33] bg-[#0f1013]/95 p-1.5 backdrop-blur-sm
                                transition-all duration-200
                                ${showAddMenu
                                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                                    : 'opacity-0 translate-y-2 pointer-events-none group-hover/add:opacity-100 group-hover/add:translate-y-0'
                                }
                            `}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={(event) => triggerLocalUpload(event)}
                                className="w-full rounded px-2 py-1.5 text-[10px] text-gray-200 hover:bg-[#1c1d21] transition-colors flex items-center gap-1.5"
                                disabled={isUploading}
                            >
                                <Upload size={11} className="text-emerald-400" />
                                Upload Local
                            </button>
                            <button
                                type="button"
                                onClick={(event) => triggerAssetSelect(event)}
                                className="mt-1 w-full rounded px-2 py-1.5 text-[10px] text-gray-200 hover:bg-[#1c1d21] transition-colors flex items-center gap-1.5"
                                disabled={isUploading}
                            >
                                <FolderOpen size={11} className="text-blue-400" />
                                Select from Assets
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileInputChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const PlusIcon: React.FC<{ highlighted?: boolean }> = ({ highlighted = false }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={highlighted ? 'text-white' : 'text-gray-500 group-hover/add:text-gray-300'}
    >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
