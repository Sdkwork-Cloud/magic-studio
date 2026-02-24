
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!url) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        setIsLoading(true);
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audio.oncanplaythrough = () => setIsLoading(false);
        audio.onerror = () => {
            setIsLoading(false);
            setIsPlaying(false);
            console.error("Audio preview failed");
        };
        audioRef.current = audio;
      }
      
      audioRef.current.play().then(() => {
          setIsPlaying(true);
      }).catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
      });
    }
  };

  return (
    <button 
      onClick={togglePlay}
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
