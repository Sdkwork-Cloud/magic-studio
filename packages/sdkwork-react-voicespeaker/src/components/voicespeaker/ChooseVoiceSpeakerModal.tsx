
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Filter, Mic2, Users, Globe, Volume2 } from 'lucide-react';
import { IVoice, ChooseVoiceSpeakerModalProps } from './types';
import { VoiceCard } from './VoiceCard';
import { Button } from 'sdkwork-react-commons';
import { voiceService } from '../../services';

// Default mock for preview if none provided
const DEFAULT_PREVIEW = "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"; 

export const ChooseVoiceSpeakerModal: React.FC<ChooseVoiceSpeakerModalProps> = ({ 
  isOpen, onClose, selectedId, onConfirm, voices: propVoices, title = "Select Voice" 
}) => {
  const [internalVoices, setInternalVoices] = useState<IVoice[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection State
  const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(selectedId || null);
  
  // Audio Playback State (Single source of truth)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGender, setActiveGender] = useState<string>('all');
  const [activeLang, setActiveLang] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all'); // Future extension

  // Load Data Strategy
  useEffect(() => {
    if (isOpen) {
        if (propVoices && propVoices.length > 0) {
            setInternalVoices(propVoices);
        } else {
            // Fallback to service
            setLoading(true);
            voiceService.getVoices().then(data => {
                const mapped: IVoice[] = data.map(v => ({
                    ...v,
                    gender: v.gender.toLowerCase(),
                    previewUrl: v.previewUrl || DEFAULT_PREVIEW
                }));
                setInternalVoices(mapped);
                setLoading(false);
            });
        }
        
        // Sync selected ID when opening
        if (selectedId) setCurrentSelectedId(selectedId);
    } else {
        // Stop audio on close
        stopAudio();
    }
  }, [isOpen, propVoices, selectedId]);

  // Audio Control
  const stopAudio = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
      }
      setPlayingVoiceId(null);
  };

  const handlePlayToggle = (e: React.MouseEvent, voice: IVoice) => {
      e.stopPropagation();

      // If clicking same voice that is playing, toggle pause
      if (playingVoiceId === voice.id) {
          stopAudio();
          return;
      }

      // Stop previous
      stopAudio();

      // Start new
      const url = voice.previewUrl || DEFAULT_PREVIEW;
      const audio = new Audio(url);
      audioRef.current = audio;
      
      setPlayingVoiceId(voice.id);
      
      audio.play()
          .catch(err => {
              console.error("Audio playback error", err);
              setPlayingVoiceId(null);
          });
      
      audio.onended = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
      };
  };

  // Filtering Logic
  const filteredVoices = useMemo(() => {
      return internalVoices.filter(v => {
          const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                v.style?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesGender = activeGender === 'all' || v.gender.toLowerCase() === activeGender;
          const matchesLang = activeLang === 'all' || v.language.includes(activeLang);

          return matchesSearch && matchesGender && matchesLang;
      });
  }, [internalVoices, searchQuery, activeGender, activeLang]);

  // Extract unique languages for filter dropdown
  const languages = useMemo(() => {
      const langs = new Set(internalVoices.map(v => v.language.split('-')[0]));
      return Array.from(langs);
  }, [internalVoices]);

  const handleConfirm = () => {
      const selectedVoice = internalVoices.find(v => v.id === currentSelectedId);
      if (selectedVoice) {
          onConfirm(selectedVoice);
      }
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-200">
        <div 
            className="w-full max-w-6xl h-[85vh] bg-[#121212] border border-[#333] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex-none h-16 border-b border-[#27272a] bg-[#18181b] flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Mic2 size={18} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base leading-tight">{title}</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Select a speaker for generation</p>
                    </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-80">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search by name or style..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
                        autoFocus
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-6 w-px bg-[#333]" />
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-[#27272a] rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Left Sidebar: Filters */}
                <div className="w-64 bg-[#141414] border-r border-[#27272a] flex flex-col py-6">
                    <div className="px-6 mb-4 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <Filter size={12} /> Filters
                    </div>
                    
                    <div className="space-y-8 px-6 overflow-y-auto custom-scrollbar flex-1">
                        {/* Gender Filter */}
                        <div>
                            <label className="text-xs text-gray-400 font-semibold mb-3 block flex items-center gap-2">
                                <Users size={12} /> Gender
                            </label>
                            <div className="space-y-1">
                                {['all', 'male', 'female'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setActiveGender(g)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-all duration-200 flex items-center justify-between group
                                            ${activeGender === g 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'text-gray-500 hover:text-gray-200 hover:bg-[#252526]'
                                            }
                                        `}
                                    >
                                        <span>{g}</span>
                                        {activeGender === g && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language Filter */}
                        <div>
                            <label className="text-xs text-gray-400 font-semibold mb-3 block flex items-center gap-2">
                                <Globe size={12} /> Language
                            </label>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setActiveLang('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between
                                        ${activeLang === 'all' 
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'text-gray-500 hover:text-gray-200 hover:bg-[#252526]'
                                        }
                                    `}
                                >
                                    <span>All Languages</span>
                                    {activeLang === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                </button>
                                {languages.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setActiveLang(l)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm uppercase transition-all duration-200 flex items-center justify-between
                                            ${activeLang === l 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'text-gray-500 hover:text-gray-200 hover:bg-[#252526]'
                                            }
                                        `}
                                    >
                                        <span>{l}</span>
                                        {activeLang === l && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Grid */}
                <div className="flex-1 bg-[#0a0a0a] overflow-y-auto p-6 scroll-smooth custom-scrollbar relative">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-500 gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="text-sm font-medium ml-2">Loading voices...</span>
                        </div>
                    ) : filteredVoices.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-3">
                            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#333]">
                                <Volume2 size={32} className="opacity-20" />
                            </div>
                            <p className="text-sm">No voices match your filters.</p>
                            <button onClick={() => { setActiveGender('all'); setActiveLang('all'); setSearchQuery(''); }} className="text-indigo-400 hover:underline text-xs">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredVoices.map(voice => (
                                <VoiceCard 
                                    key={voice.id}
                                    voice={voice}
                                    isSelected={currentSelectedId === voice.id}
                                    isPlaying={playingVoiceId === voice.id}
                                    onClick={() => setCurrentSelectedId(voice.id)}
                                    onPlay={(e) => handlePlayToggle(e, voice)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex-none h-20 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between px-8 z-10">
                <div className="text-xs text-gray-500">
                    {currentSelectedId 
                        ? <span className="text-gray-300">Selected: <span className="font-bold text-white ml-1">{internalVoices.find(v => v.id === currentSelectedId)?.name}</span></span>
                        : 'No voice selected'
                    }
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={onClose} className="px-6">Cancel</Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={!currentSelectedId}
                        className="px-8 bg-indigo-600 hover:bg-indigo-500 border-0 shadow-lg shadow-indigo-900/20 font-bold"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};
