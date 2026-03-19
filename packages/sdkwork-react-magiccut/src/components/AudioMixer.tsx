import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, Speaker, Gauge } from 'lucide-react';
import { useMagicCutStore } from '../store/magicCutStore';
import { audioEngine } from '../engine/AudioEngine';
import { buildMasterMeterBars, buildTrackMeterLevel } from '../domain/audio/audioMixerMeters';
import { resolveAudibleTrackIds } from '../domain/audio/trackAudibility';

interface AudioMixerProps {
    className?: string;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({ className }) => {
    const { 
        state, 
        activeTimeline, 
        updateTrack, 
        updateClip,
        selectedClipId,
        useTransientState
    } = useMagicCutStore();
    
    const currentTime = useTransientState(s => s.currentTime);
    const isPlaying = useTransientState(s => s.isPlaying);
    const soloTrackIds = useTransientState(s => s.soloTrackIds);
    const toggleSoloTrack = useTransientState(s => s.toggleSoloTrack);
    
    const audioTracks = useMemo(() => {
        if (!activeTimeline) return [];
        
        return activeTimeline.tracks
            .map(ref => state.tracks[ref.id])
            .filter(track => track && (track.trackType === 'audio' || track.trackType === 'video'));
    }, [activeTimeline, state.tracks]);
    
    const handleVolumeChange = useCallback((trackId: string, volume: number) => {
        updateTrack(trackId, { volume });
    }, [updateTrack]);
    
    const handleMuteToggle = useCallback((trackId: string, currentMuted: boolean) => {
        updateTrack(trackId, { muted: !currentMuted });
    }, [updateTrack]);
    
    const handleSoloToggle = useCallback((trackId: string) => {
        toggleSoloTrack(trackId);
    }, [toggleSoloTrack]);
    
    const handlePanChange = useCallback((trackId: string, pan: number) => {
        updateTrack(trackId, { pan } as any);
    }, [updateTrack]);
    
    const handleClipVolumeChange = useCallback((clipId: string, volume: number) => {
        updateClip(clipId, { volume });
    }, [updateClip]);
    
    const selectedClip = selectedClipId ? state.clips[selectedClipId] : null;
    const [masterLevel, setMasterLevel] = useState(0);
    const audibleTrackIds = useMemo(
        () => resolveAudibleTrackIds(audioTracks, soloTrackIds),
        [audioTracks, soloTrackIds]
    );

    useEffect(() => {
        if (!isPlaying) {
            setMasterLevel(0);
            return;
        }

        let rafId = 0;

        const tick = () => {
            setMasterLevel(audioEngine.getAudioLevels());
            rafId = requestAnimationFrame(tick);
        };

        tick();

        return () => cancelAnimationFrame(rafId);
    }, [isPlaying]);

    const masterBars = useMemo(() => buildMasterMeterBars(masterLevel, 4), [masterLevel]);
    
    return (
        <div className={`bg-[#09090b] border-l border-[#27272a] flex flex-col ${className || ''}`}>
            <div className="h-10 border-b border-[#27272a] flex items-center px-3 bg-[#18181b]">
                <Speaker size={14} className="text-emerald-400 mr-2" />
                <span className="text-xs font-semibold text-white">Audio Mixer</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {audioTracks.map(track => {
                    const isSolo = soloTrackIds.has(track.id);
                    const isMuted = !audibleTrackIds.has(track.id);
                    const volume = track.volume ?? 1;
                    const pan = (track as any).pan ?? 0;
                    
                    const trackClips = track.clips
                        .map(ref => state.clips[ref.id])
                        .filter(Boolean);
                    const meterLevel = buildTrackMeterLevel({
                        masterLevel,
                        isPlaying,
                        currentTime,
                        trackVolume: volume,
                        isMuted,
                        clips: trackClips.map((clip) => ({
                            start: clip.start,
                            duration: clip.duration,
                            volume: clip.volume,
                        })),
                    });
                    
                    return (
                        <div 
                            key={track.id}
                            className={`bg-[#18181b] rounded-lg p-3 border transition-colors ${
                                isMuted ? 'border-[#27272a] opacity-50' : 'border-emerald-500/30'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-gray-500' : 'bg-emerald-400'}`} />
                                    <span className="text-xs font-medium text-gray-300 truncate max-w-[100px]">
                                        {track.name || `${track.trackType === 'audio' ? 'Audio' : 'Video'} Track`}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleMuteToggle(track.id, !!track.muted)}
                                        className={`p-1 rounded transition-colors ${
                                            track.muted 
                                                ? 'bg-red-500/20 text-red-400' 
                                                : 'hover:bg-[#27272a] text-gray-400'
                                        }`}
                                        title="Mute (M)"
                                    >
                                        {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    
                                    <button
                                        onClick={() => handleSoloToggle(track.id)}
                                        className={`p-1 rounded transition-colors ${
                                            isSolo 
                                                ? 'bg-yellow-500/20 text-yellow-400' 
                                                : 'hover:bg-[#27272a] text-gray-400'
                                        }`}
                                        title="Solo (S)"
                                    >
                                        <Headphones size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-2 h-16 bg-[#27272a] rounded-full overflow-hidden relative">
                                        <div 
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all"
                                            style={{ height: `${volume * 100}%` }}
                                        />
                                        <div 
                                            className="absolute bottom-0 w-full bg-emerald-400/30 animate-pulse"
                                            style={{ height: `${meterLevel * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-gray-500">{Math.round(volume * 100)}%</span>
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Volume2 size={10} className="text-gray-500" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.01"
                                            value={volume}
                                            onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                                            className="flex-1 h-1 bg-[#27272a] rounded-full appearance-none cursor-pointer
                                                [&::-webkit-slider-thumb]:appearance-none
                                                [&::-webkit-slider-thumb]:w-3
                                                [&::-webkit-slider-thumb]:h-3
                                                [&::-webkit-slider-thumb]:rounded-full
                                                [&::-webkit-slider-thumb]:bg-emerald-400
                                                [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-gray-500 w-3">L</span>
                                        <input
                                            type="range"
                                            min="-1"
                                            max="1"
                                            step="0.1"
                                            value={pan}
                                            onChange={(e) => handlePanChange(track.id, parseFloat(e.target.value))}
                                            className="flex-1 h-1 bg-[#27272a] rounded-full appearance-none cursor-pointer
                                                [&::-webkit-slider-thumb]:appearance-none
                                                [&::-webkit-slider-thumb]:w-2.5
                                                [&::-webkit-slider-thumb]:h-2.5
                                                [&::-webkit-slider-thumb]:rounded-full
                                                [&::-webkit-slider-thumb]:bg-blue-400
                                                [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <span className="text-[9px] text-gray-500 w-3">R</span>
                                    </div>
                                </div>
                            </div>
                            
                            {trackClips.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-[#27272a]">
                                    <div className="text-[9px] text-gray-500 mb-1">Clips ({trackClips.length})</div>
                                    <div className="flex flex-wrap gap-1">
                                        {trackClips.slice(0, 4).map(clip => (
                                            <div 
                                                key={clip.id}
                                                className={`text-[8px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                                    clip.id === selectedClipId 
                                                        ? 'bg-white text-black' 
                                                        : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                                                }`}
                                                title={`${clip.content || 'Clip'} - Vol: ${Math.round((clip.volume ?? 1) * 100)}%`}
                                            >
                                                {(clip.volume ?? 1) * 100}%
                                            </div>
                                        ))}
                                        {trackClips.length > 4 && (
                                            <span className="text-[8px] text-gray-500 px-1">
                                                +{trackClips.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {audioTracks.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                        No audio tracks available
                    </div>
                )}
            </div>
            
            {selectedClip && (
                <div className="border-t border-[#27272a] p-3 bg-[#18181b]">
                    <div className="text-[10px] text-gray-400 mb-2">Selected Clip</div>
                    <div className="flex items-center gap-2">
                        <Volume2 size={12} className="text-gray-500" />
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={selectedClip.volume ?? 1}
                            onChange={(e) => handleClipVolumeChange(selectedClip.id, parseFloat(e.target.value))}
                            className="flex-1 h-1 bg-[#27272a] rounded-full appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-3
                                [&::-webkit-slider-thumb]:h-3
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-white
                                [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400 w-8 text-right">
                            {Math.round((selectedClip.volume ?? 1) * 100)}%
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] text-gray-500">Fade In:</span>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={selectedClip.fadeIn ?? 0}
                            onChange={(e) => updateClip(selectedClip.id, { fadeIn: parseFloat(e.target.value) })}
                            className="flex-1 h-1 bg-[#27272a] rounded-full appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-2
                                [&::-webkit-slider-thumb]:h-2
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-amber-400"
                        />
                        <span className="text-[9px] text-gray-400">{(selectedClip.fadeIn ?? 0).toFixed(1)}s</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-500">Fade Out:</span>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={selectedClip.fadeOut ?? 0}
                            onChange={(e) => updateClip(selectedClip.id, { fadeOut: parseFloat(e.target.value) })}
                            className="flex-1 h-1 bg-[#27272a] rounded-full appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-2
                                [&::-webkit-slider-thumb]:h-2
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-amber-400"
                        />
                        <span className="text-[9px] text-gray-400">{(selectedClip.fadeOut ?? 0).toFixed(1)}s</span>
                    </div>
                </div>
            )}
            
            <div className="h-8 border-t border-[#27272a] flex items-center justify-center gap-4 bg-[#18181b]">
                <div className="flex items-center gap-1">
                    <Gauge size={10} className="text-emerald-400" />
                    <span className="text-[9px] text-gray-400">Master</span>
                </div>
                <div className="flex gap-1">
                    {masterBars.map((level, i) => (
                        <div 
                            key={i}
                            className="w-1.5 h-4 bg-[#27272a] rounded-sm overflow-hidden"
                        >
                            <div 
                                className="w-full bg-emerald-400 transition-all"
                                style={{ height: `${level * 100}%`, marginTop: `${(1 - level) * 100}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AudioMixer;
