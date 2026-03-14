import React, { useRef, useState } from 'react';
import {
    FolderOpen,
    Mic,
    Play,
    Trash2,
    Upload,
    Volume2
} from 'lucide-react';
import { AudioRecorder } from '@sdkwork/react-audio';
import type { VoiceCloneTabPanelProps } from './types';
import { VoicePanelLabel } from './VoicePanelLabel';

export const VoiceCloneTabPanel: React.FC<VoiceCloneTabPanelProps> = ({
    inputMethod,
    referenceAudio,
    onInputMethodChange,
    onAudioUpload,
    onOpenReferenceAssetModal,
    onRecordingComplete,
    onPlayReferenceAudio,
    onRemoveReferenceAudio
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHoveringAddCard, setIsHoveringAddCard] = useState(false);
    const [isAddMenuPinned, setIsAddMenuPinned] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const showAddMenu = isHoveringAddCard || isAddMenuPinned;

    const triggerLocalUpload = (event?: React.MouseEvent): void => {
        event?.stopPropagation();
        fileInputRef.current?.click();
    };

    const triggerAssetSelect = (event?: React.MouseEvent): void => {
        event?.stopPropagation();
        setIsAddMenuPinned(false);
        onOpenReferenceAssetModal();
    };

    const handleFileInputChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            setIsUploading(true);
            await onAudioUpload({
                data: file,
                name: file.name,
                path: file.name
            });
        } catch (error) {
            console.error(error);
        } finally {
            event.target.value = '';
            setIsUploading(false);
            setIsAddMenuPinned(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-end">
                <VoicePanelLabel icon={<Upload size={12} />}>Reference Audio</VoicePanelLabel>
                <div className="flex bg-[#121214] p-0.5 rounded-lg border border-[#27272a] mb-2">
                    <button
                        type="button"
                        onClick={() => onInputMethodChange('upload')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                            inputMethod === 'upload'
                                ? 'bg-[#27272a] text-white shadow-sm border border-[#333]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => onInputMethodChange('mic')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                            inputMethod === 'mic'
                                ? 'bg-[#27272a] text-white shadow-sm border border-[#333]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Record
                    </button>
                </div>
            </div>

            {referenceAudio ? (
                <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3 relative group transition-all hover:border-green-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 border border-green-500/20">
                        <Volume2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-200">Audio Sample</div>
                        <div className="text-[10px] text-gray-500 truncate">Ready to clone</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => void onPlayReferenceAudio()}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#252526] rounded-lg transition-colors"
                            title="Play"
                        >
                            <Play size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={onRemoveReferenceAudio}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#252526] rounded-lg transition-colors"
                            title="Remove Audio"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="min-h-[140px]">
                    {inputMethod === 'upload' ? (
                        <div
                            className="h-36 bg-[#121214] border border-dashed border-[#333] hover:border-green-500/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a1a1c] transition-colors relative gap-1 group/add"
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
                            <PlusIcon highlighted={showAddMenu} loading={isUploading} />
                            <span className={`text-[10px] font-medium transition-colors ${showAddMenu ? 'text-gray-200' : 'text-gray-500 group-hover/add:text-gray-300'}`}>
                                {isUploading ? 'Uploading...' : 'Add Reference Audio'}
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
                                accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                        </div>
                    ) : (
                        <AudioRecorder
                            onRecordingComplete={(blob) => {
                                void onRecordingComplete(blob);
                            }}
                            onDelete={() => {}}
                            className="h-36 bg-[#121214] border-[#27272a] p-4"
                        />
                    )}
                    <p className="text-[10px] text-gray-500 mt-2 ml-1">
                        * Provide 10-60 seconds of clear speech for best results.
                    </p>
                </div>
            )}
        </div>
    );
};

const PlusIcon: React.FC<{ highlighted?: boolean; loading?: boolean }> = ({
    highlighted = false,
    loading = false
}) => {
    if (loading) {
        return <Mic size={16} className="animate-pulse text-green-300" />;
    }

    return (
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
};
