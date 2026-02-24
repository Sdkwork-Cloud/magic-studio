
import React, { useState } from 'react';
import { Mic2, ChevronDown, RotateCcw } from 'lucide-react';
import { IVoice, ChooseVoiceSpeakerProps } from './types';
import { ChooseVoiceSpeakerModal } from './ChooseVoiceSpeakerModal';
import { VoicePreviewButton } from './VoicePreviewButton';

export const ChooseVoiceSpeaker: React.FC<ChooseVoiceSpeakerProps> = ({ 
  value, onChange, label = "Voice Speaker", voices, className = "", readOnly = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedVoiceId = typeof value === 'object' ? value?.id : value;
  const selectedVoiceName = typeof value === 'object' ? value?.name : null;

  const handleConfirm = (voice: IVoice) => {
    onChange(voice);
  };

  const handleOpen = () => {
    if (!readOnly) setIsModalOpen(true);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && (
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mic2 size={12} className="text-indigo-400" />
                {label}
            </label>
        )}
        
        <div 
            onClick={handleOpen}
            className={`
                group relative flex items-center justify-between p-3 bg-[#18181b] border rounded-xl transition-all
                ${readOnly 
                    ? 'border-[#333] cursor-default opacity-80' 
                    : 'border-[#333] hover:border-[#555] hover:bg-[#202023] cursor-pointer'
                }
            `}
        >
            {selectedVoiceId ? (
                <div className="flex items-center gap-3 min-w-0">
                     <div className="w-8 h-8 rounded-lg bg-[#252526] border border-[#333] flex items-center justify-center text-gray-300 font-bold text-xs shadow-sm">
                         {selectedVoiceName ? selectedVoiceName[0] : '?'}
                     </div>
                     <div className="flex flex-col min-w-0">
                         <span className="text-sm font-medium text-gray-200 truncate">
                            {selectedVoiceName || selectedVoiceId}
                         </span>
                         {typeof value === 'object' && (
                             <span className="text-[10px] text-gray-500 capitalize">
                                 {value?.language} | {value?.gender}
                             </span>
                         )}
                     </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-8 h-8 rounded-lg bg-[#252526] border border-[#333] border-dashed flex items-center justify-center">
                        <Mic2 size={14} className="opacity-50" />
                    </div>
                    <span className="text-sm">Select a voice...</span>
                </div>
            )}

            <div className="flex items-center gap-2">
                {typeof value === 'object' && value?.previewUrl && (
                    <div onClick={e => e.stopPropagation()}>
                        <VoicePreviewButton url={value.previewUrl} className="w-7 h-7" />
                    </div>
                )}
                
                {!readOnly && (
                     <div className="w-[1px] h-4 bg-[#333] mx-1" />
                )}

                {!readOnly && (
                    <ChevronDown size={14} className="text-gray-600" />
                )}
            </div>
        </div>

        <ChooseVoiceSpeakerModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirm}
            selectedId={selectedVoiceId}
            voices={voices}
            title={label}
        />
    </div>
  );
};
