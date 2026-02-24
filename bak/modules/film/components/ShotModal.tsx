
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Clapperboard, Video, Image as ImageIcon, Wand2, Clock, FileText, MessageSquare, Play, Layers, Grid3x3, ArrowRightLeft, FileImage, Type, Upload, Plus, Trash2, User, Music, Zap, Sparkles, Cpu, Cloud, Brain, Star, Activity, LayoutGrid, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { SettingInput, SettingSelect, SettingTextArea, SettingSlider } from '../../settings/components/SettingsWidgets';
import { FilmShot, FilmCharacter, FilmDialogueItem } from '../entities/film.entity';
import { MediaScene, GenerationProduct, AssetMediaResource, MediaResourceType } from '../../../types';
import { AIImageGeneratorModal } from '../../assets/components/AIImageGeneratorModal';
import { uploadHelper } from '../../../modules/drive/utils/uploadHelper';
import { PromptTextInput } from '../../../components/generate/PromptTextInput';
import { genAIService } from '../../notes/services/genAIService';
import { generateUUID } from '../../../utils';
import { ModelSelector } from '../../../components/ModelSelector/ModelSelector';
import { ModelProvider } from '../../../components/ModelSelector/types';
import { ChooseAssetModal } from '../../assets/components/ChooseAssetModal';
import { Asset, AssetType } from '../../assets/entities/asset.entity';
import { InputAttachment } from '../../../components/CreationChatInput/types';

interface ShotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<FilmShot>) => void;
    initialData?: FilmShot;
    sceneIndex?: number;
    characters?: FilmCharacter[];
}

const STORAGE_KEY_PRODUCT = 'film_shot_gen_product';

const GENERATION_MODES = [
    { value: 'TEXT_TO_VIDEO', label: '文生视频', icon: Type, description: '从文字生成视频' },
    { value: 'IMAGE_TO_VIDEO', label: '图生视频', icon: FileImage, description: '从图片生成视频' },
    { value: 'START_END_FRAMES', label: '首尾帧', icon: ArrowRightLeft, description: '基于首尾帧生成' },
    { value: 'REFERENCE_GUIDED', label: '参考引导', icon: Layers, description: '参考资产引导生成' },
    { value: 'MULTI_FRAME_INTELLIGENT', label: '智能多帧', icon: Grid3x3, description: '智能多帧/分镜' },
    { value: 'UNIVERSAL_REFERENCE', label: '全能智能参考', icon: Activity, description: '图片/视频/音频参考' },
];

const ASSET_ROLES = {
    START_FRAME: '开始帧',
    END_FRAME: '结束帧',
    REFERENCE: '参考资产',
    AUDIO_TRACK: '音频轨',
    VIDEO_REFERENCE: '视频参考',
    IMAGE_REFERENCE: '图片参考',
};

const PLATFORM_PROVIDERS: ModelProvider[] = [
    {
        id: 'keling',
        name: '可灵',
        icon: <Zap size={16} />,
        color: 'text-yellow-400',
        models: [
            { id: 'keling-v1', name: '可灵视频 v1.0', description: '可灵官方视频生成模型，支持文生视频和图生视频' },
            { id: 'keling-v2', name: '可灵视频 v2.0', description: '升级版本，画质更佳' }
        ]
    },
    {
        id: 'vidu',
        name: 'Vidu',
        icon: <Sparkles size={16} />,
        color: 'text-purple-400',
        models: [
            { id: 'vidu-gen1', name: 'Vidu Gen1', description: 'Vidu 第一代视频生成' }
        ]
    },
    {
        id: 'jimeng',
        name: '即梦',
        icon: <Cpu size={16} />,
        color: 'text-green-400',
        models: [
            { id: 'jimeng-v1', name: '即梦 v1', description: '即梦视频生成' }
        ]
    },
    {
        id: 'sora',
        name: 'Sora',
        icon: <Star size={16} />,
        color: 'text-blue-400',
        models: [
            { id: 'sora-1', name: 'Sora 1.0', description: 'OpenAI Sora 视频生成模型' }
        ]
    },
    {
        id: 'google',
        name: 'Google',
        icon: <Cloud size={16} />,
        color: 'text-red-400',
        models: [
            { id: 'google-veo3', name: 'Veo 3', description: 'Google Veo 视频生成' }
        ]
    },
    {
        id: 'runway',
        name: 'Runway',
        icon: <Brain size={16} />,
        color: 'text-pink-400',
        models: [
            { id: 'runway-gen3', name: 'Gen-3', description: 'Runway Gen-3 视频生成' }
        ]
    },
    {
        id: 'pika',
        name: 'Pika',
        icon: <Sparkles size={16} />,
        color: 'text-cyan-400',
        models: [
            { id: 'pika-1', name: 'Pika 1.0', description: 'Pika Labs 视频生成' }
        ]
    }
];

