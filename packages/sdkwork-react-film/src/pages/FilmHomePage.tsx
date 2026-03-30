
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilmSidebar } from '../components/FilmSidebar';
import { FilmHeader } from '../components/FilmHeader';
import { Sparkles, Clock } from 'lucide-react';
import { useFilmStore, FilmStoreProvider } from '../store/filmStore';
import {
    CreationChatInput,
    PortalTab,
    InputAttachment,
    StyleSelector,
    fetchCreationCapabilities,
    toCreationModelProviders,
    resolveCreationStyleOptions,
    resolveCreationEntryCapabilityOptions
} from '@sdkwork/react-assets';
import { ModelSelector, AspectRatioSelector, GalleryCard, GalleryItem } from '@sdkwork/react-commons';
import type { Resolution } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';
import {
    createOfflineArtwork,
    createOfflineAvatar,
    inlineDataService,
    useRouter,
    ROUTES,
    uploadHelper
} from '@sdkwork/react-core';
import { importFilmAssetFromFile } from '../utils/filmModalAssetImport';

type FilmHomeAttachment = InputAttachment & {
    assetId?: string;
    content?: string;
};
type FilmAspectRatio = string;
type CapabilitySnapshot = Awaited<ReturnType<typeof fetchCreationCapabilities>>;

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'gif']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma']);
const SCRIPT_EXTS = new Set(['txt', 'md', 'markdown', 'rtf', 'fountain', 'doc', 'docx', 'pdf']);
const PLAIN_TEXT_SCRIPT_EXTS = new Set(['txt', 'md', 'markdown', 'rtf', 'fountain']);

const classifyFilmHomeFile = (
    fileName: string
): { attachmentType: FilmHomeAttachment['type']; importType: 'image' | 'video' | 'audio' | 'text' | 'file'; ext: string } => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (IMAGE_EXTS.has(ext)) {
        return { attachmentType: 'image', importType: 'image', ext };
    }
    if (VIDEO_EXTS.has(ext)) {
        return { attachmentType: 'video', importType: 'video', ext };
    }
    if (AUDIO_EXTS.has(ext)) {
        return { attachmentType: 'audio', importType: 'audio', ext };
    }
    if (SCRIPT_EXTS.has(ext)) {
        return {
            attachmentType: 'script',
            importType: PLAIN_TEXT_SCRIPT_EXTS.has(ext) ? 'text' : 'file',
            ext
        };
    }
    return { attachmentType: 'file', importType: 'file', ext };
};

// Mapped to GalleryItem structure
const MOCK_SHORTS: GalleryItem[] = [
    {
        id: '1', title: 'Global AI Creation', type: 'short', url: createOfflineArtwork({ title: 'Global AI Creation', subtitle: 'Worldwide story craft with desktop-grade direction', eyebrow: 'Creation Plaza', badge: 'Featured', accent: '#ef4444', width: 800, height: 500 }),
        aspectRatio: '16:10',
        author: { id: 'u1', name: 'CCTV_AI', avatar: createOfflineAvatar({ name: 'CCTV AI', seed: 'film-cctv', accent: '#ef4444' }) },
        stats: { likes: 1200, views: 10000 },
        prompt: '', model: '', createdAt: '2024-01-15 10:30:00',
        badges: [{ text: 'Featured', color: 'bg-red-600' }]
    },
    {
        id: '2', title: 'Journey to the West Reimagined', type: 'short', url: createOfflineArtwork({ title: 'Journey To The West', subtitle: 'Classic myth restaged through AI production design', eyebrow: 'Creation Plaza', badge: 'Trending', accent: '#f97316', width: 800, height: 500 }),
        aspectRatio: '16:10',
        author: { id: 'u2', name: 'Director_Li', avatar: createOfflineAvatar({ name: 'Director Li', seed: 'film-li', accent: '#f97316' }) },
        stats: { likes: 856, views: 5000 },
        prompt: '', model: '', createdAt: '2024-01-14 15:20:00',
        badges: [{ text: 'Trending', color: 'bg-orange-500' }]
    },
    {
        id: '3', title: 'Zootopia: Origins', type: 'short', url: createOfflineArtwork({ title: 'Zootopia Origins', subtitle: 'Animated universe moodboards with rapid scene ideation', eyebrow: 'Creation Plaza', badge: 'Fan Film', accent: '#3b82f6', width: 800, height: 500 }),
        aspectRatio: '16:10',
        author: { id: 'u3', name: 'DisneyFan', avatar: createOfflineAvatar({ name: 'Disney Fan', seed: 'film-disney', accent: '#3b82f6' }) },
        stats: { likes: 4500, views: 50000 },
        prompt: '', model: '', createdAt: '2024-01-13 09:00:00',
        badges: [{ text: 'Fan Film', color: 'bg-blue-600' }]
    },
    {
        id: '4', title: 'Cyberpunk 2078', type: 'short', url: createOfflineArtwork({ title: 'Cyberpunk 2078', subtitle: 'Dense neon worldbuilding with stylized frame language', eyebrow: 'Creation Plaza', badge: 'Sci-Fi', accent: '#8b5cf6', width: 800, height: 500 }),
        aspectRatio: '16:10',
        author: { id: 'u4', name: 'NeoTokyo', avatar: createOfflineAvatar({ name: 'NeoTokyo', seed: 'film-neo', accent: '#8b5cf6' }) },
        stats: { likes: 3200, views: 22000 },
        prompt: '', model: '', createdAt: '2024-01-12 14:45:00',
        badges: [{ text: 'Sci-Fi', color: 'bg-purple-600' }]
    },
];

