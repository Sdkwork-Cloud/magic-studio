
import React, { useRef, useState, useLayoutEffect, forwardRef, useEffect } from 'react';
import { ElementToolbar } from './ElementToolbar';
import { Z_LAYERS } from './CanvasBoard';
import { 
    Image as ImageIcon, FileText, StickyNote, Box, Upload, RefreshCw, 
    ChevronDown, ArrowRightLeft, Layers, ScanFace, Sparkles, Check
} from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { genAIService, uploadHelper } from '@sdkwork/react-core';
import { CanvasElement } from '../entities/canvas.entity';
import { Popover, AspectRatioSelector } from '@sdkwork/react-commons';
import { assetService, CreationChatInput, InputFooterButton, InputAttachment } from '@sdkwork/react-assets';
import { ImageModelSelector } from '@sdkwork/react-image';
import { VideoModelSelector } from '@sdkwork/react-video';
import { textRenderer, TextStyle } from '@sdkwork/react-magiccut';
import { VideoNode } from './nodes/VideoNode';

export type LODLevel = 'detail' | 'simplified' | 'block';

interface CanvasNodeProps {
    element: CanvasElement;
    onMouseDown: (e: React.MouseEvent, nodeId: string, forceDeep?: boolean) => void;
    onOpenDrawer?: (e: React.MouseEvent, nodeId: string) => void;
    onConnectStart: (e: React.MouseEvent, nodeId: string, type: 'in' | 'out') => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
    zIndex?: number;
    lod?: LODLevel;
}