export const ShotModal: React.FC<ShotModalProps> = ({ isOpen, onClose, onSave, initialData, sceneIndex, characters = [] }) => {
    const [duration, setDuration] = useState(3);
    const [description, setDescription] = useState('');
    const [visualPrompt, setVisualPrompt] = useState('');
    const [dialogueItems, setDialogueItems] = useState<FilmDialogueItem[]>([]);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
    const [showAIModal, setShowAIModal] = useState(false);
    const [genProduct, setGenProduct] = useState<GenerationProduct>('TEXT_TO_VIDEO');
    const [selectedPlatform, setSelectedPlatform] = useState<string>('keling-v1');
    const [assets, setAssets] = useState<AssetMediaResource[]>([]);
    const [activeAssetIndex, setActiveAssetIndex] = useState<number | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [assetModalIndex, setAssetModalIndex] = useState<number | null>(null);

    const handleProductChange = (prod: GenerationProduct) => {
        setGenProduct(prod);
        localStorage.setItem(STORAGE_KEY_PRODUCT, prod);
    };

    useEffect(() => {
        if (isOpen && initialData) {
            setDuration(initialData.duration || 3);
            setDescription(initialData.description || '');
            setVisualPrompt(initialData.generation?.prompt?.base || '');

            if (initialData.dialogue?.items && initialData.dialogue.items.length > 0) {
                setDialogueItems(initialData.dialogue.items);
            } else {
                setDialogueItems([]);
            }

            const savedProduct = localStorage.getItem(STORAGE_KEY_PRODUCT) as GenerationProduct;
            if (initialData.generation?.product) {
                setGenProduct(initialData.generation.product);
            } else if (savedProduct) {
                setGenProduct(savedProduct);
            }

            if (initialData.generation?.modelId) {
                setSelectedPlatform(initialData.generation.modelId);
            }

            let loadedAssets = initialData.generation?.assets || [];
            setAssets(loadedAssets);

            const videoUrl = initialData.generation?.video?.url;
            const imageUrl = initialData.assets?.[0]?.url || loadedAssets.find(a => a.type === MediaResourceType.IMAGE)?.url;

            if (videoUrl) {
                setMediaUrl(videoUrl);
                setMediaType('VIDEO');
            } else if (imageUrl) {
                setMediaUrl(imageUrl);
                setMediaType('IMAGE');
            } else {
                setMediaUrl(null);
            }
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        const data: Partial<FilmShot> = {
            duration,
            description,
            dialogue: { items: dialogueItems },
            generation: {
                ...initialData?.generation,
                product: genProduct,
                modelId: selectedPlatform,
                status: initialData?.generation?.status || 'PENDING',
                prompt: {
                    ...initialData?.generation?.prompt,
                    base: visualPrompt
                },
                assets: assets,
                video: initialData?.generation?.video
            } as any,
            assets: initialData?.assets || []
        };

        onSave(data);
        onClose();
    };

    const handleEnhancePrompt = async (currentText: string): Promise<string> => {
        if (!currentText && !description) return "";
        setIsEnhancing(true);
        try {
            const baseText = currentText || description || 'Cinematic shot';
            const enhanced = await genAIService.enhancePrompt(baseText);
            setVisualPrompt(enhanced);
            return enhanced;
        } catch (e) {
            console.error("Enhancement failed", e);
            return currentText;
        } finally {
            setIsEnhancing(false);
        }
    };

    const addAsset = (kind: MediaResourceType, role?: string) => {
        const now = Date.now();
        const newAsset: AssetMediaResource = {
            id: generateUUID(),
            uuid: generateUUID(),
            type: kind,
            url: '',
            name: `${kind.toLowerCase()}-${assets.length + 1}`,
            scene: MediaScene.REFERENCE,
            createdAt: now,
            updatedAt: now
        } as AssetMediaResource;
        setAssets([...assets, newAsset]);
    };

    const updateAsset = (index: number, updates: Partial<AssetMediaResource>) => {
        setAssets(prev => prev.map((asset, i) => 
            i === index ? { ...asset, ...updates, updatedAt: Date.now() } : asset
        ));
    };

    const removeAsset = (index: number) => {
        setAssets(prev => prev.filter((_, i) => i !== index));
    };

    const inputAttachments = useMemo((): InputAttachment[] => {
        return assets.filter(a => a.url).map((asset, idx) => ({
            id: asset.uuid,
            name: asset.name || `asset-${idx + 1}`,
            url: asset.url,
            type: asset.type === MediaResourceType.IMAGE ? 'image' : asset.type === MediaResourceType.VIDEO ? 'video' : 'audio'
        }));
    }, [assets]);

    const handleChooseFromLibrary = (index: number) => {
        setAssetModalIndex(index);
        setShowAssetModal(true);
    };

    const handleAssetSelected = (selectedAssets: Asset[]) => {
        if (selectedAssets.length > 0 && assetModalIndex !== null) {
            const asset = selectedAssets[0];
            const resourceType: MediaResourceType = 
                asset.type === 'video' ? MediaResourceType.VIDEO : 
                asset.type === 'audio' || asset.type === 'music' || asset.type === 'voice' ? MediaResourceType.AUDIO : MediaResourceType.IMAGE;
            
            updateAsset(assetModalIndex, {
                url: asset.remoteUrl || asset.path,
                name: asset.name,
                type: resourceType
            });
        }
        setShowAssetModal(false);
        setAssetModalIndex(null);
    };

    const addDialogueItem = () => {
        setDialogueItems(prev => [
            ...prev,
            { id: generateUUID(), characterId: characters.length > 0 ? characters[0].uuid : 'narrator', text: '' }
        ]);
    };

    const updateDialogueItem = (id: string, field: keyof FilmDialogueItem, value: string) => {
        setDialogueItems(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeDialogueItem = (id: string) => {
        setDialogueItems(prev => prev.filter(item => item.id !== id));
    };

    const handleLocalUpload = async (index: number) => {
        try {
            const accept = assets[index]?.type === MediaResourceType.AUDIO ? 'audio/*' : 'image/*,video/*';
            const files = await uploadHelper.pickFiles(false, accept);
            if (files.length > 0) {
                const file = files[0];
                const blob = new Blob([new Uint8Array(file.data)]);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    const fileName = file.name || 'uploaded';
                    const detectedType = file.name?.endsWith('.mp3') || file.name?.endsWith('.wav') ? MediaResourceType.AUDIO 
                        : file.name?.endsWith('.mp4') || file.name?.endsWith('.webm') ? MediaResourceType.VIDEO 
                        : MediaResourceType.IMAGE;
                    updateAsset(index, { 
                        url: base64, 
                        name: fileName,
                        type: detectedType
                    });
                };
                reader.readAsDataURL(blob);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAIModalSuccess = (url: string | string[]) => {
        const finalUrl = Array.isArray(url) ? url[0] : url;
        if (activeAssetIndex !== null) {
            updateAsset(activeAssetIndex, { url: finalUrl });
            setActiveAssetIndex(null);
        } else {
            setMediaUrl(finalUrl);
            setMediaType('IMAGE');
        }
        setShowAIModal(false);
    };

    const getAssetIcon = (kind: MediaResourceType) => {
        switch (kind) {
            case MediaResourceType.IMAGE: return ImageIcon;
            case MediaResourceType.VIDEO: return Video;
            case MediaResourceType.AUDIO: return Music;
            default: return FileImage;
        }
    };

    const renderAssetSlot = (asset: AssetMediaResource, index: number) => {
        const Icon = getAssetIcon(asset.type as MediaResourceType);
        
        const getTypeColor = () => {
            switch (asset.type) {
                case MediaResourceType.IMAGE: return 'text-blue-400 border-blue-500/30';
                case MediaResourceType.VIDEO: return 'text-green-400 border-green-500/30';
                case MediaResourceType.AUDIO: return 'text-purple-400 border-purple-500/30';
                default: return 'text-gray-400 border-gray-500/30';
            }
        };

        const getTypeLabel = () => {
            switch (asset.type) {
                case MediaResourceType.IMAGE: return '图片';
                case MediaResourceType.VIDEO: return '视频';
                case MediaResourceType.AUDIO: return '音频';
                default: return '资产';
            }
        };

        return (
            <div key={asset.id} className="space-y-3 group/slot">
                <div className="flex justify-between items-center gap-2 min-h-[44px]">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className={`p-2 rounded-lg bg-[#1a1a1a] ${getTypeColor()} flex-shrink-0`}>
                            <Icon size={14} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider leading-tight">
                                {asset.scene ? ASSET_ROLES[asset.scene as keyof typeof ASSET_ROLES] || getTypeLabel() : getTypeLabel()}
                            </span>
                            {asset.name && asset.url && (
                                <span className="text-[9px] text-gray-500 truncate max-w-[130px] leading-tight">{asset.name}</span>
                            )}
                        </div>
                    </div>
                    <select 
                        value={asset.scene || MediaScene.REFERENCE}
                        onChange={(e) => updateAsset(index, { scene: e.target.value as MediaScene })}
                        className="bg-[#18181b] border border-[#333] hover:border-[#444] rounded-lg px-2.5 py-1.5 text-[9px] text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer flex-shrink-0"
                    >
                        <option value={MediaScene.REFERENCE}>参考</option>
                        <option value={MediaScene.FIRST_FRAME}>开始帧</option>
                        <option value={MediaScene.END_FRAME}>结束帧</option>
                        <option value="AUDIO_TRACK">音频轨</option>
                    </select>
                </div>
                
                <div className={`relative w-full ${asset.type === MediaResourceType.AUDIO ? 'h-32' : 'aspect-video'} bg-[#121214] border-2 border-[#27272a] hover:border-[#444] rounded-xl overflow-hidden flex flex-col transition-all group cursor-pointer shadow-sm hover:shadow-md`}>
                    {asset.url ? (
                        <>
                            {asset.type === MediaResourceType.AUDIO ? (
                                <div className="flex flex-col items-center justify-center w-full h-full p-5 bg-gradient-to-br from-purple-900/25 via-purple-900/10 to-indigo-900/25">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-3 rounded-full bg-purple-500/20">
                                            <Music size={28} className="text-purple-400 animate-pulse" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[12px] font-medium text-gray-200 truncate max-w-[150px] leading-tight">{asset.name || '音频文件'}</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">点击下方播放</span>
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <audio 
                                            src={asset.url} 
                                            controls 
                                            className="w-full h-10 [&::-webkit-media-controls-panel]:bg-[#1a1a1a] [&::-webkit-media-controls-current-time-display]:text-gray-300 [&::-webkit-media-controls-time-remaining-display]:text-gray-300"
                                        />
                                    </div>
                                </div>
                            ) : asset.type === MediaResourceType.VIDEO ? (
                                <div className="relative w-full h-full">
                                    <video 
                                        src={asset.url} 
                                        className="w-full h-full object-cover"
                                        poster=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-4">
                                        <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <Play size={14} className="text-white" />
                                            <span className="text-[11px] text-white font-medium">点击播放</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                                        <Video size={12} className="text-green-400" />
                                        <span className="text-[10px] text-white font-medium">视频</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    <img 
                                        src={asset.url} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                        alt={asset.name}
                                    />
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                                        <ImageIcon size={12} className="text-blue-400" />
                                        <span className="text-[10px] text-white font-medium">图片</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 text-gray-600 w-full h-full p-5">
                            <div className={`p-4 rounded-2xl bg-[#1a1a1a] border border-dashed border-[#333] ${getTypeColor()}`}>
                                <Icon size={28} />
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[12px] font-medium text-gray-400">暂无{getTypeLabel()}</span>
                                <span className="text-[10px] text-gray-600">上传或从资产库选择</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3 z-10">
                        <button 
                            onClick={() => handleLocalUpload(index)}
                            className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#252526] text-gray-300 hover:text-white flex items-center justify-center transition-all border border-[#333] hover:border-gray-400 shadow-lg hover:shadow-xl hover:scale-110"
                            title="上传文件"
                        >
                            <Upload size={18} />
                        </button>
                        
                        <button 
                            onClick={() => handleChooseFromLibrary(index)}
                            className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#252526] text-gray-300 hover:text-white flex items-center justify-center transition-all border border-[#333] hover:border-gray-400 shadow-lg hover:shadow-xl hover:scale-110"
                            title="从资产库选择"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        
                        {asset.type === MediaResourceType.IMAGE && (
                            <button 
                                onClick={() => { setActiveAssetIndex(index); setShowAIModal(true); }}
                                className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/30 hover:scale-110"
                                title="AI生成图片"
                            >
                                <Wand2 size={18} />
                            </button>
                        )}

                        <button 
                            onClick={() => removeAsset(index)}
                            className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all border border-[#333] hover:border-red-500/30 shadow-lg hover:shadow-xl hover:scale-110"
                            title="删除资产"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderGenInputs = () => {
        switch (genProduct) {
            case 'TEXT_TO_VIDEO':
                return (
                    <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                        <Type size={28} className="mx-auto mb-3 opacity-40" />
                        <p className="text-gray-400">仅使用文字提示词生成视频</p>
                        <p className="text-[10px] text-gray-600 mt-1">无需上传参考资源</p>
                    </div>
                );
            
            case 'IMAGE_TO_VIDEO':
            case 'REFERENCE_GUIDED':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Layers size={12} /> 参考资产
                            </label>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => addAsset(MediaResourceType.IMAGE, 'REFERENCE')} 
                                    className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-blue-500/20 hover:border-blue-500/40"
                                >
                                    <Plus size={10} /> 添加图片
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {assets.map((asset, idx) => renderAssetSlot(asset, idx))}
                        </div>
                        {assets.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <Layers size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">请添加参考资产</p>
                                <p className="text-[10px] text-gray-600 mt-1">参考资产引导视频生成</p>
                            </div>
                        )}
                    </div>
                );
            
            case 'START_END_FRAMES':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRightLeft size={12} /> 首尾帧
                            </label>
                            <div className="flex gap-1.5">
                                {!assets.find(a => a.scene === MediaScene.FIRST_FRAME) && (
                                    <button 
                                        onClick={() => addAsset(MediaResourceType.IMAGE, 'FIRST_FRAME')} 
                                        className="text-[10px] text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
                                    >
                                        <Plus size={10} /> 开始帧
                                    </button>
                                )}
                                {!assets.find(a => a.scene === MediaScene.END_FRAME) && (
                                    <button 
                                        onClick={() => addAsset(MediaResourceType.IMAGE, 'END_FRAME')} 
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
                                    >
                                        <Plus size={10} /> 结束帧
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {(() => {
                                const startFrame = assets.find(a => a.scene === MediaScene.FIRST_FRAME);
                                const endFrame = assets.find(a => a.scene === MediaScene.END_FRAME);
                                const displayAssets: AssetMediaResource[] = [];
                                if (startFrame) displayAssets.push(startFrame);
                                if (endFrame) displayAssets.push(endFrame);
                                return displayAssets.map((asset) => renderAssetSlot(asset, assets.indexOf(asset)));
                            })()}
                        </div>
                        {assets.filter(a => a.scene === MediaScene.FIRST_FRAME || a.scene === MediaScene.END_FRAME).length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <ArrowRightLeft size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">请添加开始帧和结束帧</p>
                                <p className="text-[10px] text-gray-600 mt-1">基于首尾帧生成视频</p>
                            </div>
                        )}
                    </div>
                );
            
            case 'MULTI_FRAME_INTELLIGENT':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Grid3x3 size={12} /> 多帧参考 (最多6张)
                            </label>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => addAsset(MediaResourceType.IMAGE, 'REFERENCE')} 
                                    disabled={assets.length >= 6}
                                    className={`text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border ${assets.length >= 6 ? 'text-gray-600 bg-gray-800/30 border-gray-700/30 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/40'}`}
                                >
                                    <Plus size={10} /> 添加
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {assets.slice(0, 6).map((asset, idx) => renderAssetSlot(asset, idx))}
                        </div>
                        {assets.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <Grid3x3 size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">请添加多帧参考</p>
                                <p className="text-[10px] text-gray-600 mt-1">智能多帧/分镜生成</p>
                            </div>
                        )}
                    </div>
                );
            
            case 'UNIVERSAL_REFERENCE':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity size={12} /> 全能智能参考 (图片/视频/音频)
                            </label>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => addAsset(MediaResourceType.IMAGE)} 
                                    className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-blue-500/20 hover:border-blue-500/40"
                                >
                                    <ImageIcon size={10} /> 图片
                                </button>
                                <button 
                                    onClick={() => addAsset(MediaResourceType.VIDEO)} 
                                    className="text-[10px] text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-green-500/20 hover:border-green-500/40"
                                >
                                    <Video size={10} /> 视频
                                </button>
                                <button 
                                    onClick={() => addAsset(MediaResourceType.AUDIO)} 
                                    className="text-[10px] text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-purple-500/20 hover:border-purple-500/40"
                                >
                                    <Music size={10} /> 音频
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {assets.map((asset, idx) => renderAssetSlot(asset, idx))}
                        </div>
                        {assets.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <Activity size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">请添加全能智能参考资产</p>
                                <p className="text-[10px] text-gray-600 mt-1">支持图片、视频、音频</p>
                            </div>
                        )}
                    </div>
                );
            
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-7xl bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Clapperboard size={18} className="text-blue-500" />
                        编辑分镜 (Edit Shot) {sceneIndex ? `- Scene ${sceneIndex}` : ''} {initialData?.index ? `Shot ${initialData.index}` : ''}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-[520px] flex-none border-r border-[#333] bg-[#1a1a1a] flex flex-col p-6 overflow-y-auto custom-scrollbar">
                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Video size={12} /> Visual Result</span>
                                {mediaType === 'VIDEO' && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50">VIDEO GENERATED</span>}
                            </div>
                            <div className="relative group w-full aspect-video bg-[#000] border border-[#333] hover:border-[#555] rounded-xl overflow-hidden flex flex-col transition-all items-center justify-center shrink-0 shadow-lg">
                                {mediaUrl ? (
                                    <>
                                        {mediaType === 'VIDEO' ? <video src={mediaUrl} className="w-full h-full object-cover" controls /> : <img src={mediaUrl} className="w-full h-full object-cover" alt="Shot Visual" />}
                                        {mediaType === 'IMAGE' && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <button onClick={() => { setActiveAssetIndex(null); setShowAIModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-white text-xs font-medium border border-white/10 shadow-lg">
                                                    <Wand2 size={14} /> Regenerate Image
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center w-full h-full text-gray-600">
                                        <Clapperboard size={32} className="mb-2 opacity-50" />
                                        <p className="text-xs">No visual generated yet.</p>
                                        <Button size="sm" onClick={() => { setActiveAssetIndex(null); setShowAIModal(true); }} className="mt-4 bg-[#252526] hover:bg-[#333] border border-[#333]">
                                            <Wand2 size={14} className="mr-2" /> Generate Concept
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-[#333] mb-6" />

                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generation Settings</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">生成产品 (Product)</label>
                                    <div className="relative">
                                        <select
                                            value={genProduct}
                                            onChange={(e) => handleProductChange(e.target.value as any)}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-medium 
                                                bg-[#18181b] border-[#333] hover:border-[#444] hover:bg-[#202023] text-gray-300
                                                focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                                                appearance-none cursor-pointer
                                            `}
                                        >
                                            {GENERATION_MODES.map(m => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown size={12} className="text-gray-500" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-1">
                                        {GENERATION_MODES.find(m => m.value === genProduct)?.description}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">生成平台 (Platform)</label>
                                    <ModelSelector
                                        value={selectedPlatform}
                                        onChange={setSelectedPlatform}
                                        providers={PLATFORM_PROVIDERS}
                                        label="选择平台 & 模型"
                                    />
                                </div>
                            </div>

                            {renderGenInputs()}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div>
                             <PromptTextInput 
                                label="生成提示词 (Visual Prompt)"
                                value={visualPrompt}
                                onChange={setVisualPrompt}
                                rows={4}
                                className="bg-[#121214]"
                                placeholder="Cinematic shot of... (Used for AI generation)"
                                onEnhance={handleEnhancePrompt}
                                isEnhancing={isEnhancing}
                                assets={inputAttachments}
                            />
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare size={12} /> 对白 & 脚本 (Dialogue)
                                </label>
                                <button onClick={addDialogueItem} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                                    <Plus size={10} /> Add Line
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {dialogueItems.map((item, idx) => {
                                    const char = characters.find(c => c.uuid === item.characterId);
                                    return (
                                        <div key={item.id} className="flex items-start gap-2 bg-[#121214] p-2 rounded-lg border border-[#27272a]">
                                             <div className="w-8 h-8 rounded bg-[#1e1e1e] flex-shrink-0 overflow-hidden border border-[#333]">
                                                 {(() => {
                                                     const avatarAsset = char?.refAssets?.find(a => a.scene === MediaScene.AVATAR);
                                                     const avatarUrl = avatarAsset?.url || avatarAsset?.image?.url;
                                                     return avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={14}/></div>;
                                                 })()}
                                             </div>
                                             
                                             <div className="flex-1 min-w-0 space-y-1">
                                                 <select 
                                                    value={item.characterId}
                                                    onChange={(e) => updateDialogueItem(item.id, 'characterId', e.target.value)}
                                                    className="w-full bg-[#18181b] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                                                 >
                                                     <option value="narrator">Narrator (旁白)</option>
                                                     {characters.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
                                                 </select>
                                                 <input 
                                                    type="text" 
                                                    value={item.text}
                                                    onChange={(e) => updateDialogueItem(item.id, 'text', e.target.value)}
                                                    placeholder="Enter dialogue..."
                                                    className="w-full bg-transparent border-b border-[#333] focus:border-blue-500 outline-none text-sm text-gray-200 py-1 transition-colors"
                                                 />
                                             </div>

                                             <button onClick={() => removeDialogueItem(item.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    );
                                })}
                                {dialogueItems.length === 0 && (
                                    <div className="text-center py-4 text-xs text-gray-600 border border-dashed border-[#27272a] rounded-lg">
                                        No dialogue. Click "Add Line" to start.
                                    </div>
                                )}
                            </div>
                        </div>

                        <SettingTextArea 
                            label="画面描述 (Description)" 
                            value={description} 
                            onChange={setDescription} 
                            rows={4} 
                            fullWidth 
                            placeholder="Details about the scene environment, lighting, camera movement..."
                        />

                        <div>
                             <SettingSlider label="时长 (Duration)" value={duration} onChange={setDuration} min={1} max={10} step={0.5} unit="s" />
                        </div>

                    </div>
                </div>

                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>取消</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 border-0"><Save size={16} className="mr-2" /> 保存更改</Button>
                </div>
            </div>

            {showAIModal && (
                <AIImageGeneratorModal 
                    contextText={visualPrompt || description}
                    config={{ aspectRatio: '16:9', prompt: visualPrompt || `${description}, cinematic lighting, 8k` }}
                    onClose={() => setShowAIModal(false)}
                    onSuccess={handleAIModalSuccess}
                />
            )}

            {showAssetModal && (
                <ChooseAssetModal
                    isOpen={showAssetModal}
                    onClose={() => {
                        setShowAssetModal(false);
                        setAssetModalIndex(null);
                    }}
                    onConfirm={handleAssetSelected}
                    accepts={assetModalIndex !== null 
                        ? (assets[assetModalIndex]?.type === MediaResourceType.VIDEO 
                            ? ['video'] 
                            : assets[assetModalIndex]?.type === MediaResourceType.AUDIO 
                            ? ['audio', 'music', 'voice', 'sfx'] 
                            : ['image'])
                        : ['image', 'video', 'audio']}
                    title="选择资产"
                    multiple={false}
                />
            )}
        </div>,
        document.body
    );
};

