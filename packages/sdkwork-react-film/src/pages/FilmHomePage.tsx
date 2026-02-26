
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilmSidebar } from '../components/FilmSidebar';
import { FilmHeader } from '../components/FilmHeader';
import { Sparkles, Play, Heart, ChevronDown, Clock, Check, Type } from 'lucide-react';
import { useFilmStore, FilmStoreProvider } from '../store/filmStore';
import { CreationChatInput, InputFooterButton, PortalTab, InputAttachment, StyleSelector } from '@sdkwork/react-assets';
import { generateUUID, ModelSelector, AspectRatioSelector, AspectRatio, GalleryCard, GalleryItem, StyleOption } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';
import { VIDEO_PROVIDERS } from '@sdkwork/react-video';
import { IMAGE_PROVIDERS } from '@sdkwork/react-image';
import { FILM_STYLES } from '../constants';
import { useRouter, ROUTES, uploadHelper } from '@sdkwork/react-core';

type Resolution = '2k' | '4k';

// Mapped to GalleryItem structure
const MOCK_SHORTS: GalleryItem[] = [
    { 
        id: '1', title: 'Global AI Creation', type: 'short', url: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=800&auto=format&fit=crop', 
        aspectRatio: '16:10', 
        author: { id: 'u1', name: 'CCTV_AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cctv' }, 
        stats: { likes: 1200, views: '10k' }, 
        prompt: '', model: '', createdAt: Date.now(),
        badges: [{ text: 'Featured', color: 'bg-red-600' }]
    },
    { 
        id: '2', title: 'Journey to the West Reimagined', type: 'short', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop', 
        aspectRatio: '16:10', 
        author: { id: 'u2', name: 'Director_Li', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' }, 
        stats: { likes: 856, views: '5k' }, 
        prompt: '', model: '', createdAt: Date.now(),
        badges: [{ text: 'Trending', color: 'bg-orange-500' }]
    },
    { 
        id: '3', title: 'Zootopia: Origins', type: 'short', url: 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=800&auto=format&fit=crop', 
        aspectRatio: '16:10', 
        author: { id: 'u3', name: 'DisneyFan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=disney' }, 
        stats: { likes: 4500, views: '50k' }, 
        prompt: '', model: '', createdAt: Date.now(),
        badges: [{ text: 'Fan Film', color: 'bg-blue-600' }]
    },
    { 
        id: '4', title: 'Cyberpunk 2078', type: 'short', url: 'https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=800&auto=format&fit=crop', 
        aspectRatio: '16:10', 
        author: { id: 'u4', name: 'NeoTokyo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neo' }, 
        stats: { likes: 3200, views: '22k' }, 
        prompt: '', model: '', createdAt: Date.now(),
        badges: [{ text: 'Sci-Fi', color: 'bg-purple-600' }]
    },
];

const ACTIVE_USERS = [
    { name: 'FengMo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=feng' },
    { name: 'CatHero', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat_eng' },
    { name: 'SanTiCreator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=san' },
    { name: 'CatWineMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jiu' },
];

const FilmHomePageContent: React.FC = () => {
    const { navigate } = useRouter();
    const { createProject, createProjectFromInput } = useFilmStore();
    
    // Hero Input State
    const [activeTab, setActiveTab] = useState<PortalTab>('short_drama');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Config State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [resolution, setResolution] = useState<Resolution>('2k');
    const [duration, setDuration] = useState('5s');
    const [activeStyle, setActiveStyle] = useState('realistic');
    const [activeModel, setActiveModel] = useState<string>('');
    const [attachments, setAttachments] = useState<InputAttachment[]>([]);
    
    // Menus
    const [showDurationMenu, setShowDurationMenu] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    // Determine current providers based on tab
    const currentProviders = useMemo(() => {
        if (activeTab === 'image') return IMAGE_PROVIDERS;
        return VIDEO_PROVIDERS; 
    }, [activeTab]);

    useEffect(() => {
        const firstModel = currentProviders[0]?.models[0]?.id;
        if (firstModel) setActiveModel(firstModel);
    }, [currentProviders]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
             if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
                 setShowDurationMenu(false);
             }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim() && attachments.length === 0) return;
        
        setIsGenerating(true);
        
        try {
            if (activeTab === 'short_drama') {
                 const scriptAttachment = attachments.find(a => a.type === 'script');
                 if (scriptAttachment && scriptAttachment.url) {
                      const res = await fetch(scriptAttachment.url);
                      const text = await res.text();
                      const name = prompt.slice(0, 30) || scriptAttachment.name.replace(/\.[^/.]+$/, "") || "New Short Drama";
                      await createProjectFromInput(name, text);
                 } else {
                      await createProject(prompt.slice(0, 30) || "New Short Drama"); 
                 }
                 navigate(ROUTES.FILM_EDITOR);
            } else {
                 // Placeholder for simple video/image gen flow
                 setTimeout(() => {
                    setIsGenerating(false);
                    // Navigate to respective tool
                    if (activeTab === 'video') navigate(ROUTES.VIDEO);
                    else navigate(ROUTES.IMAGE);
                 }, 1000);
            }
        } catch (e) {
            console.error(e);
            setIsGenerating(false);
        }
    };

    const handleUpload = async () => {
        try {
            const accept = activeTab === 'short_drama' 
                ? 'image/*, video/*, .txt, .md, .doc, .docx, .pdf'
                : 'image/*, video/*';

            const files = await uploadHelper.pickFiles(false, accept);
            if (files.length > 0) {
                const file = files[0];
                let type: InputAttachment['type'] = 'file';
                const ext = file.name.split('.').pop()?.toLowerCase() || '';

                if (['jpg', 'png', 'jpeg', 'webp'].includes(ext)) type = 'image';
                else if (['mp4', 'mov', 'webm'].includes(ext)) type = 'video';
                else if (['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext)) type = 'script';
                
                let url = URL.createObjectURL(new Blob([new Uint8Array(file.data)]));
                
                if (type === 'script' && activeTab === 'short_drama') {
                    if (!prompt) setPrompt(`Based on script: ${file.name}...`);
                }

                setAttachments([...attachments, {
                    id: generateUUID(),
                    name: file.name,
                    type,
                    url
                }]);
            }
        } catch (e) { console.error(e); }
    };

    const handleRemoveAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    // --- Footer Controls Configuration ---
    const renderFooterControls = () => {
        return (
            <div className="flex items-center gap-2 whitespace-nowrap">
                
                {/* 1. Model Selector (Generic) */}
                <ModelSelector 
                    value={activeModel}
                    onChange={setActiveModel}
                    providers={currentProviders}
                    className="min-w-[140px] border-transparent bg-[#1a1a1c] hover:bg-[#202022] text-xs h-[30px] rounded-full px-1 hover:border-[#333]"
                />

                {/* 2. Style Selector */}
                {activeTab === 'short_drama' && (
                    <StyleSelector 
                        value={activeStyle}
                        onChange={setActiveStyle}
                        options={FILM_STYLES}
                        className="bg-[#1a1a1c] border-transparent hover:bg-[#202022] h-[30px] hover:border-[#333]"
                    />
                )}

                {/* 3. Aspect Ratio */}
                <AspectRatioSelector 
                    value={aspectRatio}
                    onChange={setAspectRatio}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    className="bg-[#1a1a1c] hover:bg-[#202022] hover:border-[#333] border-transparent"
                />

                {/* 4. Duration */}
                {(activeTab === 'video' || activeTab === 'short_drama') && (
                    <div className="relative" ref={durationMenuRef}>
                        <button 
                            onClick={() => setShowDurationMenu(!showDurationMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1c] hover:bg-[#202022] rounded-full text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors border border-transparent hover:border-[#333]"
                        >
                            <Clock size={14} />
                            <span>{duration}</span>
                        </button>
                        {showDurationMenu && (
                             <div className="absolute bottom-full left-0 mb-2 w-32 bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-75">
                                {['5s', '10s', '15s', '60s'].map(d => (
                                    <button 
                                        key={d} 
                                        onClick={() => { setDuration(d); setShowDurationMenu(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-[#27272a] ${duration === d ? 'text-blue-400' : 'text-gray-400'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const getGradient = (tab: string) => {
        switch(tab) {
             case 'short_drama': return 'from-orange-600/40 via-red-600/40 to-yellow-500/40';
             case 'video': return 'from-pink-500/30 via-rose-500/30 to-red-500/30';
             case 'image': return 'from-blue-400/30 via-cyan-500/30 to-teal-400/30';
             default: return 'from-gray-500/20 to-gray-400/20';
        }
    };

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
            <FilmSidebar />

            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <FilmHeader />
                
                <div className="absolute inset-0 pointer-events-none z-0">
                     <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1033]/30 via-[#0a0a0a]/80 to-[#050505]" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
                    <div className="max-w-[1400px] mx-auto flex flex-col items-center">
                        
                        <div className="w-full mt-10 mb-8 text-center space-y-6">
                            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-xl opacity-90">
                                What story will you create today?
                            </h1>
                            
                            <div className="max-w-[1200px] mx-auto w-full">
                                <CreationChatInput 
                                    value={prompt}
                                    onChange={setPrompt}
                                    isGenerating={isGenerating}
                                    onGenerate={handleGenerate}
                                    className="shadow-2xl shadow-purple-900/20"
                                    autoFocus={true}
                                    variant="hero"
                                    footerControls={renderFooterControls()}
                                    onUpload={handleUpload}
                                    attachments={attachments}
                                    onRemoveAttachment={handleRemoveAttachment}
                                    glowClassName={getGradient(activeTab)}
                                    placeholder={activeTab === 'short_drama' ? "Describe your story idea, or upload a script file..." : "Describe your creation..."}
                                />
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-4 opacity-70">
                                {ACTIVE_USERS.map((u, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
                                        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                                            <img src={u.avatar} alt={u.name} />
                                        </div>
                                        <span>{u.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full mt-12 pb-20">
                            <div className="flex items-center gap-2 mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    Creation Plaza <Sparkles size={16} className="text-yellow-500 fill-yellow-500" />
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {MOCK_SHORTS.map(item => (
                                    <GalleryCard 
                                        key={item.id} 
                                        item={item} 
                                        onClick={(it) => setSelectedItem(it)}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {selectedItem && (
                    <GenerationPreview 
                        mode="view"
                        galleryItem={selectedItem}
                        relatedItems={MOCK_SHORTS}
                        onClose={() => setSelectedItem(null)} 
                    />
                )}
            </div>
        </div>
    );
};

const FilmHomePage: React.FC = () => {
    return (
        <FilmStoreProvider>
            <FilmHomePageContent />
        </FilmStoreProvider>
    );
};

export default FilmHomePage;
