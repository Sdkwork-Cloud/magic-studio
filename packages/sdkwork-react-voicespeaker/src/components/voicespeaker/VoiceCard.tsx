
import React from 'react';
import { IVoice } from './types';
import { Play, Pause, Check, User, Globe, Mic2, Loader2 } from 'lucide-react';

interface VoiceCardProps {
  voice: IVoice;
  isSelected: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onPlay: (e: React.MouseEvent) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isSelected, isPlaying, onClick, onPlay }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        group relative flex flex-col p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
        ${isSelected 
          ? 'bg-indigo-600/5 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' 
          : 'bg-[#252526] border-[#333] hover:border-[#555] hover:bg-[#2a2a2d] hover:shadow-md'
        }
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
           {/* Avatar / Icon */}
           <div className={`
              w-10 h-10 rounded-full flex items-center justify-center border transition-colors relative overflow-hidden
              ${isSelected 
                 ? 'bg-indigo-500 text-white border-indigo-400' 
                 : 'bg-[#1e1e1e] text-gray-500 border-[#333] group-hover:text-gray-300'
              }
           `}>
             {/* Simple gender-based icon logic or visual hash */}
             <User size={18} strokeWidth={2.5} />
             
             {/* Play Overlay */}
             <div 
                onClick={onPlay}
                className={`
                    absolute inset-0 flex items-center justify-center transition-opacity duration-200 backdrop-blur-[1px]
                    ${isPlaying ? 'bg-indigo-600/90 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}
                `}
             >
                 {isPlaying ? (
                     <span className="animate-pulse"><Pause size={14} fill="currentColor" className="text-white" /></span>
                 ) : (
                     <Play size={14} fill="currentColor" className="text-white ml-0.5" />
                 )}
             </div>
           </div>
           
           <div>
               <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-100' : 'text-gray-200'}`}>
                   {voice.name}
               </h4>
               <div className="flex items-center gap-1.5 mt-0.5">
                   {/* Language Flag/Code */}
                   <span className="text-[10px] text-gray-500 uppercase font-mono bg-black/20 px-1 rounded flex items-center gap-1">
                       {voice.language.split('-')[0]}
                   </span>
               </div>
           </div>
        </div>

        {/* Selected Checkmark */}
        {isSelected && (
            <div className="bg-indigo-500 text-white rounded-full p-1 shadow-sm animate-in zoom-in duration-200">
                <Check size={10} strokeWidth={4} />
            </div>
        )}
      </div>
      
      {/* Waveform Visualization (Mock) */}
      <div className="h-6 flex items-center gap-0.5 mt-auto opacity-40 group-hover:opacity-60 transition-opacity">
          {[...Array(12)].map((_, i) => (
             <div 
                key={i} 
                className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-indigo-400 animate-music-bar' : 'bg-gray-500'}`}
                style={{ 
                    height: isPlaying ? `${20 + Math.random() * 80}%` : `${30 + (i % 3) * 20}%`,
                    animationDelay: `${i * 0.05}s`
                }} 
            />
          ))}
      </div>

      {/* Footer Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#333]/50">
           <Badge icon={<User size={10} />} label={voice.gender} />
           {voice.style && <Badge icon={<Mic2 size={10} />} label={voice.style} />}
      </div>

      <style>{`
        @keyframes music-bar {
            0%, 100% { height: 20%; }
            50% { height: 100%; }
        }
        .animate-music-bar {
            animation: music-bar 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const Badge = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <span className="flex items-center gap-1 text-[9px] text-gray-500 capitalize bg-[#1a1a1c] px-1.5 py-0.5 rounded border border-[#333]">
        {icon} {label}
    </span>
);
