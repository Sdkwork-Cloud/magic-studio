
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Type, LayoutTemplate, Link as LinkIcon, Check, Smartphone, AppWindow, Link2 } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { ChooseAsset } from '../../assets/components/ChooseAsset';
import { Asset } from '../../assets/entities/asset.entity';
import { platform } from '../../../platform';

interface MiniProgramModalProps {
    onClose: () => void;
    onInsert: (data: any) => void;
}

type DisplayMode = 'text' | 'image' | 'card';

export const MiniProgramModal: React.FC<MiniProgramModalProps> = ({ onClose, onInsert }) => {
    const [appid, setAppid] = useState('');
    const [path, setPath] = useState('');
    const [mode, setMode] = useState<DisplayMode>('card');
    
    // Card & Text Data
    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [textContent, setTextContent] = useState('');

    const handleAssetChange = (asset: Asset | null) => {
        if (!asset) {
            setImageUrl('');
            return;
        }
        let url = asset.path || asset.id;
        if (platform.getPlatform() === 'desktop' && !url.startsWith('http') && !url.startsWith('data:')) {
            try {
                url = platform.convertFileSrc(url);
            } catch (e) {
                console.warn("Failed to convert asset src", e);
            }
        }
        setImageUrl(url);
    };

    const handleConfirm = () => {
        if (!appid) {
            window.alert('AppID is required');
            return;
        }

        onInsert({
            appid,
            path: path || 'pages/index/index',
            type: mode,
            title: title || 'Mini Program',
            image: imageUrl,
            text: textContent || title || 'Mini Program Link',
            service: '0'
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-[#333] flex justify-between items-center bg-gray-50 dark:bg-[#252526]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                            <LayoutTemplate size={18} />
                        </div>
                        <div>
                            <h3 className="text-gray-900 dark:text-white font-bold text-base">插入小程序</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Insert WeChat Mini Program</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Split Layout */}
                <div className="flex-1 overflow-hidden flex">
                    
                    {/* LEFT: Configuration Form */}
                    <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200 dark:border-[#333]">
                        <div className="space-y-6 max-w-lg mx-auto">
                            
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">基本信息 (Basic)</h4>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">AppID <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 font-mono transition-colors"
                                        placeholder="wx..."
                                        value={appid}
                                        onChange={(e) => setAppid(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Page Path</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 font-mono transition-colors"
                                        placeholder="pages/index/index"
                                        value={path}
                                        onChange={(e) => setPath(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-[#333]" />

                            {/* Display Mode */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">展示方式 (Display)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                     <ModeRadio 
                                        label="卡片" 
                                        icon={<LayoutTemplate size={16}/>} 
                                        active={mode === 'card'} 
                                        onClick={() => setMode('card')} 
                                    />
                                     <ModeRadio 
                                        label="图片" 
                                        icon={<ImageIcon size={16}/>} 
                                        active={mode === 'image'} 
                                        onClick={() => setMode('image')} 
                                    />
                                     <ModeRadio 
                                        label="文字" 
                                        icon={<Type size={16}/>} 
                                        active={mode === 'text'} 
                                        onClick={() => setMode('text')} 
                                    />
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="space-y-4">
                                {mode === 'text' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">链接文字 (Text)</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                                            placeholder="点此打开小程序"
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                        />
                                    </div>
                                )}

                                {mode === 'card' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">卡片标题 (Title)</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                                                placeholder="小程序标题"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">封面图片 (Cover)</label>
                                            <div className="h-48">
                                                <ChooseAsset
                                                    value={imageUrl}
                                                    onChange={handleAssetChange}
                                                    accepts={['image']}
                                                    label="选择或上传封面 (5:4)"
                                                    aspectRatio="aspect-[5/4]"
                                                    className="bg-white dark:bg-[#111] border-gray-200 dark:border-[#333]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {mode === 'image' && (
                                     <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">图片 (Image)</label>
                                        <div className="h-48">
                                            <ChooseAsset
                                                value={imageUrl}
                                                onChange={handleAssetChange}
                                                accepts={['image']}
                                                label="选择或上传图片"
                                                aspectRatio="aspect-video"
                                                className="bg-white dark:bg-[#111] border-gray-200 dark:border-[#333]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Live Preview */}
                    <div className="w-[360px] bg-gray-100 dark:bg-[#111] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 opacity-5 dark:opacity-5 pointer-events-none" 
                              style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                         />
                         
                         <div className="mb-4 flex items-center gap-2 text-gray-400">
                             <Smartphone size={16} />
                             <span className="text-xs font-bold uppercase tracking-widest">Live Preview</span>
                         </div>

                         {/* Phone Mockup / Chat Bubble Area */}
                         <div className="w-[300px] bg-[#f5f5f5] dark:bg-[#191919] rounded-[20px] shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col">
                             {/* Chat Header */}
                             <div className="h-12 bg-[#ededed] dark:bg-[#222] border-b border-gray-200 dark:border-[#333] flex items-center px-4 justify-center relative">
                                 <span className="text-xs font-medium text-gray-800 dark:text-gray-200">WeChat</span>
                                 <div className="absolute right-3 flex gap-1">
                                     <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                     <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                     <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                 </div>
                             </div>

                             {/* Chat Body */}
                             <div className="flex-1 p-4 flex flex-col gap-4 bg-[#ededed] dark:bg-[#111]">
                                 <div className="flex gap-2">
                                     <div className="w-8 h-8 rounded bg-gray-300 dark:bg-[#333]" />
                                     <div className="bg-white dark:bg-[#252526] p-2 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm max-w-[200px]">
                                         Here is the mini program:
                                     </div>
                                 </div>

                                 <div className="flex flex-row-reverse gap-2">
                                     <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center text-white text-xs font-bold">Me</div>
                                     <div className="max-w-[220px]">
                                          <WeChatPreview 
                                            mode={mode}
                                            title={title}
                                            image={imageUrl}
                                            text={textContent}
                                          />
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#252526] flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {(!appid) && <span className="text-orange-500 flex items-center gap-1"><LinkIcon size={12}/> AppID Required</span>}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>取消 (Cancel)</Button>
                        <Button 
                            onClick={handleConfirm} 
                            disabled={!appid}
                            className="bg-green-600 hover:bg-green-500 text-white border-0 shadow-lg shadow-green-900/20 px-8"
                        >
                            确定 (Confirm)
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Updated Preview to match Node Style
const WeChatPreview: React.FC<{ mode: DisplayMode, title: string, image: string, text: string }> = ({ mode, title, image, text }) => {
    if (mode === 'text') {
        return (
            <span className="inline-flex items-center gap-1 text-[#576b95] dark:text-blue-400 hover:underline cursor-pointer bg-white dark:bg-[#252526] p-2 rounded-lg shadow-sm">
                <AppWindow size={14} className="inline align-text-bottom" />
                <span>{text || title || 'Open Mini Program'}</span>
            </span>
        );
    }

    if (mode === 'image') {
        return (
             <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm max-w-[120px]">
                 {image ? (
                     <img src={image} className="w-full h-auto block" alt="Preview" />
                 ) : (
                     <div className="w-[120px] h-[120px] bg-gray-200 dark:bg-[#333] flex items-center justify-center text-gray-400">
                         <ImageIcon size={32} />
                     </div>
                 )}
                 <div className="absolute bottom-1 right-1 bg-black/50 text-[8px] text-white px-1 rounded flex items-center gap-0.5">
                     <AppWindow size={8} /> 小程序
                 </div>
             </div>
        );
    }

    // Official Card Style Preview
    return (
        <div className="flex flex-col bg-white dark:bg-[#252526] border border-[#e5e5e5] dark:border-[#333] rounded-[4px] overflow-hidden max-w-[210px] shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f0f0f0] dark:border-[#333]">
                <div className="w-4 h-4 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
                    <AppWindow size={10} className="text-blue-600" />
                </div>
                <span className="text-[10px] text-[#666] dark:text-[#aaa] truncate">Mini Program</span>
            </div>

            {/* Body */}
            <div className="p-3">
                 <div className="text-[12px] font-bold text-[#333] dark:text-[#eee] leading-snug line-clamp-2 mb-2">
                     {title || 'Mini Program Title'}
                 </div>
                 <div className="relative w-full aspect-[5/4] bg-[#f5f5f5] dark:bg-[#111] overflow-hidden rounded-[2px]">
                    {image ? (
                        <img src={image} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={24} />
                        </div>
                    )}
                    <div className="absolute bottom-1 left-2 flex items-center gap-1 opacity-80">
                         <div className="w-3 h-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Link2 size={8} className="text-white" />
                         </div>
                         <span className="text-[8px] text-white text-shadow-sm">小程序</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-[#f0f0f0] dark:border-[#333] flex items-center bg-[#fafafa] dark:bg-[#202022]">
                <div className="flex items-center gap-1 text-[#576b95] dark:text-blue-400">
                    <div className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center">
                        <span className="text-[6px] font-bold">S</span> 
                    </div>
                    <span className="text-[9px]">WeChat Mini Program</span>
                </div>
            </div>
        </div>
    );
};

const ModeRadio: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 relative
            ${active 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-500 text-green-700 dark:text-green-400 ring-1 ring-green-500/20' 
                : 'bg-gray-50 dark:bg-[#252526] border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2c]'
            }
        `}
    >
        {active && (
            <div className="absolute top-2 right-2 text-green-500">
                <Check size={14} strokeWidth={3} />
            </div>
        )}
        <div className={`p-2 rounded-full ${active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-[#333]'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold">{label}</span>
    </button>
);
