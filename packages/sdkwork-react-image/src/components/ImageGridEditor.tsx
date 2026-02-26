
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Grid3x3, Upload, RefreshCw, Check, 
    Image as ImageIcon,
    Columns, Rows, Loader2, Save, Trash2,
    Minus, Plus, ImagePlus, ArrowUpCircle
} from 'lucide-react';
import { platform, uploadHelper } from '@sdkwork/react-core';
;
import { SettingToggle } from '@sdkwork/react-settings';
import { assetService } from '@sdkwork/react-assets';
import { Button, useAssetUrl } from '@sdkwork/react-commons';

// --- Canvas Processing Utility ---
class GridProcessor {
    static async split(
        img: HTMLImageElement, 
        rows: number, 
        cols: number
    ): Promise<(string | null)[]> {
        const cellW = Math.ceil(img.naturalWidth / cols);
        const cellH = Math.ceil(img.naturalHeight / rows);
        const urls: string[] = [];

        const canvas = document.createElement('canvas');
        canvas.width = cellW;
        canvas.height = cellH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) throw new Error("Canvas context initialization failed");

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                ctx.clearRect(0, 0, cellW, cellH);
                ctx.drawImage(
                    img, 
                    x * cellW, y * cellH, cellW, cellH, 
                    0, 0, cellW, cellH 
                );
                urls.push(canvas.toDataURL('image/png', 1.0));
            }
        }
        return urls;
    }

    static async merge(
        cells: (string | null)[], 
        rows: number, 
        cols: number, 
        totalW: number, 
        totalH: number
    ): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = totalW;
        canvas.height = totalH;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error("Canvas context initialization failed");

        const cellW = Math.ceil(totalW / cols);
        const cellH = Math.ceil(totalH / rows);

        // Load all images in parallel (handle nulls)
        const loadedImages = await Promise.all(cells.map(src => {
            if (!src) return Promise.resolve(null);
            return new Promise<HTMLImageElement | null>((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null); // Fail safe
                img.src = src;
            });
        }));

        loadedImages.forEach((img, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = col * cellW;
            const y = row * cellH;

            if (img) {
                // Draw Image
                ctx.drawImage(img, x, y, cellW, cellH);
            } else {
                // Fill Black
                ctx.fillStyle = '#000000';
                ctx.fillRect(x, y, cellW, cellH);
            }
        });

        return canvas.toDataURL('image/png', 1.0);
    }
}

// --- UI Components ---
const NumberStepper: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    min?: number; 
    max?: number; 
}> = ({ value, onChange, min = 1, max = 20 }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            onChange(Math.min(Math.max(val, min), max));
        }
    };

    return (
        <div className="flex items-center h-8 bg-[#18181b] border border-[#333] rounded-lg overflow-hidden w-full transition-colors hover:border-[#444]">
            <button 
                onClick={() => onChange(Math.max(value - 1, min))}
                className="w-9 h-full flex items-center justify-center hover:bg-[#252526] text-gray-400 hover:text-white transition-colors border-r border-[#333] active:bg-[#333]"
            >
                <Minus size={12} />
            </button>
            <input 
                type="text" 
                className="flex-1 w-full h-full bg-transparent text-center text-xs font-mono text-white outline-none"
                value={value}
                onChange={handleChange}
            />
            <button 
                onClick={() => onChange(Math.min(value + 1, max))}
                className="w-9 h-full flex items-center justify-center hover:bg-[#252526] text-gray-400 hover:text-white transition-colors border-l border-[#333] active:bg-[#333]"
            >
                <Plus size={12} />
            </button>
        </div>
    );
};

interface ImageGridEditorProps {
    imageUrl: string;
    onSave: (newUrl: string) => void;
    onUpscale?: (imgUrl: string) => void;
    rows?: number;
    cols?: number;
}

