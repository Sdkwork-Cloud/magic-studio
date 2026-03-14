import React, { useRef, useState } from 'react';
import { FolderOpen, Upload, X } from 'lucide-react';
import { importAssetBySdk, resolveAssetPrimaryUrlBySdk } from '@sdkwork/react-assets';

interface SmartFramesSectionProps {
    mode: 'smart_reference' | 'smart_multi';
    referenceImages: string[];
    resolvedReferenceImages: string[];
    maxAssets: number;
    onChangeReferences: (value: string[]) => void;
    onOpenAssetModal: () => void;
}

export const SmartFramesSection: React.FC<SmartFramesSectionProps> = ({
    mode,
    referenceImages,
    resolvedReferenceImages,
    maxAssets,
    onChangeReferences,
    onOpenAssetModal
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHoveringAddCard, setIsHoveringAddCard] = useState(false);
    const [isAddMenuPinned, setIsAddMenuPinned] = useState(false);

    const showAddMenu = isHoveringAddCard || isAddMenuPinned;

    const removeFrame = (index: number) => {
        const next = referenceImages.filter((_, idx) => idx !== index);
        onChangeReferences(next);
    };

    const handleUpload = async (files: FileList): Promise<void> => {
        const rawFiles: Array<{ name: string; data: Uint8Array }> = [];
        for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
            const buffer = await file.arrayBuffer();
            rawFiles.push({ name: file.name, data: new Uint8Array(buffer) });
        }

        const imported: string[] = [];
        for (const item of rawFiles) {
            const uploaded = await importAssetBySdk(
                {
                    name: item.name,
                    data: item.data
                },
                'image',
                { domain: 'video-studio' }
            );
            const resolved = (await resolveAssetPrimaryUrlBySdk(uploaded.id)) || uploaded.path;
            if (resolved) {
                imported.push(resolved);
            }
        }

        onChangeReferences([...referenceImages, ...imported].slice(0, maxAssets));
    };

    const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        if (!event.target.files) {
            return;
        }
        try {
            await handleUpload(event.target.files);
        } catch (error) {
            console.error(error);
        } finally {
            event.target.value = '';
            setIsAddMenuPinned(false);
        }
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

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
            <div className="flex justify-between items-center">
                <FieldLabel>{mode === 'smart_reference' ? 'All-round References' : 'Smart Multi-Frames'}</FieldLabel>
                <span className="text-[9px] text-gray-500 bg-[#1a1a1c] px-1.5 py-0.5 rounded border border-[#27272a]">
                    Max: {maxAssets}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {referenceImages.map((_, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-[#27272a] group bg-[#121214]">
                        {resolvedReferenceImages[index] ? (
                            <img src={resolvedReferenceImages[index]} className="w-full h-full object-cover" alt={`Reference ${index + 1}`} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                Resolving...
                            </div>
                        )}
                        <button
                            onClick={() => removeFrame(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                            <X size={10} />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[9px] font-mono text-gray-300">{index + 1}</div>
                    </div>
                ))}
                {referenceImages.length < maxAssets && (
                    <div
                        className="aspect-video bg-[#121214] border border-dashed border-[#333] hover:border-pink-500/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a1a1c] transition-colors relative gap-1 group/add"
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
                        <PlusIcon highlighted={showAddMenu} />
                        <span className={`text-[10px] font-medium transition-colors ${showAddMenu ? 'text-gray-200' : 'text-gray-500 group-hover/add:text-gray-300'}`}>
                            Add Frame
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
                            >
                                <Upload size={11} className="text-emerald-400" />
                                Upload Local
                            </button>
                            <button
                                type="button"
                                onClick={(event) => triggerAssetSelect(event)}
                                className="mt-1 w-full rounded px-2 py-1.5 text-[10px] text-gray-200 hover:bg-[#1c1d21] transition-colors flex items-center gap-1.5"
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

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {children}
    </label>
);

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
