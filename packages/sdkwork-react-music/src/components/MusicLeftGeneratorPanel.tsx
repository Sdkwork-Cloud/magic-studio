
import { PromptTextInput } from 'sdkwork-react-assets'
import React from 'react';
import { useMusicStore } from '../store/musicStore';
import { MusicModelSelector } from './MusicModelSelector';
import { MUSIC_STYLES } from '../constants';
import { Music, Loader2, Sparkles, Mic2, Guitar, ToggleLeft, ToggleRight, Type, ListMusic } from 'lucide-react';
import { useTranslation } from 'sdkwork-react-i18n';

export const MusicLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useMusicStore();
    const { t } = useTranslation();

    const handleStyleTag = (styleValue: string) => {
        const current = config.style || '';
        const parts = current.split(',').map(s => s.trim()).filter(Boolean);
        if (!parts.includes(styleValue)) {
            const newVal = parts.length > 0 ? `${current}, ${styleValue}` : styleValue;
            setConfig({ style: newVal });
        }
    };

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10">
                            <Music size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">{t('studio.music.title')}</h2>
                            <span className="text-[10px] text-gray-500 font-medium">AI Audio Generation</span>
                        </div>
                    </div>
                    
                    <MusicModelSelector 
                        value={config.model} 
                        onChange={(model) => setConfig({ model: model as any })}
                        className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                    />
                </div>

                <div className="px-6 pb-2">
                    <div className="flex items-center justify-between p-1 bg-[#18181b] border border-[#27272a] rounded-lg">
                        <button onClick={() => setConfig({ customMode: false })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${!config.customMode ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                            <Sparkles size={12} /> {t('studio.music.simple_mode')}
                        </button>
                        <button onClick={() => setConfig({ customMode: true })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${config.customMode ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                            <ListMusic size={12} /> {t('studio.music.custom_mode')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                {!config.customMode ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                         <div>
                            <Label icon={<Sparkles size={12} className="text-yellow-500" />}>{t('studio.music.description')}</Label>
                            <PromptTextInput label={null} placeholder="A chill lofi beat to study to, raining outside, cozy vibes..." value={config.prompt} onChange={(val) => setConfig({ prompt: val })} disabled={isGenerating} rows={6} className="bg-[#121214]" />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2.5 bg-[#18181b] border border-[#27272a] rounded-xl">
                            <span className="text-xs font-medium text-gray-300">{t('studio.music.instrumental')}</span>
                            <button onClick={() => setConfig({ instrumental: !config.instrumental })} className={`text-2xl transition-colors ${config.instrumental ? 'text-green-500' : 'text-gray-600'}`}>
                                {config.instrumental ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label icon={<Mic2 size={12} />}>{t('studio.music.lyrics')}</Label>
                                <button className="text-[10px] text-gray-500 hover:text-indigo-400 transition-colors">Generate</button>
                            </div>
                            <textarea value={config.lyrics} onChange={(e) => setConfig({ lyrics: e.target.value })} placeholder="Enter lyrics or leave empty..." className="w-full bg-[#121214] border border-[#27272a] rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 min-h-[160px] resize-y placeholder-gray-600" disabled={isGenerating} />
                        </div>
                        <div>
                            <Label icon={<Guitar size={12} />}>{t('studio.music.style')}</Label>
                            <input type="text" value={config.style} onChange={(e) => setConfig({ style: e.target.value })} placeholder="Pop, Rock, Electronic, Upbeat..." className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600 mb-3" disabled={isGenerating} />
                            <div className="flex flex-wrap gap-2">
                                {MUSIC_STYLES.map(style => (
                                    <button key={style.id} onClick={() => handleStyleTag(style.id)} className="text-[10px] px-2 py-1 bg-[#18181b] hover:bg-[#252526] border border-[#27272a] rounded-md text-gray-400 hover:text-white transition-colors">{style.label}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label icon={<Type size={12} />}>{t('studio.music.track_title')}</Label>
                            <input type="text" value={config.title} onChange={(e) => setConfig({ title: e.target.value })} placeholder="Song Title" className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600" disabled={isGenerating} />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button onClick={generate} disabled={isGenerating || (!config.prompt && !config.lyrics && !config.style)} className={`w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${isGenerating ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/20 active:scale-[0.98]'}`}>
                    {isGenerating ? (<><Loader2 size={18} className="animate-spin" /><span>{t('studio.common.creating')}</span></>) : (<><Sparkles size={16} fill="currentColor" /><span>{t('studio.common.create')}</span></>)}
                </button>
            </div>
        </>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">{icon}{children}</label>
);