export const ImageGridEditor: React.FC<ImageGridEditorProps> = ({ 
    imageUrl: initialImageUrl, 
    onSave, 
    onUpscale,
    rows: initialRows = 3, 
    cols: initialCols = 3 
}) => {
    // --- State ---
    const { url: resolvedImageUrl } = useAssetUrl(initialImageUrl);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const [rows, setRows] = useState(initialRows);
    const [cols, setCols] = useState(initialCols);
    const [gridCells, setGridCells] = useState<(string | null)[]>([]);
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [autoSaveTiles, setAutoSaveTiles] = useState(false);
    
    // UI State
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync resolved URL to local state once available, if not already overridden by user upload
    useEffect(() => {
        if (resolvedImageUrl && !previewUrl) {
            setPreviewUrl(resolvedImageUrl);
        }
    }, [resolvedImageUrl]);

    // --- Initialization ---
    useEffect(() => {
        const loadOriginal = async () => {
            if (!previewUrl) return;
            setIsProcessing(true);
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = previewUrl;
            await new Promise((resolve) => { img.onload = resolve; });
            setOriginalImage(img);
            setIsProcessing(false);
            
            // Reset grid on new image
            setGridCells([]);
        };
        loadOriginal();
    }, [previewUrl]);

    // --- Actions ---
    
    const handleReplaceSource = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, 'image/*');
            if (files.length > 0) {
                const file = files[0];
                const blob = new Blob([new Uint8Array(file.data)], { type: 'image/png' }); 
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
            }
        } catch (e) {
            console.error("Failed to replace source", e);
        }
    };

    const handleSplit = async () => {
        if (!originalImage) return;
        setIsProcessing(true);
        try {
            // Small timeout to allow UI to render spinner
            await new Promise(r => setTimeout(r, 50));
            
            // 1. Perform Split
            const cells = await GridProcessor.split(originalImage, rows, cols);
            setGridCells(cells);

            // 2. Auto-Save to Assets if enabled
            if (autoSaveTiles) {
                const savePromises = cells.map(async (dataUrl, idx) => {
                    if (!dataUrl) return;
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const buffer = await blob.arrayBuffer();
                    const fileName = `tile_${Date.now()}_${idx + 1}.png`;
                    
                    // Save to 'image' category in Assets
                    await assetService.importAsset(new Uint8Array(buffer), fileName, 'image');
                });
                
                await Promise.all(savePromises);
                await platform.notify('Tiles Saved', `${cells.length} images saved to Assets library.`);
            }

        } catch (e) {
            console.error("Split failed", e);
        } finally {
            setIsProcessing(false);
        }
    };

    // Auto-split on first load (without saving) if grid is empty
    useEffect(() => {
        if (originalImage && gridCells.length === 0) {
            const initialSplit = async () => {
                const cells = await GridProcessor.split(originalImage, rows, cols);
                setGridCells(cells);
            };
            initialSplit();
        }
    }, [originalImage]);

    const handleReplaceCell = async (index: number) => {
        try {
            const files = await uploadHelper.pickFiles(false, 'image/*');
            if (files.length > 0) {
                const file = files[0];
                const blob = new Blob([new Uint8Array(file.data)], { type: 'image/png' }); 
                const url = URL.createObjectURL(blob);
                
                setGridCells(prev => {
                    const next = [...prev];
                    next[index] = url;
                    return next;
                });
            }
        } catch (e) {
            console.error("Failed to replace cell", e);
        }
    };

    const handleRemoveCell = (index: number) => {
        setGridCells(prev => {
            const next = [...prev];
            next[index] = null; // Mark as empty (black)
            return next;
        });
    };

    const handleMerge = async () => {
        if (!originalImage || gridCells.length === 0) return;
        setIsProcessing(true);
        try {
            await new Promise(r => setTimeout(r, 50));
            const resultUrl = await GridProcessor.merge(
                gridCells, 
                rows, 
                cols, 
                originalImage.naturalWidth, 
                originalImage.naturalHeight
            );
            onSave(resultUrl);
        } catch (e) {
            console.error("Merge failed", e);
            alert("Failed to merge grid");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Calculations for Aspect Ratio ---
    const aspectRatioStyle = useMemo(() => {
        if (!originalImage) return { aspectRatio: '1/1' };
        return { aspectRatio: `${originalImage.naturalWidth}/${originalImage.naturalHeight}` };
    }, [originalImage]);

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 overflow-hidden font-sans">
            
            {/* LEFT SIDEBAR: Config & Source */}
            <div className="w-[360px] flex-none border-r border-[#27272a] bg-[#101012] flex flex-col h-full z-10 shadow-2xl">
                
                {/* Header */}
                <div className="flex-none p-5 border-b border-[#27272a]">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <Grid3x3 size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white tracking-tight">Grid Editor</h2>
                            <p className="text-[10px] text-gray-500">Split, edit & merge</p>
                        </div>
                    </div>
                </div>

                {/* Content - Flex Column to avoid scrollbar when possible */}
                <div className="flex-1 flex flex-col min-h-0 p-5 gap-6">
                    
                    {/* Source Preview (Flex-1 to take available space) */}
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon size={12} /> Source Image
                            </label>
                            {originalImage && (
                                <span className="text-[10px] text-gray-600 font-mono bg-[#18181b] px-1.5 rounded">
                                    {originalImage.naturalWidth}x{originalImage.naturalHeight}
                                </span>
                            )}
                        </div>
                        
                        <div 
                            className="flex-1 relative bg-[#18181b] border border-[#333] hover:border-blue-500/50 rounded-xl overflow-hidden shadow-inner group min-h-[200px] cursor-pointer transition-colors"
                            onClick={handleReplaceSource}
                            title="Click to replace image"
                        >
                            {originalImage ? (
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={previewUrl || ''} 
                                            className="w-full h-full object-contain opacity-80 group-hover:opacity-40 transition-opacity" 
                                            alt="Source" 
                                        />
                                        
                                        {/* Grid Overlay on top of image */}
                                        <div className="absolute inset-0 pointer-events-none group-hover:opacity-20 transition-opacity">
                                            <div className="w-full h-full flex flex-col">
                                                {Array.from({ length: rows }).map((_, r) => (
                                                    <div key={r} className="flex-1 flex border-b border-blue-500/30 last:border-b-0">
                                                        {Array.from({ length: cols }).map((_, c) => (
                                                            <div key={c} className="flex-1 border-r border-blue-500/30 last:border-r-0" />
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hover Upload Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex flex-col items-center gap-2 text-blue-400">
                                                <ImagePlus size={32} />
                                                <span className="text-xs font-medium">Replace Image</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
                                    {isProcessing ? (
                                        <Loader2 size={24} className="animate-spin text-blue-500" />
                                    ) : (
                                        <>
                                            <Upload size={24} />
                                            <span className="text-xs">Upload Source</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls (Flex-none fixed at bottom of content) */}
                    <div className="flex-none space-y-5 bg-[#141416] p-4 rounded-xl border border-[#27272a]">
                        <div className="space-y-4">
                             <div className="space-y-2">
                                 <div className="flex justify-between items-center text-xs text-gray-400">
                                     <span className="flex items-center gap-1.5"><Rows size={14} className="text-gray-500" /> Rows</span>
                                 </div>
                                 <NumberStepper value={rows} onChange={setRows} min={1} max={20} />
                             </div>

                             <div className="space-y-2">
                                 <div className="flex justify-between items-center text-xs text-gray-400">
                                     <span className="flex items-center gap-1.5"><Columns size={14} className="text-gray-500" /> Columns</span>
                                 </div>
                                 <NumberStepper value={cols} onChange={setCols} min={1} max={20} />
                             </div>
                        </div>

                        <div className="pt-2 border-t border-[#333]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5">
                                    <Save size={12} /> Save tiles to Assets
                                </span>
                                <SettingToggle 
                                    checked={autoSaveTiles}
                                    onChange={setAutoSaveTiles}
                                    label=""
                                />
                            </div>
                            
                            <Button 
                                onClick={handleSplit}
                                disabled={isProcessing || !originalImage}
                                className="w-full h-9 bg-[#252526] hover:bg-[#2f2f32] text-white border border-[#333] hover:border-blue-500/50 shadow-sm transition-all text-xs"
                            >
                                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                <span className="ml-2">Apply & Resplit</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT WORKSPACE: Interactive Grid */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#050505] relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                />

                {/* Main Content Centered */}
                <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center p-8 md:p-12 relative z-0">
                    
                    {gridCells.length > 0 ? (
                        <div 
                            className="grid bg-[#1a1a1c] p-1 shadow-2xl ring-1 ring-white/10"
                            style={{
                                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                width: '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                ...aspectRatioStyle 
                            }}
                        >
                            {gridCells.map((src, idx) => (
                                <div 
                                    key={idx} 
                                    className={`
                                        relative group w-full h-full overflow-hidden border-[0.5px] border-[#333] hover:border-blue-500/50 cursor-pointer transition-all
                                        ${src ? 'bg-black/50' : 'bg-[#000000]'}
                                    `}
                                    onClick={() => handleReplaceCell(idx)}
                                    onMouseEnter={() => setHoveredCell(idx)}
                                    onMouseLeave={() => setHoveredCell(null)}
                                >
                                    {src ? (
                                        <img 
                                            src={src} 
                                            className={`w-full h-full object-cover transition-transform duration-300 ${hoveredCell === idx ? 'scale-105' : 'scale-100'}`} 
                                            alt={`Grid Cell ${idx}`} 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full border border-[#444] flex items-center justify-center text-gray-500">
                                                <Plus size={14} />
                                            </div>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Empty</span>
                                        </div>
                                    )}
                                    
                                    {/* Hover Overlay */}
                                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-200 ${hoveredCell === idx ? 'opacity-100' : 'opacity-0'}`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReplaceCell(idx); }}
                                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl transition-transform hover:scale-110"
                                            title="Replace / Upload"
                                        >
                                            <Upload size={14} />
                                        </button>
                                        
                                        {src && (
                                            <>
                                                {onUpscale && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onUpscale(src); }}
                                                        className="w-8 h-8 rounded-full bg-blue-500/20 hover:bg-blue-500/40 backdrop-blur-md flex items-center justify-center text-blue-400 border border-blue-500/30 shadow-xl transition-transform hover:scale-110"
                                                        title="Upscale (HD)"
                                                    >
                                                        <ArrowUpCircle size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveCell(idx); }}
                                                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md flex items-center justify-center text-red-400 border border-red-500/30 shadow-xl transition-transform hover:scale-110"
                                                    title="Delete (Fill Black)"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Index Badge */}
                                    <div className="absolute top-1 left-1 bg-black/50 backdrop-blur text-[8px] font-mono text-white/50 px-1 rounded pointer-events-none">
                                        {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 select-none flex flex-col items-center gap-4">
                            <div className="w-24 h-24 bg-[#1e1e20] rounded-3xl flex items-center justify-center border border-[#333] shadow-inner">
                                <Grid3x3 size={48} className="opacity-20" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-400">Ready to Split</p>
                                <p className="text-sm opacity-50 mt-1">Configure rows and columns on the left.</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Bottom Action Bar */}
                <div className="flex-none h-16 bg-[#101012] border-t border-[#27272a] flex items-center justify-between px-8 z-10">
                     <div className="flex items-center gap-6 text-xs text-gray-500">
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${gridCells.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                            <span>{gridCells.length > 0 ? `${rows * cols} Tiles Generated` : 'Waiting for split'}</span>
                         </div>
                         {autoSaveTiles && (
                             <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                 <Save size={10} /> Auto-save enabled
                             </span>
                         )}
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 hidden md:block">
                            Click individual tiles to replace or delete
                        </div>
                        <Button 
                            onClick={handleMerge} 
                            disabled={isProcessing || gridCells.length === 0}
                            className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/20 border-0 text-sm"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" /> Processing...
                                </>
                            ) : (
                                <>
                                    <Check size={16} className="mr-2" /> Merge & Save Final
                                </>
                            )}
                        </Button>
                     </div>
                </div>
            </div>
        </div>
    );
};