const DRAG_THRESHOLD = 5;
const MAX_INITIAL_MEDIA_SIZE = 500;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const VideoModeDropdown: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const modes = [
        { id: 'start_end', label: 'Start/End', icon: ArrowRightLeft },
        { id: 'smart_multi', label: 'Multi-Ref', icon: Layers },
        { id: 'subject_ref', label: 'Subject', icon: ScanFace },
        { id: 'all_round', label: 'Universal', icon: Sparkles, isNew: true },
    ];

    const activeMode = modes.find(m => m.id === value) || modes[0];
    const ActiveIcon = activeMode.icon;

    return (
        <>
            <InputFooterButton
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                active={isOpen}
                icon={<ActiveIcon size={14} className={isOpen ? 'text-white' : 'text-pink-400'} />}
                label={activeMode.label}
                suffix={<ChevronDown size={10} className={`opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                className="bg-transparent border-transparent hover:bg-[#ffffff08] h-8 text-xs"
            />
            <Popover
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                triggerRef={triggerRef}
                width={160}
                className="p-1 flex flex-col gap-0.5 bg-[#18181b] border border-[#27272a]"
            >
                {modes.map(m => (
                    <button
                        key={m.id}
                        onClick={() => { onChange(m.id); setIsOpen(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${value === m.id ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#202022]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <m.icon size={14} className={value === m.id ? 'text-pink-400' : 'opacity-70'} />
                            {m.label}
                            {m.isNew && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 rounded font-bold">NEW</span>}
                        </div>
                        {value === m.id && <Check size={12} className="text-pink-500" />}
                    </button>
                ))}
            </Popover>
        </>
    );
};

export const CanvasNode = React.memo(forwardRef<HTMLDivElement, CanvasNodeProps>(({ 
    element, onMouseDown, onOpenDrawer, onConnectStart, onContextMenu, zIndex, lod = 'detail'
}, ref) => {
    const { id, type, x, y, width, height, resource, data, selected, color, style } = element;
    const { updateElement, viewport, selectedIds } = useCanvasStore();

    const [_isResizing, setIsResizing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
    const [resolvedUrl, setResolvedUrl] = useState<string>('');
    
    const internalRef = useRef<HTMLDivElement>(null);
    const startPosRef = useRef<{x: number, y: number} | null>(null);

    const selectionCount = selectedIds.size;
    const isMedia = type === 'image' || type === 'video';
    
    useEffect(() => {
        if (!resource) {
            setResolvedUrl('');
            return;
        }
        let isMounted = true;
        const resolve = async () => {
            const url = await assetService.resolveAssetUrl(resource);
            if (isMounted) setResolvedUrl(url || '');
        };
        resolve();
        return () => { isMounted = false; };
    }, [resource?.id, resource?.path, resource?.url]);

    const displaySrc = resolvedUrl;
    let textContent = resource?.metadata?.text || '';

    useLayoutEffect(() => {
        if (typeof ref === 'function') ref(internalRef.current);
        else if (ref) ref.current = internalRef.current;
    }, [ref]);

    useLayoutEffect(() => {
        if (selected && internalRef.current) {
            const rect = internalRef.current.getBoundingClientRect();
            const REQUIRED_HEIGHT = 280; 
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            if (spaceBelow >= REQUIRED_HEIGHT) setPlacement('bottom');
            else if (spaceAbove >= REQUIRED_HEIGHT) setPlacement('top');
            else setPlacement(spaceBelow >= spaceAbove ? 'bottom' : 'top');
        }
    }, [selected, x, y, width, height, viewport]);

    const handleToolbarCallback = (action: string) => {
        switch (action) {
            case 'edit-text': setIsEditing(true); break;
        }
    };
    
    const updateTextContent = (text: string) => {
        if (resource) {
            const fontSize = resource.metadata?.fontSize || 60;
            const textStyle: TextStyle = {
                fontSize,
                fontFamily: resource.metadata?.fontFamily || 'Inter, sans-serif',
                fontWeight: resource.metadata?.fontWeight || 'bold',
                color: '#ffffff',
                backgroundPadding: 10
            };
            const { width: newW, height: newH } = textRenderer.measure(text, textStyle);
            updateElement(id, { 
                width: newW, height: newH,
                resource: { ...resource, metadata: { ...resource.metadata, text } } 
            }, false);
        }
    };

    const handleAttachmentUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(true, 'image/*'); 
            if (files.length > 0) {
                const newImages: string[] = [];
                for (const file of files) {
                    const blob = new Blob([new Uint8Array(file.data)], { type: 'image/png' });
                    const base64 = await blobToBase64(blob);
                    newImages.push(base64);
                }
                const currentRefs = data?.referenceImages || [];
                const updatedRefs = [...currentRefs, ...newImages].slice(0, 5);
                updateElement(id, { data: { ...data, referenceImages: updatedRefs } }, false);
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    const handleRemoveAttachment = (attId: string) => {
         const idx = parseInt(attId.split('-')[1]);
         const currentRefs = data?.referenceImages || [];
         const newRefs = currentRefs.filter((_, i) => i !== idx);
         updateElement(id, { data: { ...data, referenceImages: newRefs } }, false);
    };

    const attachments: InputAttachment[] = (data?.referenceImages || []).map((url, i) => ({
        id: `ref-${i}`,
        name: `Ref ${i+1}`,
        type: 'image',
        url: url
    }));

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
             const prompt = data?.prompt || (resource?.metadata?.text) || resource?.name || '';
             if (!prompt.trim() && attachments.length === 0) throw new Error("Prompt is empty");

             let resultUrl = '';
             let assetType: 'image' | 'video' = 'image';

             if (type === 'image') {
                 const refImage = data?.referenceImages?.[0];
                 resultUrl = await genAIService.generateImage({
                     prompt,
                     aspectRatio: (data?.aspectRatio as any) || '1:1',
                     referenceImage: refImage
                 });
                 assetType = 'image';
             } else if (type === 'video') {
                 const startFrame = data?.referenceImages?.[0];
                 resultUrl = await genAIService.generateVideo(prompt, startFrame);
                 assetType = 'video';
             }

             if (!resultUrl) throw new Error("Generation returned empty URL");

             const newAsset = await assetService.saveGeneratedAsset(
                 resultUrl, assetType, { prompt }, `canvas_gen_${type}_${Date.now()}`
             );
             const newResource = assetService.toMediaResource(newAsset);
             
             let newWidth = width;
             let newHeight = height;
             if (newAsset.metadata.width && newAsset.metadata.height) {
                 const ratio = newAsset.metadata.width / newAsset.metadata.height;
                 newHeight = width / ratio;
             }

             updateElement(id, {
                 resource: newResource,
                 width: newWidth,
                 height: newHeight,
                 data: { ...data, status: 'completed', resultUrl: newAsset.path }
             });

        } catch (e: any) {
            console.error("Canvas Generation Failed", e);
            updateElement(id, { data: { ...data, status: 'failed', error: e.message } });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInteractionStart = (e: React.MouseEvent) => {
        startPosRef.current = { x: e.clientX, y: e.clientY };
        
        // Alt+Click to open drawer for image/video nodes
        if (e.altKey && (type === 'image' || type === 'video') && e.button === 0) {
            e.stopPropagation();
            // First select the node if not already selected
            if (!selected) {
                onMouseDown(e, id);
            }
            onOpenDrawer?.(e, id);
            return;
        }
        
        if (!_isResizing && !isEditing) {
            e.stopPropagation(); 
            if (e.button === 0) onMouseDown(e, id);
        }
    };

    const handleUploadClick = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (startPosRef.current && e) {
            if (Math.hypot(e.clientX - startPosRef.current.x, e.clientY - startPosRef.current.y) > DRAG_THRESHOLD) return; 
        }
        try {
            const accept = type === 'video' ? 'video/*' : 'image/*';
            const files = await uploadHelper.pickFiles(true, accept);
            if (files.length > 0) {
                const file = files[0];
                const savedAsset = await assetService.importAsset(file.data, file.name, type as 'image' | 'video');
                const newResource = assetService.toMediaResource(savedAsset);
                
                let newWidth = element.width;
                let newHeight = element.height;
                const metaWidth = savedAsset.metadata?.width || 0;
                const metaHeight = savedAsset.metadata?.height || 0;

                if (metaWidth > 0 && metaHeight > 0) {
                    const ratio = metaWidth / metaHeight;
                    newWidth = metaWidth;
                    newHeight = metaHeight;
                    if (newWidth > MAX_INITIAL_MEDIA_SIZE || newHeight > MAX_INITIAL_MEDIA_SIZE) {
                        if (ratio >= 1) { newWidth = MAX_INITIAL_MEDIA_SIZE; newHeight = newWidth / ratio; } 
                        else { newHeight = MAX_INITIAL_MEDIA_SIZE; newWidth = newHeight * ratio; }
                    }
                }
                updateElement(id, { 
                    resource: newResource, width: newWidth, height: newHeight,
                    data: { ...data, duration: savedAsset.metadata?.duration ? String(savedAsset.metadata.duration) : undefined }
                }, true);
            }
        } catch (err) { console.error("Upload failed", err); }
    };

    // --- Footer Controls ---
    const renderFooterControls = () => {
        // Transparent button style consistent with CreationChatInput
        const buttonClass = "bg-transparent border-transparent hover:bg-[#ffffff08] h-8 text-xs";

        return (
            <div className="flex items-center gap-2 w-full">
                {/* 1. Model Selector */}
                <div className="min-w-[120px]">
                    {type === 'video' ? (
                        <VideoModelSelector 
                            value={data?.model || 'sdkwork-2.5'} 
                            onChange={(m: string) => updateElement(id, { data: { ...data, model: m } })} 
                            className={buttonClass + " w-full justify-between px-2 rounded-lg"}
                            disabled={isGenerating} 
                        />
                    ) : (
                        <ImageModelSelector 
                            value={data?.model || 'gemini-3-flash-image'} 
                            onChange={(m: string) => updateElement(id, { data: { ...data, model: m } })} 
                            className={buttonClass + " w-full justify-between px-2 rounded-lg"}
                            disabled={isGenerating} 
                        />
                    )}
                </div>
                
                {/* 2. Config Selectors */}
                <div className="flex items-center gap-1">
                    {type === 'video' ? (
                        <VideoModeDropdown 
                            value={data?.videoMode || 'start_end'} 
                            onChange={(m: string) => updateElement(id, { data: { ...data, videoMode: m } })} 
                        />
                    ) : (
                        <AspectRatioSelector 
                            value={(data?.aspectRatio as any) || '1:1'}
                            onChange={(r: string) => updateElement(id, { data: { ...data, aspectRatio: r as any } })}
                            resolution={(data?.resolution as any) || '2k'}
                            onResolutionChange={(r: string) => updateElement(id, { data: { ...data, resolution: r as any } })}
                            className={buttonClass + " text-gray-400 hover:text-white"}
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderDetailLOD = () => {
        const commonClasses = "w-full h-full flex flex-col overflow-hidden transition-all duration-200";
        const mediaContainerClass = `${commonClasses} ${selected ? 'bg-[#18181b] rounded-xl' : 'bg-transparent rounded-none'} ${!displaySrc ? 'border-2 border-dashed border-[#27272a]' : ''} group/content relative`;

        switch (type) {
            case 'image':
                return (
                    <div className={mediaContainerClass} onDoubleClick={(e) => { e.stopPropagation(); if(!displaySrc) handleUploadClick(); }}>
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                            {displaySrc ? (
                                <img src={displaySrc} className="w-full h-full object-fill rounded-lg" alt="" draggable={false} />
                            ) : (
                                !isGenerating && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 group-hover/content:opacity-60 transition-opacity">
                                        <div className="p-3 rounded-full border-2 border-dashed border-white/20 mb-2"><ImageIcon size={24} /></div>
                                        <span className="text-[10px] font-medium tracking-widest uppercase">Double click to Upload</span>
                                    </div>
                                )
                            )}
                            <div className={`absolute top-2 right-2 flex gap-2 ${selected || !displaySrc ? 'opacity-100' : 'opacity-0 group-hover/content:opacity-100'} transition-opacity z-20`}>
                                <button onClick={handleUploadClick} onMouseDown={(e) => e.stopPropagation()} className="p-1.5 bg-[#27272a]/90 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg backdrop-blur-md border border-white/10 transition-colors pointer-events-auto cursor-pointer shadow-sm">
                                    {displaySrc ? <RefreshCw size={14} /> : <Upload size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div className={`${commonClasses} rounded-xl bg-[#121212] overflow-hidden shadow-sm`}>
                        <VideoNode src={displaySrc || null} isSelected={!!selected} isGenerating={isGenerating} onUpload={handleUploadClick} />
                        {resource?.metadata?.duration && <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none z-10">{Math.round(Number(resource.metadata.duration))}s</div>}
                    </div>
                );
            case 'text':
                return (
                     <div className={`${commonClasses} p-2 rounded-lg border border-transparent ${isEditing ? 'cursor-text' : 'cursor-grab hover:border-white/10'}`}>
                         {isEditing ? (
                             <textarea 
                                autoFocus 
                                className="w-full h-full bg-transparent resize-none outline-none pointer-events-auto cursor-text text-center flex items-center justify-center overflow-hidden" 
                                value={textContent} onChange={(e) => updateTextContent(e.target.value)} onBlur={() => setIsEditing(false)} onKeyDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} 
                                style={{ fontSize: `${resource?.metadata?.fontSize || 60}px`, fontWeight: resource?.metadata?.fontWeight || 'bold', fontFamily: resource?.metadata?.fontFamily || 'Inter, sans-serif', color: '#ffffff', lineHeight: 1.2 }} 
                            />
                         ) : (
                             <div 
                                className="w-full h-full whitespace-pre-wrap select-none flex items-center justify-center text-center leading-tight"
                                style={{ fontSize: `${resource?.metadata?.fontSize || 60}px`, fontWeight: resource?.metadata?.fontWeight || 'bold', fontFamily: resource?.metadata?.fontFamily || 'Inter, sans-serif', color: '#ffffff', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                {textContent || 'Double click to edit'}
                            </div>
                         )}
                     </div>
                );
            case 'note':
                return (
                    <div className={`${commonClasses} p-4 shadow-lg rounded-lg ${isEditing ? 'cursor-text' : 'cursor-grab'}`} style={{ backgroundColor: color, ...style }}>
                         {isEditing ? (
                             <textarea autoFocus className="w-full h-full bg-transparent resize-none outline-none text-black pointer-events-auto cursor-text" value={textContent} onChange={(e) => updateTextContent(e.target.value)} onBlur={() => setIsEditing(false)} onKeyDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} style={{ fontFamily: 'comic sans ms, sans-serif' }} />
                         ) : (
                             <div className="w-full h-full whitespace-pre-wrap text-black font-medium select-none" style={{ fontFamily: 'comic sans ms, sans-serif' }}>{textContent}</div>
                         )}
                    </div>
                );
            case 'shape':
                return (
                    <div className={`${commonClasses} flex items-center justify-center rounded-xl cursor-grab`} style={{ backgroundColor: color, ...style }}>
                        {textContent && <span className="text-white/50 font-bold">{textContent}</span>}
                    </div>
                );
            default:
                return <div className="w-full h-full border border-red-500">Unknown</div>;
        }
    };

    const renderBlockLOD = () => {
        let Icon = Box;
        if (type === 'image') Icon = ImageIcon;
        if (type === 'text') Icon = FileText;
        if (type === 'note') Icon = StickyNote;
        return <div className="w-full h-full flex items-center justify-center rounded-xl border border-white/10 bg-[#18181b]"><Icon size={Math.min(width, height) * 0.4} className="text-white/20" /></div>;
    };

    if (type === 'group' || type === 'connector') return null;

    const containerStyle: React.CSSProperties = { left: x, top: y, width, height, zIndex: (selected) ? Z_LAYERS.ACTIVE_NODE : (zIndex ?? Z_LAYERS.NODES), transform: `translate3d(0,0,0)` };
    if (type !== 'video' && (!isMedia || selected || !displaySrc)) { containerStyle.borderRadius = '12px'; }
    if (type !== 'video' && !isMedia) { containerStyle.boxShadow = selected ? '0 0 0 1px #3b82f6, 0 20px 50px -10px rgba(0,0,0,0.5)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)'; }

    return (
        <div
            ref={internalRef}
            className={`absolute group touch-none select-none pointer-events-auto ease-out ${_isResizing ? 'will-change-[width,height] transition-none' : 'transition-[width,height,box-shadow,transform] duration-300 cubic-bezier(0.16, 1, 0.3, 1)'}`}
            style={containerStyle}
            onMouseDown={handleInteractionStart}
            onDoubleClick={(e) => {
                if (lod === 'detail') {
                    if (type === 'text' || type === 'note') {
                        e.stopPropagation();
                        setIsEditing(true);
                    } else if ((type === 'image') && !displaySrc) {
                        e.stopPropagation();
                        handleUploadClick();
                    }
                }
            }}
            onContextMenu={(e) => onContextMenu(e, id)}
            data-node-id={id}
        >
            {lod === 'detail' && (
                <>
                    {selected && !_isResizing && selectionCount === 1 && !isMedia && (
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-[100] cursor-default w-max pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <ElementToolbar element={element} onAction={handleToolbarCallback} isProcessing={isGenerating} />
                        </div>
                    )}
                    {renderDetailLOD()}
                    {selected && !isEditing && <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-blue-500 z-50"></div>}
                    <div onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, id, 'in'); }} className={`absolute left-0 top-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-crosshair transition-all z-50 shadow-sm hover:scale-150 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    <div onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, id, 'out'); }} className={`absolute right-0 top-1/2 translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-crosshair transition-all z-50 shadow-sm hover:scale-150 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    
                    {selected && selectionCount === 1 && (type === 'image' || type === 'video') && (
                        <div 
                            className={`absolute left-1/2 -translate-x-1/2 z-[1000] cursor-default pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ${placement === 'top' ? 'bottom-[100%] mb-4' : 'top-[100%] mt-4'}`} 
                            onMouseDown={e => e.stopPropagation()} 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-[480px]">
                                <CreationChatInput 
                                    variant="compact"
                                    value={data?.prompt || ''}
                                    onChange={(val: string) => updateElement(id, { data: { ...data, prompt: val } }, false)}
                                    onGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                    placeholder={type === 'video' ? "Describe the video scene..." : "Describe the image..."}
                                    footerControls={renderFooterControls()}
                                    width={480} 
                                    minHeight={60}
                                    onUpload={handleAttachmentUpload}
                                    attachments={attachments}
                                    onRemoveAttachment={handleRemoveAttachment}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
            {lod === 'simplified' && renderBlockLOD()} 
            {lod === 'block' && renderBlockLOD()}
        </div>
    );
}));

CanvasNode.displayName = 'CanvasNode';
