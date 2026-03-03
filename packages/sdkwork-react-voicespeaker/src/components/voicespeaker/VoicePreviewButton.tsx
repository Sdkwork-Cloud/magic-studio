
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { voiceBusinessService } from '../../services';

interface VoicePreviewButtonProps {
  url?: string;
  className?: string;
  activeColor?: string;
}

export const VoicePreviewButton: React.FC<VoicePreviewButtonProps> = ({ 
  url, 
  className = "",
  activeColor = "text-white"
}) => {
  const speakerService = voiceBusinessService.voiceSpeakerService;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        speakerService.stopPreviewAudio(audioRef.current);
        audioRef.current = null;
      }
    };
  }, [speakerService]);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!url) return;

    if (isPlaying) {
      speakerService.stopPreviewAudio(audioRef.current);
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      speakerService.stopPreviewAudio(audioRef.current);
      audioRef.current = null;
    }

    setIsLoading(true);
    const audio = await speakerService.playPreviewAudio(url, {
      onPlaying: () => {
        setIsLoading(false);
        setIsPlaying(true);
      },
      onEnded: () => {
        setIsPlaying(false);
        audioRef.current = null;
      },
      onError: (error) => {
          console.error("Audio preview failed", error);
          setIsLoading(false);
          setIsPlaying(false);
          audioRef.current = null;
      }
    });
    audioRef.current = audio;
    if (!audio) {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <button 
      onClick={(event) => {
        void togglePlay(event);
      }}
      disabled={!url || isLoading}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center transition-all
        ${isPlaying 
            ? `bg-blue-600 ${activeColor}` 
            : 'bg-[#333] text-gray-400 hover:text-white hover:bg-[#444]'
        }
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={12} fill="currentColor" />
      ) : (
        <Play size={12} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  );
};
