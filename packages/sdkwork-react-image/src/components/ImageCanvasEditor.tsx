
import React, { useRef, useEffect, useState } from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
    Eraser, Brush, Maximize, Wand2, Scissors,
    Undo, Redo, Save, ZoomIn, ZoomOut, Move,
    Trash2
} from 'lucide-react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Button, useAssetUrl } from '@sdkwork/react-commons';

interface ImageCanvasEditorProps {
    imageUrl: string;
    onSave: (newUrl: string) => void;
    onAIEdit: (mode: 'inpaint' | 'outpaint' | 'remove' | 'upscale', mask: string | null) => Promise<string | null>;
}

export const ImageCanvasEditor: React.FC<ImageCanvasEditorProps> = ({ imageUrl, onSave, onAIEdit }) => {
    // --- Hook Resolution ---
    const { url: resolvedImageUrl } = useAssetUrl(imageUrl);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    // Transform State
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [mode, setMode] = useState<'paint' | 'erase' | 'move'>('paint');
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    
    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    
    // History State
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Image Data
    const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
    const [imageDimensions, setImageDimensions] = useState({ w: 0, h: 0 });

    // --- Initialization ---

    useEffect(() => {
        if (!resolvedImageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = resolvedImageUrl;
        img.onload = () => {
            setImgObj(img);
            setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
            // Initial fit happens via useEffect dependency on imageDimensions below
        };
    }, [resolvedImageUrl]);

    // Fit image to container on load
    useEffect(() => {
        if (imageDimensions.w > 0 && containerRef.current) {
            fitImageToContainer();
            // Initialize canvas size
            if (canvasRef.current) {
                canvasRef.current.width = imageDimensions.w;
                canvasRef.current.height = imageDimensions.h;
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    saveToHistory(); // Initial blank state
                }
            }
        }
    }, [imageDimensions]);

    const fitImageToContainer = () => {
        if (!containerRef.current || imageDimensions.w === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const padding = 40;
        const availableW = rect.width - padding;
        const availableH = rect.height - padding;
        
        const scaleW = availableW / imageDimensions.w;
        const scaleH = availableH / imageDimensions.h;
        const newScale = Math.min(scaleW, scaleH, 1); // Max 100% initially
        
        setScale(newScale);
        setPan({
            x: (rect.width - imageDimensions.w * newScale) / 2,
            y: (rect.height - imageDimensions.h * newScale) / 2
        });
    };

    // --- Shortcuts ---

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            switch (e.code) {
                case 'Space':
                    if (!e.repeat) setIsSpacePressed(true);
                    e.preventDefault();
                    break;
                case 'BracketLeft':
                    setBrushSize(s => Math.max(1, s - 5));
                    break;
                case 'BracketRight':
                    setBrushSize(s => Math.min(200, s + 5));
                    break;
                case 'KeyZ':
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        if (e.shiftKey) performRedo();
                        else performUndo();
                    }
                    break;
                case 'KeyB': setMode('paint'); break;
                case 'KeyE': setMode('erase'); break;
                case 'KeyV': setMode('move'); break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') setIsSpacePressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [historyIndex, history]); // Re-bind for history access

    // --- History Management ---

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(data);
        
        if (newHistory.length > 30) newHistory.shift();
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const performUndo = () => {
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        restoreHistory(newIndex);
    };

    const performRedo = () => {
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        restoreHistory(newIndex);
    };

    const restoreHistory = (index: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && history[index]) {
            ctx.putImageData(history[index], 0, 0);
        }
    };

    const clearMask = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveToHistory();
        }
    };

    // --- Interaction Logic ---

    const getCanvasPoint = (e: React.MouseEvent | MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const contentX = (e.clientX - rect.left - pan.x) / scale;
        const contentY = (e.clientY - rect.top - pan.y) / scale;
        return { x: contentX, y: contentY };
    };

    const isPanMode = mode === 'move' || isSpacePressed;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isPanMode || e.button === 1 || e.altKey) {
            setIsPanning(true);
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            return;
        }

        if (e.button === 0) {
            setIsDrawing(true);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                const { x, y } = getCanvasPoint(e);
                ctx.beginPath();
                ctx.moveTo(x, y);
                
                ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
                ctx.strokeStyle = 'rgba(255, 60, 60, 0.7)'; // Mask Color
                ctx.lineWidth = brushSize; 
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.lineTo(x, y); // Draw dot
                ctx.stroke();
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.current.x,
                y: e.clientY - panStart.current.y
            });
            return;
        }

        if (isDrawing) {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                const { x, y } = getCanvasPoint(e);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
        } else if (isDrawing) {
            setIsDrawing(false);
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.closePath();
            saveToHistory();
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, scale + delta), 10);
            
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const contentX = (mouseX - pan.x) / scale;
                const contentY = (mouseY - pan.y) / scale;
                
                const newPanX = mouseX - (contentX * newScale);
                const newPanY = mouseY - (contentY * newScale);
                
                setScale(newScale);
                setPan({ x: newPanX, y: newPanY });
            }
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    // --- AI Integration ---

    const generateMaskDataURL = (): string | null => {
        if (!canvasRef.current || !imageDimensions.w) return null;
        
        const w = imageDimensions.w;
        const h = imageDimensions.h;
        
        const offCanvas = document.createElement('canvas');
        offCanvas.width = w;
        offCanvas.height = h;
        const offCtx = offCanvas.getContext('2d');
        
        if (!offCtx) return null;
        
        // 1. Black Background
        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, w, h);
        
        // 2. Draw mask from main canvas
        offCtx.drawImage(canvasRef.current, 0, 0);
        
        // 3. Convert to White mask
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = '#FFFFFF';
        offCtx.fillRect(0, 0, w, h);
        
        return offCanvas.toDataURL('image/png');
    };

    const handleAction = async (action: 'inpaint' | 'outpaint' | 'remove' | 'upscale') => {
        if (!imgObj) return;
        
        let maskUrl: string | null = null;
        if (action === 'inpaint' || action === 'remove') {
             maskUrl = generateMaskDataURL();
        }
        
        setIsProcessing(true);
        try {
            const resultUrl = await onAIEdit(action, maskUrl);
            if (resultUrl) {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = resultUrl;
                await new Promise((resolve) => { img.onload = resolve; });
                
                setImgObj(img);
                setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                
                // Clear mask
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
                
                setHistory([]);
                setHistoryIndex(-1);
                saveToHistory();
            }
        } catch (e) {
            console.error(e);
            alert("AI processing failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#111] overflow-hidden select-none">
            {/* Toolbar */}
            <div className="h-14 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 z-20 shrink-0">
                
                {/* Left Tools */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-[#252526] rounded-lg p-0.5 border border-[#333]">
                        <ToolBtn active={mode === 'move'} onClick={() => setMode('move')} icon={<Move size={16} />} title="Pan (Space/V)" />
                        <ToolBtn active={mode === 'paint'} onClick={() => setMode('paint')} icon={<Brush size={16} />} title="Brush (B)" />
                        <ToolBtn active={mode === 'erase'} onClick={() => setMode('erase')} icon={<Eraser size={16} />} title="Eraser (E)" />
                    </div>
                    
                    <div className="w-px h-6 bg-[#333] mx-2" />
                    
                    {/* Brush Size */}
                    <div className="flex items-center gap-3 bg-[#252526] px-3 py-1.5 rounded-lg border border-[#333]">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <input 
                            type="range" min="1" max="200" value={brushSize} 
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-24 h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
                            title={`Brush Size: ${brushSize}px ([ / ])`}
                        />
                        <div className="w-5 h-5 rounded-full bg-gray-400" />
                    </div>

                    <div className="w-px h-6 bg-[#333] mx-2" />
                    
                    {/* History */}
                    <div className="flex gap-1">
                        <button onClick={performUndo} disabled={historyIndex <= 0} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors rounded hover:bg-[#333]" title="Undo (Ctrl+Z)"><Undo size={16}/></button>
                        <button onClick={performRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors rounded hover:bg-[#333]" title="Redo (Ctrl+Shift+Z)"><Redo size={16}/></button>
                        <button onClick={clearMask} className="p-2 text-gray-400 hover:text-red-400 transition-colors ml-1 rounded hover:bg-[#333]" title="Clear Mask"><Trash2 size={16}/></button>
                    </div>
                </div>

                {/* AI Actions */}
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAction('inpaint')} disabled={isProcessing} className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border-purple-500/30">
                        <Wand2 size={14} className="mr-1.5" /> Inpaint
                    </Button>
                    <Button size="sm" onClick={() => handleAction('remove')} disabled={isProcessing} className="bg-red-600/20 text-red-300 hover:bg-red-600/30 border-red-500/30">
                        <Scissors size={14} className="mr-1.5" /> Remove
                    </Button>
                    <Button size="sm" onClick={() => handleAction('upscale')} disabled={isProcessing} className="bg-green-600/20 text-green-300 hover:bg-green-600/30 border-green-500/30">
                        <Maximize size={14} className="mr-1.5" /> Upscale
                    </Button>
                    
                    <div className="w-px h-6 bg-[#333] mx-2" />
                    
                    <Button onClick={() => onSave(imgObj?.src || '')} disabled={!imgObj || isProcessing} className="bg-blue-600 hover:bg-blue-500 border-0">
                        <Save size={16} className="mr-2" /> Save
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div 
                ref={containerRef}
                className={`flex-1 relative overflow-hidden bg-[#0a0a0a]`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isPanMode ? (isDrawing ? 'grabbing' : 'grab') : 'none' }}
            >
                {/* Checkerboard Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ 
                         backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)`,
                         backgroundSize: '20px 20px',
                         backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                     }} 
                />

                <div 
                    className="absolute top-0 left-0 origin-top-left shadow-2xl"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        width: imageDimensions.w,
                        height: imageDimensions.h,
                        willChange: 'transform'
                    }}
                >
                    {/* Source Image */}
                    {imgObj && <img 
                        src={imgObj.src} 
                        draggable={false}
                        className="w-full h-full pointer-events-none select-none"
                    />}
                    
                    {/* Mask Canvas */}
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 z-10"
                    />
                </div>
                
                {/* Custom Cursor */}
                {!isPanMode && (
                    <BrushCursor
                        size={brushSize}
                        scale={scale}
                        containerRef={containerRef as React.RefObject<HTMLElement>}
                        isEraser={mode === 'erase'}
                    />
                )}

                {/* Loading Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm cursor-wait">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <span className="text-blue-400 font-bold animate-pulse tracking-widest">PROCESSING</span>
                    </div>
                )}
            </div>
            
            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex gap-2 z-40 bg-[#1e1e1e] p-1 rounded-lg border border-[#333] shadow-xl">
                 <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"><ZoomOut size={16} /></button>
                 <div className="px-2 py-2 text-xs font-mono text-gray-300 min-w-[50px] text-center border-x border-[#333] select-none">{Math.round(scale * 100)}%</div>
                 <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"><ZoomIn size={16} /></button>
                 <button onClick={fitImageToContainer} className="p-2 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors" title="Fit Screen"><Maximize size={16} /></button>
            </div>
        </div>
    );
};

// --- Helper Components ---

const ToolBtn = ({ active, onClick, icon, title }: any) => (
    <button 
        onClick={onClick}
        className={`p-2 rounded-md transition-all ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-[#333] hover:text-white'}`}
        title={title}
    >
        {icon}
    </button>
);

const BrushCursor = ({ size, scale, containerRef, isEraser }: { size: number, scale: number, containerRef: React.RefObject<HTMLElement>, isEraser: boolean }) => {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const displaySize = size * scale;

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
             if (containerRef.current) {
                 const rect = containerRef.current.getBoundingClientRect();
                 if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                     setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                 } else {
                     setPos({ x: -100, y: -100 });
                 }
             }
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <div 
            className={`absolute pointer-events-none rounded-full z-50 transition-transform duration-75`}
            style={{
                width: displaySize,
                height: displaySize,
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                backgroundColor: isEraser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 60, 60, 0.2)',
                boxShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}
        />
    );
};
