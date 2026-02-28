
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Minimize2, ChevronDown, Sparkles, Check, Clock, Quote, Clapperboard, Video, Image as ImageIcon, Smile, Music, Mic } from 'lucide-react';
import { useFilmStore, FilmStoreProvider } from 'sdkwork-react-film';
import { useRouter, ROUTES, uploadHelper, modelInfoService } from '@sdkwork/react-core';
import { FILM_STYLES, GEN_MODES } from '../constants';
import {
    CreationChatInput,
    InputFooterButton,
    StyleSelector,
    ChooseAssetModal,
    clearPortalLaunchSession,
    savePortalLaunchSession
} from 'sdkwork-react-assets';
import type { PortalTab } from 'sdkwork-react-assets';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalHeader } from '../components/PortalHeader';
import { ToolsGrid } from '../components/ToolsGrid';
import { CommunityGallery } from '../components/CommunityGallery';
import { StickyHeroBar } from '../components/StickyHeroBar';
import { GalleryCard, GalleryItem, ModelSelector, AspectRatioSelector, Popover, Asset, GenerationType, getIconComponent, ModelProvider } from 'sdkwork-react-commons';
import { GenerationPreview } from 'sdkwork-react-image';
import {
    importPortalAttachmentFromLocalFile,
    resolvePortalAttachmentFromAsset,
    type PortalAttachment
} from '../utils/portalAttachmentImport';

