
import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Activity, BarChart2, Zap, SlidersHorizontal, Clock, FastForward, Rewind } from 'lucide-react';
import { PropertySection, ScrubbableInput, ActionButton, SliderRow } from '../widgets/PropertyWidgets';
;
import { CutClip } from '../../../entities/magicCut.entity';
import { useMagicCutStore } from '../../../store/magicCutStore';
import {
    resolveAudioEnhancementActive,
    resolveEqSettings,
    resetEqSettings,
    setEqEnabled,
    toggleAudioEnhancement,
    updateEqBandGain
} from '../../../domain/audio/audioEffectState';
import { useMagicCutTranslation } from '../../../hooks/useMagicCutTranslation';

interface AudioSettingsPanelProps {
    clip: CutClip;
    onUpdate: (updates: Partial<CutClip>) => void;
}

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({ clip, onUpdate }) => {
    const { t } = useMagicCutTranslation();
    // Access store actions directly to use specific business logic (speed recalculation)
    const { setClipSpeed } = useMagicCutStore();
    const [equalizerOpen, setEqualizerOpen] = useState(false);
    
    const volume = clip.volume ?? 1;
    const isMuted = clip.muted ?? false;
    const fadeIn = clip.fadeIn ?? 0;
    const fadeOut = clip.fadeOut ?? 0;
    const speed = clip.speed ?? 1;
    const audioEffects = clip.audioEffects || [];
    const eqSettings = resolveEqSettings(audioEffects);
    const isDenoiseEnabled = resolveAudioEnhancementActive(audioEffects, 'denoise');
    const isNormalizeEnabled = resolveAudioEnhancementActive(audioEffects, 'normalize');

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

    useEffect(() => {
        setEqualizerOpen(eqSettings.enabled);
    }, [clip.id, eqSettings.enabled]);

    const updateAudioEffects = (nextEffects: CutClip['audioEffects']) => {
        onUpdate({ audioEffects: nextEffects });
    };

    const toggleEnhancement = (enhancement: 'denoise' | 'normalize') => {
        updateAudioEffects(toggleAudioEnhancement(audioEffects, enhancement));
    };

    const toggleEqualizerPanel = () => {
        const nextOpen = !equalizerOpen;
        setEqualizerOpen(nextOpen);
        if (nextOpen && !eqSettings.enabled) {
            updateAudioEffects(setEqEnabled(audioEffects, true));
        }
    };

    const closeEqualizer = () => {
        setEqualizerOpen(false);
        updateAudioEffects(setEqEnabled(audioEffects, false));
    };

    return (
        <>
            {/* Main Audio Controls */}
            <PropertySection title={t('audioSettings.sections.mixer')} defaultOpen>
                <div className="space-y-4">
                    {/* Volume & Mute Row */}
                    <div className="flex items-center gap-3">
                         <div className="flex-1 space-y-2">
                             <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Volume2 size={12} className={isAmplified ? "text-yellow-500" : ""} /> 
                                    {t('audioSettings.fields.volume')}
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
                            title={isMuted ? t('audioSettings.actions.unmute') : t('audioSettings.actions.mute')}
                         >
                             {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                         </button>
                    </div>

                    <div className="h-px bg-[#1f1f22]" />

                    {/* Fades */}
                    <div className="grid grid-cols-2 gap-3">
                        <ScrubbableInput 
                            label={t('audioSettings.fields.fadeIn')} 
                            value={fadeIn} 
                            onChange={(v) => onUpdate({ fadeIn: Math.max(0, v) })} 
                            step={0.1} min={0} max={clip.duration / 2} 
                            suffix="s"
                            icon={<Activity size={10} className="text-gray-500" />}
                        />
                        <ScrubbableInput 
                            label={t('audioSettings.fields.fadeOut')} 
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
            <PropertySection title={t('audioSettings.sections.enhance')}>
                 <div className="space-y-2">
                     <button 
                        onClick={() => toggleEnhancement('denoise')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${isDenoiseEnabled ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-[#1a1a1c] border-[#27272a] text-gray-400'}`}
                     >
                         <span className="text-[10px] font-medium flex items-center gap-2">
                             <Zap size={12} className={isDenoiseEnabled ? "fill-purple-500" : ""} /> {t('audioSettings.fields.denoise')}
                         </span>
                         <div className={`w-2 h-2 rounded-full ${isDenoiseEnabled ? 'bg-purple-500 shadow-sm' : 'bg-[#333]'}`} />
                     </button>
                     
                     <button 
                        onClick={() => toggleEnhancement('normalize')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${isNormalizeEnabled ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-[#1a1a1c] border-[#27272a] text-gray-400'}`}
                     >
                         <span className="text-[10px] font-medium flex items-center gap-2">
                             <BarChart2 size={12} /> {t('audioSettings.fields.normalize')}
                         </span>
                         <div className={`w-2 h-2 rounded-full ${isNormalizeEnabled ? 'bg-blue-500 shadow-sm' : 'bg-[#333]'}`} />
                     </button>
                 </div>
            </PropertySection>

            {/* Speed & Properties */}
            <PropertySection title={t('audioSettings.sections.properties')}>
                <div className="space-y-4">
                    {/* Rich Speed Control - USING setClipSpeed from Store */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} /> {t('audioSettings.fields.speed')}
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
                            label={t('audioSettings.fields.gainNumeric')} 
                            value={volume} 
                            onChange={(v) => onUpdate({ volume: Math.max(0, Math.min(5, v)) })} 
                            step={0.01} min={0} max={5} 
                            suffix="x"
                            fullWidth
                            className="bg-[#121214]"
                        />
                    </div>

                    <ActionButton 
                        label={eqSettings.enabled ? t('audioSettings.fields.equalizerEnabled') : t('audioSettings.fields.openEqualizer')} 
                        icon={<SlidersHorizontal />} 
                        onClick={toggleEqualizerPanel}
                        variant={eqSettings.enabled ? 'primary' : 'secondary'}
                        className="w-full"
                    />

                    {equalizerOpen && (
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                                        {t('audioSettings.eq.title')}
                                    </div>
                                    <p className="mt-1 text-[10px] leading-4 text-blue-100/70">
                                        {t('audioSettings.eq.description')}
                                    </p>
                                </div>
                                <button
                                    onClick={closeEqualizer}
                                    className="rounded-md border border-blue-400/20 px-2 py-1 text-[10px] font-medium text-blue-100/80 transition-colors hover:bg-blue-400/10"
                                >
                                    {t('audioSettings.actions.bypass')}
                                </button>
                            </div>

                            <div className="mt-3 space-y-3">
                                <SliderRow
                                    label={t('audioSettings.fields.low')}
                                    value={eqSettings.lowGain}
                                    onChange={(value) => updateAudioEffects(updateEqBandGain(audioEffects, 'lowGain', value))}
                                    min={-12}
                                    max={12}
                                    step={0.5}
                                    defaultValue={0}
                                />
                                <SliderRow
                                    label={t('audioSettings.fields.mid')}
                                    value={eqSettings.midGain}
                                    onChange={(value) => updateAudioEffects(updateEqBandGain(audioEffects, 'midGain', value))}
                                    min={-12}
                                    max={12}
                                    step={0.5}
                                    defaultValue={0}
                                />
                                <SliderRow
                                    label={t('audioSettings.fields.high')}
                                    value={eqSettings.highGain}
                                    onChange={(value) => updateAudioEffects(updateEqBandGain(audioEffects, 'highGain', value))}
                                    min={-12}
                                    max={12}
                                    step={0.5}
                                    defaultValue={0}
                                />
                            </div>

                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={() => updateAudioEffects(resetEqSettings(audioEffects))}
                                    className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    {t('audioSettings.actions.resetEq')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PropertySection>
        </>
    );
};