const ACTIVE_USERS = [
    { name: 'FengMo', avatar: createOfflineAvatar({ name: 'FengMo', seed: 'film-feng', accent: '#5b8cff' }) },
    { name: 'CatHero', avatar: createOfflineAvatar({ name: 'CatHero', seed: 'film-cat', accent: '#14b8a6' }) },
    { name: 'SanTiCreator', avatar: createOfflineAvatar({ name: 'SanTiCreator', seed: 'film-san', accent: '#f97316' }) },
    { name: 'CatWineMaster', avatar: createOfflineAvatar({ name: 'CatWineMaster', seed: 'film-jiu', accent: '#ec4899' }) },
];

const FilmHomePageContent: React.FC = () => {
    const { navigate } = useRouter();
    const { createProject, createProjectFromInput } = useFilmStore();

    // Hero Input State
    const [activeTab] = useState<PortalTab>('short_drama');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Config State
    const [aspectRatio, setAspectRatio] = useState<FilmAspectRatio>('16:9');
    const [resolution, setResolution] = useState<Resolution>('2k');
    const [duration, setDuration] = useState('5s');
    const [activeStyle, setActiveStyle] = useState('realistic');
    const [activeModel, setActiveModel] = useState<string>('');
    const [attachments, setAttachments] = useState<FilmHomeAttachment[]>([]);
    const [capabilitySnapshot, setCapabilitySnapshot] = useState<CapabilitySnapshot | null>(null);

    // Menus
    const [showDurationMenu, setShowDurationMenu] = useState(false);
    const durationMenuRef = useRef<HTMLDivElement>(null);

    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const currentProviders = useMemo(() => {
        if (!capabilitySnapshot) {
            return [];
        }
        return toCreationModelProviders(capabilitySnapshot);
    }, [capabilitySnapshot]);

    const activeStyleOptions = useMemo(() => {
        return resolveCreationStyleOptions(
            capabilitySnapshot || { target: activeTab, channels: [], styleOptions: [] },
        );
    }, [activeTab, capabilitySnapshot]);

    const activeCapabilityOptions = useMemo(() => {
        return resolveCreationEntryCapabilityOptions(
            capabilitySnapshot || { target: activeTab, channels: [], styleOptions: [] },
            activeModel,
        );
    }, [activeModel, activeTab, capabilitySnapshot]);
    const activeDurationOptions = activeCapabilityOptions.durationOptions;
    const activeResolutionOptions = activeCapabilityOptions.resolutionOptions;
    const activeAspectRatioOptions = activeCapabilityOptions.aspectRatioOptions;

    useEffect(() => {
        let active = true;
        const loadCapabilities = async () => {
            const snapshot = await fetchCreationCapabilities(activeTab);
            if (!active) {
                return;
            }

            setCapabilitySnapshot(snapshot);
        };

        loadCapabilities().catch((error) => {
            console.error('Failed to load film creation capabilities', error);
            if (active) {
                setCapabilitySnapshot(null);
            }
        });

        return () => {
            active = false;
        };
    }, [activeTab]);

    useEffect(() => {
        const firstModel = currentProviders[0]?.models[0]?.id;
        if (!firstModel) {
            setActiveModel('');
            return;
        }
        const exists = currentProviders.some((provider) => provider.models.some((model) => model.id === activeModel));
        if (!exists) {
            setActiveModel(firstModel);
        }
    }, [currentProviders]);

    useEffect(() => {
        if (activeStyleOptions.length === 0) {
            setActiveStyle('');
            return;
        }
        if (!activeStyleOptions.some((item) => item.id === activeStyle)) {
            setActiveStyle(activeStyleOptions[0]?.id || '');
        }
    }, [activeStyle, activeStyleOptions]);

    useEffect(() => {
        if (activeDurationOptions.length === 0) {
            return;
        }
        if (!activeDurationOptions.some((item) => item.value === duration)) {
            setDuration(activeDurationOptions[0]?.value || '5s');
        }
    }, [activeDurationOptions, duration]);

    useEffect(() => {
        if (activeResolutionOptions.length === 0) {
            return;
        }
        if (!activeResolutionOptions.some((item) => item.value === resolution)) {
            setResolution(activeResolutionOptions[0]?.value || '2k');
        }
    }, [activeResolutionOptions, resolution]);

    useEffect(() => {
        if (activeAspectRatioOptions.length === 0) {
            return;
        }
        if (!activeAspectRatioOptions.some((item) => item.value === aspectRatio)) {
            setAspectRatio((activeAspectRatioOptions[0]?.value || '16:9') as FilmAspectRatio);
        }
    }, [activeAspectRatioOptions, aspectRatio]);

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
                 if (scriptAttachment && (scriptAttachment.content || scriptAttachment.url)) {
                      const text =
                          scriptAttachment.content ||
                          (scriptAttachment.url ? await inlineDataService.fetchText(scriptAttachment.url) : '');
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
                const fileName = file.name || `film-home-${Date.now()}`;
                const bytes = new Uint8Array(file.data);
                const classified = classifyFilmHomeFile(fileName);
                const localFile = new File([bytes], fileName);
                const imported = await importFilmAssetFromFile(localFile, classified.importType, {
                    origin: 'upload',
                    source: 'film-home-upload',
                    tab: activeTab,
                    attachmentType: classified.attachmentType
                });
                const scriptContent =
                    classified.attachmentType === 'script' && PLAIN_TEXT_SCRIPT_EXTS.has(classified.ext)
                        ? new TextDecoder('utf-8').decode(bytes)
                        : undefined;

                if (classified.attachmentType === 'script' && activeTab === 'short_drama') {
                    if (!prompt) setPrompt(`Based on script: ${file.name}...`);
                }

                setAttachments((prev) => [
                    ...prev,
                    {
                        id: imported.assetId,
                        assetId: imported.assetId,
                        name: fileName,
                        type: classified.attachmentType,
                        url: imported.url,
                        content: scriptContent
                    }
                ]);
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
                        options={activeStyleOptions}
                        className="bg-[#1a1a1c] border-transparent hover:bg-[#202022] h-[30px] hover:border-[#333]"
                    />
                )}

                {/* 3. Aspect Ratio */}
                <AspectRatioSelector
                    value={aspectRatio}
                    onChange={(ratio) => setAspectRatio(ratio)}
                    resolution={resolution as Resolution}
                    onResolutionChange={(res) => setResolution(res)}
                    resolutionOptions={activeResolutionOptions}
                    aspectRatioOptions={activeAspectRatioOptions}
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
                                {activeDurationOptions.map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => { setDuration(d.value); setShowDurationMenu(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-[#27272a] ${duration === d.value ? 'text-blue-400' : 'text-gray-400'}`}
                                    >
                                        {d.label}
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