const MOCK_SHORTS: GalleryItem[] = [
    {
        id: '1',
        title: 'AI Spring Gala Highlights',
        type: 'short',
        url: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '16:10',
        author: { id: 'u1', name: 'CCTV_AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cctv' },
        stats: { likes: 1200, views: 10000 },
        prompt: '',
        model: '',
        createdAt: Date.now().toString(),
        badges: [{ text: 'Lunar New Year', color: 'bg-red-600' }]
    },
    {
        id: '2',
        title: 'Staying Home This Winter',
        type: 'short',
        url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '16:10',
        author: { id: 'u2', name: 'Director_Li', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' },
        stats: { likes: 856, views: 5000 },
        prompt: '',
        model: '',
        createdAt: Date.now().toString(),
        badges: [{ text: 'Warm Holiday Story', color: 'bg-orange-500' }]
    }
];

const ACTIVE_USERS = [
    { name: 'StoryCrafter', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=feng' },
    { name: 'CatTeacher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat_eng' },
    { name: 'MythPainter', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=san' },
    { name: 'TravelClipper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jiu' }
];

type PortalAspectRatio = '21:9' | '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16';
type PortalResolution = '2k' | '4k';

interface EditorLike {
    state: {
        selection: {
            from: number;
            to: number;
            empty: boolean;
        };
        doc: {
            textBetween: (from: number, to: number) => string;
        };
    };
    chain: () => {
        focus: () => {
            insertContent: (content: string) => {
                setTextSelection: (position: number) => {
                    run: () => void;
                };
                run: () => void;
            };
        };
    };
}

interface FooterControlsProps {
    activeTab: PortalTab;
    activeModel: string;
    setActiveModel: (model: string) => void;
    activeStyle: string;
    setActiveStyle: (style: string) => void;
    genMode: string;
    setGenMode: (mode: string) => void;
    aspectRatio: PortalAspectRatio;
    setAspectRatio: (ratio: PortalAspectRatio) => void;
    resolution: PortalResolution;
    setResolution: (res: PortalResolution) => void;
    duration: string;
    setDuration: (duration: string) => void;
    currentProviders: ModelProvider[];
    onInsertQuote: () => void;
    menuPrefix: string;
}
const FooterControls: React.FC<FooterControlsProps> = ({
    activeTab,
    activeModel,
    setActiveModel,
    activeStyle,
    setActiveStyle,
    genMode,
    setGenMode,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    duration,
    setDuration,
    currentProviders,
    onInsertQuote,
    menuPrefix,
}) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    
    const modeButtonRef = useRef<HTMLButtonElement>(null);
    const durationButtonRef = useRef<HTMLButtonElement>(null);
    const genModeButtonRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = (menu: string) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    };

        const tabs = [
        { id: 'short_drama', label: 'AI Drama', icon: Clapperboard, color: 'text-orange-500' },
        { id: 'video', label: 'AI Video', icon: Video, color: 'text-pink-400' },
        { id: 'image', label: 'AI Image', icon: ImageIcon, color: 'text-blue-400' },
        { id: 'human', label: 'Character', icon: Smile, color: 'text-green-400' },
        { id: 'music', label: 'AI Music', icon: Music, color: 'text-indigo-400' },
        { id: 'speech', label: 'AI Voice', icon: Mic, color: 'text-teal-400' }
    ];

    const currentMode = tabs.find(t => t.id === activeTab) || tabs[0];
    const currentGenMode = GEN_MODES.find(m => m.id === genMode) || GEN_MODES[0];
    const GenModeIcon = currentGenMode.icon;

    const availableGenModes = useMemo(() => {
        return GEN_MODES.filter(m => m.validTabs.includes(activeTab));
    }, [activeTab]);

    return (
        <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="relative shrink-0">
                <InputFooterButton 
                    ref={modeButtonRef}
                    icon={<currentMode.icon size={16} className={currentMode.color} />}
                    label={currentMode.label}
                    onClick={() => toggleMenu(`${menuPrefix}-mode`)}
                    active={activeMenu === `${menuPrefix}-mode`}
                    suffix={<ChevronDown size={10} className="opacity-50" />}
                    className="h-9 px-3"
                />
                <Popover
                    isOpen={activeMenu === `${menuPrefix}-mode`}
                    onClose={() => setActiveMenu(null)}
                    triggerRef={modeButtonRef}
                    width={160}
                    className="p-1"
                >
                     {tabs.map(tab => (
                         <button 
                             key={tab.id} 
                             onClick={() => { 
                                 // Use a window event to avoid prop drilling for tab switch.
                                 window.dispatchEvent(new CustomEvent('portal-tab-change', { detail: tab.id }));
                                 setActiveMenu(null); 
                             }}
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
                    onClick={() => toggleMenu(`${menuPrefix}-model`)}
                    suffix={<ChevronDown size={10} className="opacity-50" />}
                    active={activeMenu === `${menuPrefix}-model`}
                    className="bg-transparent border-transparent hover:bg-[#ffffff08] h-9"
                 />
                 <div className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none">
                     <ModelSelector 
                         value={activeModel}
                         onChange={setActiveModel}
                         providers={currentProviders}
                         className="w-full h-full cursor-pointer"
                         isOpen={activeMenu === `${menuPrefix}-model`}
                         onToggle={(open) => toggleMenu(open ? `${menuPrefix}-model` : '')}
                     />
                 </div>
            </div>

            {availableGenModes.length > 1 && (
                <div className="relative shrink-0">
                    <InputFooterButton
                        ref={genModeButtonRef}
                        icon={<GenModeIcon size={16} className={genMode === 'text' ? 'text-blue-400' : 'text-pink-400'} />}
                        label={currentGenMode.label}
                        onClick={() => toggleMenu(`${menuPrefix}-genMode`)}
                        active={activeMenu === `${menuPrefix}-genMode`}
                        suffix={<ChevronDown size={10} className="opacity-50" />}
                        className="bg-transparent border-transparent hover:bg-[#ffffff08] h-9"
                    />
                    <Popover
                        isOpen={activeMenu === `${menuPrefix}-genMode`}
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
                    label="Style"
                    disabled={false}
                    isOpen={activeMenu === `${menuPrefix}-style`}
                    onToggle={(open) => toggleMenu(open ? `${menuPrefix}-style` : '')}
                />
            )}

            {(activeTab === 'video' || activeTab === 'image' || activeTab === 'short_drama') && (
                <AspectRatioSelector 
                    value={aspectRatio}
                    onChange={setAspectRatio}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    className="border-none bg-transparent hover:bg-[#ffffff08] h-9 text-gray-500 hover:text-white shrink-0"
                    isOpen={activeMenu === `${menuPrefix}-ratio`}
                    onToggle={(open) => toggleMenu(open ? `${menuPrefix}-ratio` : '')}
                />
            )}

            {(activeTab === 'video' || activeTab === 'short_drama') && (
                <div className="relative shrink-0">
                    <InputFooterButton 
                        ref={durationButtonRef}
                        icon={<Clock size={16} />}
                        label={duration}
                        onClick={() => toggleMenu(`${menuPrefix}-duration`)}
                        active={activeMenu === `${menuPrefix}-duration`}
                        suffix={<ChevronDown size={10} className="opacity-50" />}
                        className="bg-transparent border-transparent hover:bg-[#ffffff08] h-9"
                    />
                     <Popover
                        isOpen={activeMenu === `${menuPrefix}-duration`}
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
                onClick={onInsertQuote}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#ffffff08] rounded-full transition-colors ml-auto shrink-0"
                title="Insert Quote"
             >
                 <Quote size={18} />
             </button>
        </div>
    );
};

// Inner component that uses FilmStore and receives navigate from parent
interface PortalContentInnerProps {
    navigate: (path: string) => void;
}

const PortalContentInner: React.FC<PortalContentInnerProps> = ({ navigate }) => {
    const { createProject, createProjectFromInput } = useFilmStore();
        
    const [activeTab, setActiveTab] = useState<PortalTab>('short_drama');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [aspectRatio, setAspectRatio] = useState<PortalAspectRatio>('16:9');
    const [resolution, setResolution] = useState<PortalResolution>('2k');
    const [duration, setDuration] = useState('5s');
    const [activeStyle, setActiveStyle] = useState('realistic');
    const [activeModel, setActiveModel] = useState<string>('');
    const [genMode, setGenMode] = useState<string>('text'); 
    
    const [attachments, setAttachments] = useState<PortalAttachment[]>([]);
    
    const [showAssetModal, setShowAssetModal] = useState(false);
    
    const [currentProviders, setCurrentProviders] = useState<ModelProvider[]>([]);

    const editorRef = useRef<EditorLike | null>(null); 
    const expandedEditorRef = useRef<EditorLike | null>(null); 
    
    const [isHeroVisible, setIsHeroVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const heroSectionRef = useRef<HTMLDivElement>(null);
    
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    // Listen for tab switch events from footer controls.
    useEffect(() => {
        const handleTabChange = (event: Event) => {
            const detail = (event as CustomEvent<PortalTab>).detail;
            if (detail) {
                setActiveTab(detail);
            }
        };
        window.addEventListener('portal-tab-change', handleTabChange);
        return () => window.removeEventListener('portal-tab-change', handleTabChange);
    }, []);

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
                const mappedProviders: ModelProvider[] = result.data.channels.map((ch) => {
                    const IconComp = getIconComponent(ch.icon || 'Box');
                    return {
                        id: ch.name.toLowerCase().replace(/\s+/g, '-'),
                        name: ch.name,
                        icon: IconComp ? <IconComp size={14} /> : null,
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

    const handleGenerate = async () => {
        if (!prompt.trim() && attachments.length === 0) return;
        
        setIsGenerating(true);
        setIsExpanded(false);

        const toOptionalString = (value: unknown): string | undefined => {
            if (typeof value === 'string' && value.trim().length > 0) {
                return value;
            }
            if (typeof value === 'number' && Number.isFinite(value)) {
                return String(value);
            }
            return undefined;
        };

        const persistPortalLaunchContext = (target: PortalTab) => {
            savePortalLaunchSession({
                target,
                prompt,
                genMode,
                model: activeModel,
                styleId: activeStyle,
                aspectRatio: toOptionalString(aspectRatio),
                resolution: toOptionalString(resolution),
                duration: toOptionalString(duration),
                attachments: attachments.map((attachment) => ({
                    id: attachment.id,
                    name: attachment.name,
                    type: attachment.type,
                    assetId: attachment.assetId,
                    locator: attachment.url,
                    content: attachment.type === 'script' ? attachment.content : undefined
                }))
            });
        };
        
        try {
            if (activeTab === 'short_drama') {
                 clearPortalLaunchSession();
                 const scriptAttachment = attachments.find(a => a.type === 'script');
                 
                 if (scriptAttachment && (scriptAttachment.content || scriptAttachment.url)) {
                      const text = scriptAttachment.content
                          || (scriptAttachment.url ? await (await fetch(scriptAttachment.url)).text() : '');
                      const name = prompt.slice(0, 30) || scriptAttachment.name.replace(/\.[^/.]+$/, "") || "New Short Drama";
                      await createProjectFromInput(name, text);
                 } else {
                      const projectName = prompt.slice(0, 30) || "New Short Drama";
                      await createProject(projectName); 
                 }
                 navigate(ROUTES.FILM_EDITOR);
            } else if (activeTab === 'video') {
                 persistPortalLaunchContext('video');
                 navigate(ROUTES.VIDEO); 
            } else if (activeTab === 'image') {
                 persistPortalLaunchContext('image');
                 navigate(ROUTES.IMAGE);
            } else if (activeTab === 'speech') {
                 persistPortalLaunchContext('speech');
                 navigate(ROUTES.AUDIO);
            } else if (activeTab === 'human') {
                 persistPortalLaunchContext('human');
                 navigate(ROUTES.CHARACTER);
            } else if (activeTab === 'music') {
                 persistPortalLaunchContext('music');
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
                    const importedAttachment = await importPortalAttachmentFromLocalFile({
                        name: file.name,
                        data: new Uint8Array(file.data)
                    }, activeTab);

                    if (importedAttachment.type === 'script' && activeTab === 'short_drama') {
                        if (!prompt) setPrompt(`Based on script: ${file.name}...`);
                    }

                    setAttachments((prev) => [...prev, importedAttachment]);
                }
            } catch (e) { console.error(e); }
        } else {
            setShowAssetModal(true);
        }
    };

    const handleAssetsSelected = async (assets: Asset[]) => {
        const newAttachments: PortalAttachment[] = [];
        
        for (const a of assets) {
            const attachment = await resolvePortalAttachmentFromAsset(a);
            if (attachment) {
                newAttachments.push(attachment);
            }
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
    
    const handleInsertQuote = (isExpandedEditor: boolean) => () => {
        const editor = isExpandedEditor ? expandedEditorRef.current : editorRef.current;
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

    const getPlaceholder = () => {
        if (activeTab === 'short_drama') return 'Describe your story idea, or upload a script (TXT/PDF)...';
        if (activeTab === 'video') {
            if (genMode === 'image_start_end') return 'Upload frames and describe camera movement...';
            return 'Describe scene composition, movement, and pacing...';
        }
        if (activeTab === 'image') return 'Describe details, style, lighting, and composition...';
        if (activeTab === 'music') return 'Describe music style, mood, and instruments...';
        if (activeTab === 'speech') return 'Enter the text you want to convert to speech...';
        return 'Enter your prompt...';
    };

    // Keep sticky bar hidden while the expanded editor is open.
    const shouldShowStickyBar = !isHeroVisible && !isExpanded;

    // Footer controls for hero input.
    const heroFooterControls = (
        <FooterControls
            activeTab={activeTab}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            activeStyle={activeStyle}
            setActiveStyle={setActiveStyle}
            genMode={genMode}
            setGenMode={setGenMode}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            resolution={resolution}
            setResolution={setResolution}
            duration={duration}
            setDuration={setDuration}
            currentProviders={currentProviders}
            onInsertQuote={handleInsertQuote(false)}
            menuPrefix="hero"
        />
    );

    // Footer controls for expanded editor.
    const expandedFooterControls = (
        <FooterControls
            activeTab={activeTab}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            activeStyle={activeStyle}
            setActiveStyle={setActiveStyle}
            genMode={genMode}
            setGenMode={setGenMode}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            resolution={resolution}
            setResolution={setResolution}
            duration={duration}
            setDuration={setDuration}
            currentProviders={currentProviders}
            onInsertQuote={handleInsertQuote(true)}
            menuPrefix="expanded"
        />
    );

    return (
        <>
            <div className="absolute inset-0 pointer-events-none z-0">
                 <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1033]/30 via-[#0a0a0a]/80 to-[#050505]" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
                    <div className="max-w-[1600px] mx-auto flex flex-col items-center">
                        
                        <div className="w-full mt-20 mb-8 text-center space-y-8">
                            <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-xl opacity-90 flex items-center justify-center gap-3">
                                What story do you want to create today?
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
                                    footerControls={heroFooterControls}
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

                    <StickyHeroBar
                        isVisible={shouldShowStickyBar}
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
                                    footerControls={expandedFooterControls}
                                    onUpload={handleUpload}
                                    attachments={attachments}
                                    onRemoveAttachment={handleRemoveAttachment}
                                    autoFocus={true}
                                    placeholder={getPlaceholder()}
                                    cost={activeTab === 'image' ? 4 : 20}
                                    minHeight={88}
                                    editorInstanceRef={expandedEditorRef}
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
                        domain="portal-video"
                        title="Select Asset"
                        multiple
                    />
                </div>
            </>
    );
};

// Main component that combines everything
const PortalPage: React.FC = () => {
    // Use useRouter safely - it returns default values if not wrapped in RouterProvider
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
            <PortalSidebar />
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <PortalHeader />
                <FilmStoreProvider>
                    <PortalContentInner navigate={navigate} />
                </FilmStoreProvider>
            </div>
        </div>
    );
};

export default PortalPage;
