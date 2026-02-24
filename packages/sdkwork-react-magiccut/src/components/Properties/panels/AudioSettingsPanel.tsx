
import React from 'react';
import { Volume2, VolumeX, Activity, Mic2, BarChart2, Zap, SlidersHorizontal, Clock, FastForward, Rewind } from 'lucide-react';
import { PropertySection, ScrubbableInput, ActionButton } from '../widgets/PropertyWidgets';
;
import { AnyMediaResource } from 'sdkwork-react-commons';
import { CutClip } from '../../../entities/magicCut.entity';
import { useMagicCutStore } from '../../../store/magicCutStore';

interface AudioSettingsPanelProps {
    clip: CutClip;
    resource: AnyMediaResource;
    onUpdate: (updates: Partial<CutClip>) => void;
    onUpdateResource: (updates: Partial<AnyMediaResource>) => void;
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({ clip, resource, onUpdate, onUpdateResource }) => {
    // Access store actions directly to use specific business logic (speed recalculation)
    const { setClipSpeed } = useMagicCutStore();
    
    const volume = clip.volume ?? 1;
    const isMuted = clip.muted ?? false;
    const fadeIn = clip.fadeIn ?? 0;
    const fadeOut = clip.fadeOut ?? 0;
    const speed = clip.speed ?? 1;
    
    // Metadata access for audio effects state
    const meta = resource.metadata || {};
    const isDenoiseEnabled = meta.denoise || false;
    const isNormalizeEnabled = meta.normalize || false;

    const toggleMeta = (key: string, val: boolean) => {
         onUpdateResource({ 
             metadata: { ...meta, [key]: val } 
         });
    };

    // Visual calculation for the volume bar
    const getVisualPercent = (vol: number) => {
        if (vol <= 1) return vol * 50;
        return 50 + ((vol - 1) / 4) * 50;
    };
    
    const getVolumeFromSlider = (percent: number) => {
        const p = percent / 100;
        if (p <= 0.5) return p * 2;
        return 1 + (p - 0.5) * 8; 
    };

    const isAmplified = volume > 1.0;
    const PRESET_SPEEDS = [0.5, 1.0, 1.5, 2.0, 4.0];

    return (
        <>
            {/* Main Audio Controls */}
            <PropertySection title="Mixer" defaultOpen>
                <div className="space-y-4">
                    {/* Volume & Mute Row */}
                    <div className="flex items-center gap-3">
                         <div className="flex-1 space-y-2">
                             <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Volume2 size={12} className={isAmplified ? "text-yellow-500" : ""} /> 
                                    Volume
                                </span>
                                <span className={`font-mono ${isAmplified ? "text-yellow-400 font-bold" : ""}`}>
                                    {Math.round(volume * 100)}%
                                </span>
                             </div>
                             
                             <div className={`relative h-2 rounded-full overflow-hidden bg-[#252526] border border-[#333] group`}>
                                 {/* Native range input for interaction, mapped visually via CSS */}
                                 <input 
                                    type="range" 
                                    min="0" max="100" step="0.1" 
                                    value={getVisualPercent(volume)} 
                                    onChange={(e) => onUpdate({ volume: getVolumeFromSlider(parseFloat(e.target.value)) })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    disabled={isMuted}
                                 />
                                 
                                 {/* Unity Gain Marker (100%) */}
                                 <div className="absolute top-0 bottom-0 w-[2px] bg-[#444] z-10" style={{ left: '50%' }} />

                                 {/* Active Bar */}
                                 <div 
                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-75 
                                        ${isMuted 
                                            ? 'bg-red-900' 
                                            : isAmplified ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-yellow-500' : 'bg-blue-600'
                                        }`} 
                                    style={{ width: `${getVisualPercent(volume)}%` }}
                                 />
                             </div>
                             
                             <div className="flex justify-between text-[9px] text-gray-600 px-0.5">
                                 <span>0%</span>
                                 <span>100%</span>
                                 <span>500%</span>
                             </div>
                         </div>
                         
                         <button 
                            onClick={() => onUpdate({ muted: !isMuted })}
                            className={`
                                w-8 h-8 flex items-center justify-center rounded-lg border mt-3 transition-all
                                ${isMuted 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                    : 'bg-[#252526] border-[#333] text-gray-400 hover:text-white'
                                }
                            `}
                            title={isMuted ? "Unmute" : "Mute"}
                         >
                             {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                         </button>
                    </div>

                    <div className="h-px bg-[#1f1f22]" />

                    {/* Fades */}
                    <div className="grid grid-cols-2 gap-3">
                        <ScrubbableInput 
                            label="Fade In" 
                            value={fadeIn} 
                            onChange={(v) => onUpdate({ fadeIn: Math.max(0, v) })} 
                            step={0.1} min={0} max={clip.duration / 2} 
                            suffix="s"
                            icon={<Activity size={10} className="text-gray-500" />}
                        />
                        <ScrubbableInput 
                            label="Fade Out" 
                            value={fadeOut} 
                            onChange={(v) => onUpdate({ fadeOut: Math.max(0, v) })} 
                            step={0.1} min={0} max={clip.duration / 2} 
                            suffix="s"
                            icon={<Activity size={10} className="text-gray-500 scale-x-[-1]" />}
                        />
                    </div>
                </div>
            </PropertySection>

            {/* AI Audio Tools */}
            <PropertySection title="AI Enhance">
                 <div className="space-y-2">
                     <button 
                        onClick={() => toggleMeta('denoise', !isDenoiseEnabled)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${isDenoiseEnabled ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-[#1a1a1c] border-[#27272a] text-gray-400'}`}
                     >
                         <span className="text-[10px] font-medium flex items-center gap-2">
                             <Zap size={12} className={isDenoiseEnabled ? "fill-purple-500" : ""} /> AI Denoise
                         </span>
                         <div className={`w-2 h-2 rounded-full ${isDenoiseEnabled ? 'bg-purple-500 shadow-sm' : 'bg-[#333]'}`} />
                     </button>
                     
                     <button 
                        onClick={() => toggleMeta('normalize', !isNormalizeEnabled)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${isNormalizeEnabled ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-[#1a1a1c] border-[#27272a] text-gray-400'}`}
                     >
                         <span className="text-[10px] font-medium flex items-center gap-2">
                             <BarChart2 size={12} /> Normalize Loudness
                         </span>
                         <div className={`w-2 h-2 rounded-full ${isNormalizeEnabled ? 'bg-blue-500 shadow-sm' : 'bg-[#333]'}`} />
                     </button>
                 </div>
            </PropertySection>

            {/* Speed & Properties */}
            <PropertySection title="Properties">
                <div className="space-y-4">
                    {/* Rich Speed Control - USING setClipSpeed from Store */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} /> Speed
                            </label>
                            <div className="w-16">
                                <ScrubbableInput 
                                    value={speed} 
                                    onChange={(v) => setClipSpeed(clip.id, Math.max(0.1, v))} 
                                    step={0.1} min={0.1} max={5} 
                                    suffix="x"
                                />
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="h-6 flex items-center gap-3 bg-[#18181b] border border-[#27272a] rounded-lg px-2 group">
                            <span className="text-[9px] text-gray-500"><Rewind size={10} /></span>
                            <div className="flex-1 relative h-4 flex items-center">
                                <input 
                                    type="range" 
                                    min="0.1" max="4" step="0.1"
                                    value={speed}
                                    onChange={(e) => setClipSpeed(clip.id, parseFloat(e.target.value))}
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-75" 
                                        style={{ width: `${((Math.min(4, speed) - 0.1) / 3.9) * 100}%` }} 
                                    />
                                </div>
                                <div 
                                    className="absolute w-2 h-2 bg-white rounded-full shadow pointer-events-none transition-all duration-75"
                                    style={{ left: `${((Math.min(4, speed) - 0.1) / 3.9) * 100}%`, transform: 'translateX(-50%)' }}
                                />
                                {/* Center Marker (1x) */}
                                <div className="absolute left-[23%] top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-[#444]" /> 
                            </div>
                            <span className="text-[9px] text-gray-500"><FastForward size={10} /></span>
                        </div>

                        {/* Presets */}
                        <div className="flex bg-[#18181b] p-0.5 rounded-lg border border-[#27272a]">
                            {PRESET_SPEEDS.map(val => (
                                <button
                                    key={val}
                                    onClick={() => setClipSpeed(clip.id, val)}
                                    className={`
                                        flex-1 py-1 text-[9px] font-medium rounded transition-all
                                        ${Math.abs(speed - val) < 0.01 
                                            ? 'bg-[#333] text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-[#252526]'
                                        }
                                    `}
                                >
                                    {val}x
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Precise numeric volume control for advanced users */}
                    <div className="pt-2 border-t border-[#1f1f22]">
                        <ScrubbableInput 
                            label="Gain (Numeric)" 
                            value={volume} 
                            onChange={(v) => onUpdate({ volume: Math.max(0, Math.min(5, v)) })} 
                            step={0.01} min={0} max={5} 
                            suffix="x"
                            fullWidth
                            className="bg-[#121214]"
                        />
                    </div>

                    <ActionButton 
                        label="Open Equalizer" 
                        icon={<SlidersHorizontal />} 
                        onClick={() => {}} 
                        className="w-full"
                    />
                </div>
            </PropertySection>
        </>
    );
};

