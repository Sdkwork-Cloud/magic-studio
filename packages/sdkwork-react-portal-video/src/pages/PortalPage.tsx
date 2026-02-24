
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Minimize2, ChevronDown, Sparkles, Check, Clock, Quote, Clapperboard, Video, Image as ImageIcon, Smile, Music, Mic, Layers, ArrowRightLeft, Grid3x3 } from 'lucide-react';
import { useFilmStore, FilmStoreProvider } from 'sdkwork-react-film';
import { useRouter, ROUTES, uploadHelper, modelInfoService } from 'sdkwork-react-core';
import { useTranslation } from 'sdkwork-react-i18n';
import { FILM_STYLES, GEN_MODES } from '../constants';
import { CreationChatInput, InputFooterButton, PortalTab, InputAttachment, StyleSelector, ChooseAssetModal, assetService } from 'sdkwork-react-assets';
import { PortalSidebar, PortalHeader, ToolsGrid, CommunityGallery, StickyHeroBar } from '../index';
import { GalleryCard, GalleryItem, generateUUID, ModelSelector, AspectRatioSelector, Popover, Asset, GenerationType, getIconComponent } from 'sdkwork-react-commons';
import { GenerationPreview } from 'sdkwork-react-image';

const MOCK_SHORTS: GalleryItem[] = [
    { 
        id: '1', title: '全民AI春晚', type: 'short', url: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=800&auto=format&fit=crop', 
        aspectRatio: '16:10', 
        author: { id: 'u1', name: 'CCTV_AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cctv' }, 
        stats: { likes: 1200, views: '10k' }, 
        prompt: '', model: '', createdAt: Date.now(),
        badges: [{ text: '马年焕新', color: 'bg-red-600' }]
    },
    { 
        id: '2', title: '《今年在家待几天》', type: 'short', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop', 
        aspectRatio: '16:10', 
        author: { id: 'u2', name: 'Director_Li', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' }, 
        stats: { likes: 856, views: '5k' }, 
        prompt: '', model: '', createdAt: Date.now(),
        badges: [{ text: '春节温情', color: 'bg-orange-500' }]
    },
];

const ACTIVE_USERS = [
    { name: '风魔手', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=feng' },
    { name: '小猫教英语', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat_eng' },
    { name: '三生三世的羁绊', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=san' },
    { name: '小猫游九寨沟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jiu' },
];

const PortalContent: React.FC = () => {
    const { navigate } = useRouter();
    const { createProject, createProjectFromInput } = useFilmStore();
    const { t } = useTranslation();
    
    const [activeTab, setActiveTab] = useState<PortalTab>('short_drama');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [aspectRatio, setAspectRatio] = useState<any>('16:9');
    const [resolution, setResolution] = useState<any>('2k');
    const [duration, setDuration] = useState('5s');
    const [activeStyle, setActiveStyle] = useState('realistic');
    const [activeModel, setActiveModel] = useState<string>('');
    const [genMode, setGenMode] = useState<string>('text'); 
    
    const [attachments, setAttachments] = useState<InputAttachment[]>([]);
    
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    
    const [showAssetModal, setShowAssetModal] = useState(false);
    
    const [currentProviders, setCurrentProviders] = useState<ModelProvider[]>([]);

    const modeButtonRef = useRef<HTMLButtonElement>(null);
    const durationButtonRef = useRef<HTMLButtonElement>(null);
    const genModeButtonRef = useRef<HTMLButtonElement>(null);
    const editorRef = useRef<any>(null); 
    
    const [isHeroVisible, setIsHeroVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const heroSectionRef = useRef<HTMLDivElement>(null);
    
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const availableGenModes = useMemo(() => {
        return GEN_MODES.filter(m => m.validTabs.includes(activeTab));
    }, [activeTab]);

    const getGenerationType = (tab: PortalTab): GenerationType => {
        switch (tab) {
            case 'short_drama': return GenerationType.FILM;
            case 'video': return GenerationType.VIDEO;
            case 'image': return GenerationType.IMAGE;
            case 'human': return GenerationType.CHARACTER;
            case 'music': return GenerationType.MUSIC;
            case 'speech': return GenerationType.SPEECH;
            case 'one_click': return GenerationType.FILM;
            default: return GenerationType.VIDEO;
        }
    };

    useEffect(() => {
        const loadModels = async () => {
            const type = getGenerationType(activeTab);
            const result = await modelInfoService.getModelsByType(type);
            
            if (result.success && result.data) {
                const mappedProviders: ModelProvider[] = result.data.channels.map((ch, idx) => {
                    const IconComp = getIconComponent(ch.icon || 'Box');
                    return {
                        id: ch.name.toLowerCase().replace(/\s+/g, '-'),
                        name: ch.name,
                        icon: <IconComp size={14} />,
                        color: ch.color,
                        models: ch.models.map(m => ({
                            id: m.model,
                            name: m.model.split('-').slice(0, 2).join(' '),
                            description: m.description,
                            badge: m.badge,
                            badgeColor: m.badgeColor
                        }))
                    };
                });
                
                setCurrentProviders(mappedProviders);

                const allModels = mappedProviders.flatMap(p => p.models);
                if (allModels.length > 0) {
                     const exists = allModels.some(m => m.id === activeModel);
                     if (!exists) setActiveModel(allModels[0].id);
                }
            }
        };
        loadModels();
    }, [activeTab]);

    useEffect(() => {
        const hasImage = attachments.some(a => a.type === 'image');
        const hasVideo = attachments.some(a => a.type === 'video');

        if (hasVideo && activeTab === 'video') {
            setGenMode('image_start_end'); 
        } else if (hasImage && activeTab === 'video') {
            setGenMode('image_start_end');
        } else if (attachments.length === 0) {
            setGenMode('text');
        }
    }, [attachments, activeTab]);

    useEffect(() => {
        const valid = GEN_MODES.find(m => m.id === genMode && m.validTabs.includes(activeTab));
        if (!valid) setGenMode('text');
    }, [activeTab]);

    const toggleMenu = (menu: string) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && attachments.length === 0) return;
        
        setIsGenerating(true);
        setIsExpanded(false);
        
        try {
            if (activeTab === 'short_drama') {
                 const scriptAttachment = attachments.find(a => a.type === 'script');
                 
                 if (scriptAttachment && scriptAttachment.url) {
                      const res = await fetch(scriptAttachment.url);
                      const text = await res.text();
                      const name = prompt.slice(0, 30) || scriptAttachment.name.replace(/\.[^/.]+$/, "") || "New Short Drama";
                      await createProjectFromInput(name, text);
                 } else {
                      const projectName = prompt.slice(0, 30) || "New Short Drama";
                      await createProject(projectName); 
                 }
                 navigate(ROUTES.FILM_EDITOR);
            } else if (activeTab === 'video') {
                 navigate(ROUTES.VIDEO); 
            } else if (activeTab === 'image') {
                 navigate(ROUTES.IMAGE);
            } else if (activeTab === 'speech') {
                 navigate(ROUTES.AUDIO);
            } else if (activeTab === 'human') {
                 navigate(ROUTES.CHARACTER);
            } else if (activeTab === 'music') {
                 navigate(ROUTES.MUSIC);
            } else {
                 setTimeout(() => setIsGenerating(false), 2000);
            }
        } catch (e) {
            console.error("Generation failed", e);
            setIsGenerating(false);
        }
    };

    const handleUpload = async (source: 'local' | 'asset') => {
        if (source === 'local') {
            try {
                let accept = 'image/*, video/*, audio/*';
                
                if (activeTab === 'short_drama') {
                    accept += ', .txt, .md, .doc, .docx, .pdf, .rtf, .fountain, .odt, .wps, .pages';
                }

                const files = await uploadHelper.pickFiles(false, accept);
                if (files.length > 0) {
                    const file = files[0];
                    let type: InputAttachment['type'] = 'file';
                    
                    const ext = file.name.split('.').pop()?.toLowerCase() || '';

                    if (['jpg', 'png', 'jpeg', 'webp', 'svg', 'bmp'].includes(ext)) {
                        type = 'image';
                    } else if (['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v'].includes(ext)) {
                        type = 'video';
                    } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(ext)) {
                        type = 'audio';
                    } else if (['txt', 'md', 'doc', 'docx', 'pdf', 'rtf', 'fountain'].includes(ext)) {
                        type = 'script';
                    }
                    
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
        } else {
            setShowAssetModal(true);
        }
    };

    const handleAssetsSelected = async (assets: Asset[]) => {
        const newAttachments: InputAttachment[] = [];
        
        for (const a of assets) {
            let type: InputAttachment['type'] = 'file';
            if (a.type === 'image') type = 'image';
            if (a.type === 'video') type = 'video';
            if (a.type === 'audio') type = 'audio';
            if (a.type === 'text') type = 'script';
            
            const url = await assetService.resolveAssetUrl(a);
            
            newAttachments.push({
                id: a.id,
                name: a.name,
                type,
                url
            });
        }
        
        setAttachments(prev => [...prev, ...newAttachments]);
        setShowAssetModal(false);
    };

    const handleRemoveAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleExpandSticky = () => {
        setIsExpanded(true);
    };
    
    const handleInsertQuote = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const { state } = editor;
        const { selection } = state;
        const { from, to, empty } = selection;
        
        if (empty) {
            editor.chain().focus().insertContent('"').setTextSelection(from + 1).run();
        } else {
            const text = state.doc.textBetween(from, to);
            editor.chain().focus().insertContent(`"${text}"`).run();
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsHeroVisible(entry.isIntersecting);
                if (entry.isIntersecting) {
                    setIsExpanded(false);
                }
            },
            { root: null, threshold: 0.2, rootMargin: "-50px 0px 0px 0px" }
        );

        if (heroSectionRef.current) {
            observer.observe(heroSectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const getGradient = (tab: string) => {
        switch(tab) {
             case 'short_drama': return 'from-orange-600/40 via-red-600/40 to-yellow-500/40';
             case 'video': return 'from-pink-500/30 via-rose-500/30 to-red-500/30';
             case 'image': return 'from-blue-400/30 via-cyan-500/30 to-teal-400/30';
             case 'human': return 'from-green-500/30 via-emerald-500/30 to-teal-500/30';
             case 'speech': return 'from-teal-500/30 via-cyan-500/30 to-blue-500/30';
             default: return 'from-gray-500/20 to-gray-400/20';
        }
    };

    const tabs = [
        { id: 'short_drama', label: 'AI 短剧', icon: Clapperboard, color: 'text-orange-500' },
        { id: 'video', label: 'AI 视频', icon: Video, color: 'text-pink-400' },
        { id: 'image', label: 'AI 图片', icon: ImageIcon, color: 'text-blue-400' },
        { id: 'human', label: '角色', icon: Smile, color: 'text-green-400' },
        { id: 'music', label: 'AI 音乐', icon: Music, color: 'text-indigo-400' },
        { id: 'speech', label: 'AI 配音', icon: Mic, color: 'text-teal-400' },
    ];

    const currentMode = tabs.find(t => t.id === activeTab) || tabs[0];
    const currentGenMode = GEN_MODES.find(m => m.id === genMode) || GEN_MODES[0];

    const renderFooterControls = () => {
        const GenModeIcon = currentGenMode.icon;

        return (
            <div className="flex items-center gap-2 whitespace-nowrap">
                
                <div className="relative shrink-0">
                    <InputFooterButton 
                        ref={modeButtonRef}
                        icon={<currentMode.icon size={16} className={currentMode.color} />}
                        label={currentMode.label}
                        onClick={() => toggleMenu('mode')}
                        active={activeMenu === 'mode'}
                        suffix={<ChevronDown size={10} className="opacity-50" />}
                        className="h-9 px-3"
                    />
                    <Popover
                        isOpen={activeMenu === 'mode'}
                        onClose={() => setActiveMenu(null)}
                        triggerRef={modeButtonRef}
                        width={160}
                        className="p-1"
                    >
                         {tabs.map(tab => (
                             <button 
                                 key={tab.id} 
                                 onClick={() => { setActiveTab(tab.id as PortalTab); setActiveMenu(null); }}
                                 className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#27272a] transition-colors ${activeTab === tab.id ? 'bg-[#27272a] text-white' : 'text-gray-400'}`}
                             >
                                 <tab.icon size={14} className={tab.color} />
                                 <span>{tab.label}</span>
                                 {activeTab === tab.id && <Check size={12} className="ml-auto text-blue-500" />}
                             </button>
                         ))}
                    </Popover>
                </div>

                <div className="w-px h-5 bg-[#27272a] mx-1 shrink-0" />

                <div className="relative shrink-0">
                     <div className="hidden">
                         <ModelSelector 
                             value={activeModel}
                             onChange={setActiveModel}
                             providers={currentProviders}
                             className="opacity-0 w-0 h-0 overflow-hidden" 
                         />
                     </div>
                     <InputFooterButton 
                        icon={<Sparkles size={16} />} 
                        label={activeModel ? activeModel.split('-').slice(0, 2).join(' ') : 'Model'}
                        onClick={() => toggleMenu('model')}
                        suffix={<ChevronDown size={10} className="opacity-50" />}
                        active={activeMenu === 'model'}
                        className="bg-transparent border-transparent hover:bg-[#ffffff08] h-9"
                     />
                     <div className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none">
                         <ModelSelector 
                             value={activeModel}
                             onChange={setActiveModel}
                             providers={currentProviders}
                             className="w-full h-full cursor-pointer"
                             isOpen={activeMenu === 'model'}
                             onToggle={(open) => toggleMenu(open ? 'model' : '')}
                         />
                     </div>
                </div>

                {availableGenModes.length > 1 && (
                    <div className="relative shrink-0">
                        <InputFooterButton
                            ref={genModeButtonRef}
                            icon={<GenModeIcon size={16} className={genMode === 'text' ? 'text-blue-400' : 'text-pink-400'} />}
                            label={currentGenMode.label}
                            onClick={() => toggleMenu('genMode')}
                            active={activeMenu === 'genMode'}
                            suffix={<ChevronDown size={10} className="opacity-50" />}
                            className="bg-transparent border-transparent hover:bg-[#ffffff08] h-9"
                        />
                        <Popover
                            isOpen={activeMenu === 'genMode'}
                            onClose={() => setActiveMenu(null)}
                            triggerRef={genModeButtonRef}
                            width={220}
                            className="p-1"
                        >
                            {availableGenModes.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => { setGenMode(m.id); setActiveMenu(null); }}
                                    className={`
                                        flex flex-col gap-0.5 w-full text-left px-3 py-2 rounded-lg transition-colors group
                                        ${genMode === m.id ? 'bg-[#27272a]' : 'hover:bg-[#202022]'}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <m.icon size={14} className={genMode === m.id ? (m.id === 'text' ? 'text-blue-400' : 'text-pink-400') : 'text-gray-500 group-hover:text-gray-400'} />
                                        <span className={`text-xs font-bold ${genMode === m.id ? 'text-white' : 'text-gray-300'}`}>{m.label}</span>
                                        {genMode === m.id && <Check size={12} className="ml-auto text-green-500" />}
                                    </div>
                                    <span className="text-[10px] text-gray-500 pl-6 leading-tight opacity-80">{m.desc}</span>
                                </button>
                            ))}
                        </Popover>
                    </div>
                )}

                {activeTab === 'short_drama' && (
                    <StyleSelector 
                        value={activeStyle}
                        onChange={setActiveStyle}
                        options={FILM_STYLES}
                        className="border-none bg-transparent hover:bg-[#ffffff08] h-9 text-gray-500 hover:text-white shrink-0"
                        label="风格"
                        disabled={false}
                        isOpen={activeMenu === 'style'}
                        onToggle={(open) => toggleMenu(open ? 'style' : '')}
                    />
                )}

                {(activeTab === 'video' || activeTab === 'image' || activeTab === 'short_drama') && (
                    <AspectRatioSelector 
                        value={aspectRatio}
                        onChange={setAspectRatio}
                        resolution={resolution}
                        onResolutionChange={setResolution}
                        className="border-none bg-transparent hover:bg-[#ffffff08] h-9 text-gray-500 hover:text-white shrink-0"
                        isOpen={activeMenu === 'ratio'}
                        onToggle={(open) => toggleMenu(open ? 'ratio' : '')}
                    />
                )}

                {(activeTab === 'video' || activeTab === 'short_drama') && (
                    <div className="relative shrink-0">
                        <InputFooterButton 
                            ref={durationButtonRef}
                            icon={<Clock size={16} />}
                            label={duration}
                            onClick={() => toggleMenu('duration')}
                            active={activeMenu === 'duration'}
                            suffix={<ChevronDown size={10} className="opacity-50" />}
                            className="bg-transparent border-transparent hover:bg-[#ffffff08] h-9"
                        />
                         <Popover
                            isOpen={activeMenu === 'duration'}
                            onClose={() => setActiveMenu(null)}
                            triggerRef={durationButtonRef}
                            width={128}
                            className="p-1"
                        >
                            {['5s', '10s', '15s', '60s'].map(d => (
                                <button 
                                    key={d} 
                                    onClick={() => { setDuration(d); setActiveMenu(null); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-[#27272a] ${duration === d ? 'text-blue-400' : 'text-gray-400'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </Popover>
                    </div>
                )}
                
                 <button 
                    onClick={handleInsertQuote}
                    className="p-2 text-gray-500 hover:text-white hover:bg-[#ffffff08] rounded-full transition-colors ml-auto shrink-0"
                    title="Insert Quote"
                 >
                     <Quote size={18} />
                 </button>
            </div>
        );
    };
    
    const getPlaceholder = () => {
        if (activeTab === 'short_drama') return "输入故事梗概，或上传剧本文件 (TXT/PDF)...";
        if (activeTab === 'video') {
            if (genMode === 'image_start_end') return "上传图片作为起始帧，描述运动...";
            return "描述画面内容、运动方向...";
        }
        if (activeTab === 'image') return "描述画面细节、风格、构图...";
        if (activeTab === 'music') return "描述音乐风格、情绪...";
        if (activeTab === 'speech') return "输入要转换的文本...";
        return "输入提示词...";
    };

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
            <PortalSidebar />

            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <PortalHeader />
                
                <div className="absolute inset-0 pointer-events-none z-0">
                     <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1033]/30 via-[#0a0a0a]/80 to-[#050505]" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
                    <div className="max-w-[1600px] mx-auto flex flex-col items-center">
                        
                        <div className="w-full mt-20 mb-8 text-center space-y-8">
                            <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-xl opacity-90 flex items-center justify-center gap-3">
                                有什么新的故事灵感？ 
                                <Sparkles size={36} className="text-yellow-400 fill-yellow-400/20 animate-pulse" />
                            </h1>
                            
                            <div className="max-w-[1200px] mx-auto w-full" ref={heroSectionRef}>
                                <CreationChatInput 
                                    value={prompt}
                                    onChange={setPrompt}
                                    isGenerating={isGenerating}
                                    onGenerate={handleGenerate}
                                    className="shadow-2xl shadow-black/50"
                                    glowClassName={getGradient(activeTab)}
                                    autoFocus={true}
                                    footerControls={renderFooterControls()}
                                    onUpload={handleUpload}
                                    attachments={attachments}
                                    onRemoveAttachment={handleRemoveAttachment}
                                    placeholder={getPlaceholder()}
                                    cost={activeTab === 'image' ? 4 : 20}
                                    minHeight={88}
                                    editorInstanceRef={editorRef}
                                />
                            </div>
                            
                            <div className="max-w-7xl mx-auto w-full mt-16 px-2">
                                <ToolsGrid />
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-12 opacity-70">
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

                        <div className="w-full mt-16 pb-20 border-t border-white/5 pt-12">
                            <CommunityGallery />
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
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
                
                 <StickyHeroBar 
                    isVisible={!isHeroVisible && !isExpanded}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    activeTab={activeTab}
                    isGenerating={isGenerating}
                    onGenerate={() => handleGenerate()}
                    onExpand={handleExpandSticky}
                />

                {isExpanded && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
                        <div className="absolute inset-0 pointer-events-auto bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsExpanded(false)} />
                        
                        <div className="w-full max-w-[1200px] mx-auto px-4 pb-12 relative z-10 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="absolute -top-12 right-6 p-2 bg-[#18181b]/80 backdrop-blur-md hover:bg-[#333] rounded-full text-gray-400 hover:text-white transition-colors border border-white/10 shadow-lg"
                                title="Collapse"
                            >
                                <Minimize2 size={18} />
                            </button>
                            
                            <CreationChatInput 
                                value={prompt}
                                onChange={setPrompt}
                                onGenerate={handleGenerate}
                                isGenerating={isGenerating}
                                className="mb-0 shadow-2xl"
                                glowClassName={getGradient(activeTab)}
                                footerControls={renderFooterControls()}
                                onUpload={handleUpload}
                                attachments={attachments}
                                onRemoveAttachment={handleRemoveAttachment}
                                autoFocus={true}
                                placeholder={getPlaceholder()}
                                cost={activeTab === 'image' ? 4 : 20}
                                minHeight={88}
                                editorInstanceRef={editorRef}
                            />
                        </div>
                    </div>
                )}

                {selectedItem && (
                    <GenerationPreview 
                        mode="view"
                        galleryItem={selectedItem}
                        relatedItems={MOCK_SHORTS}
                        onClose={() => setSelectedItem(null)} 
                    />
                )}
            
                <ChooseAssetModal 
                    isOpen={showAssetModal}
                    onClose={() => setShowAssetModal(false)}
                    onConfirm={handleAssetsSelected}
                    accepts={activeTab === 'image' ? ['image'] : activeTab === 'video' ? ['video', 'image'] : undefined}
                    title="Select Asset"
                    multiple
                />
            </div>
        </div>
    );
};

const PortalPage: React.FC = () => {
    return (
        <FilmStoreProvider>
            <PortalContent />
        </FilmStoreProvider>
    );
};

export default PortalPage;
