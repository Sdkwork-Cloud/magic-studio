
import { CanvasBoard, CanvasExportMode } from '../entities'
import { canvasBusinessService } from '../services'
import React, { useState } from 'react';
import { 
    Minus, Plus, FileJson, Clapperboard, MoreHorizontal,
    Loader2, FileUp 
} from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore'; 
import { useRouter, ROUTES, platform, uploadHelper } from '@sdkwork/react-core'; 
import { CanvasExportModal } from './CanvasExportModal';

export const CanvasZoomControls: React.FC = () => {
    const { viewport, setViewport, activeBoard, elements, importBoard } = useCanvasStore();
    const { navigate } = useRouter();
    
    const [isExporting, setIsExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showMagicCutModal, setShowMagicCutModal] = useState(false);

    const handleZoomIn = () => setViewport({ zoom: Math.min(5, viewport.zoom + 0.1) });
    const handleZoomOut = () => setViewport({ zoom: Math.max(0.1, viewport.zoom - 0.1) });
    const handleResetZoom = () => setViewport({ zoom: 1 });

    const getExportBoard = (): CanvasBoard => {
        if (activeBoard) {
            // Merge current elements into the active board definition for export
            return { ...activeBoard, elements };
        }
        // Fallback for scratchpad mode (no saved board yet)
        return {
            id: 'scratchpad-' + Date.now(),
            uuid: 'scratchpad-' + Date.now(),
            type: 'CANVAS_BOARD',
            title: 'Untitled Canvas',
            elements: elements,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    };

    const handleImportJson = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, '.json');
            if (files.length > 0) {
                const content = new TextDecoder().decode(files[0].data);
                const board = await canvasBusinessService.canvasExportService.importFromJson(content);
                importBoard(board);
                await platform.notify("Import Successful", `Board "${board.title}" imported.`);
            }
        } catch (e: any) {
            console.error("Import failed", e);
            await platform.notify("Import Failed", e.message);
        }
        setShowMenu(false);
    };

    const handleExportJson = async () => {
        const board = getExportBoard();
        if (board.elements.length === 0) {
             await platform.notify("Export Failed", "Canvas is empty.");
             return;
        }

        const blob = canvasBusinessService.canvasExportService.exportToJson(board);
        const filename = `${board.title.replace(/\s+/g, '_')}_canvas.json`;
        
        if (platform.getPlatform() === 'desktop') {
             const text = await blob.text();
             await platform.saveFile(text, filename);
        } else {
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = filename;
             a.click();
             URL.revokeObjectURL(url);
        }
        setShowMenu(false);
    };

    const handleMagicCutClick = () => {
        const board = getExportBoard();
        if (board.elements.length === 0) {
             platform.notify("Export Failed", "Canvas is empty. Add some media elements first.");
             return;
        }
        setShowMagicCutModal(true);
        setShowMenu(false);
    };

    const handleExportMagicCutConfirm = async (mode: CanvasExportMode) => {
        const board = getExportBoard();
        setIsExporting(true);
        
        try {
            // Pass board title explicitly and the selected mode
            const projectId = await canvasBusinessService.canvasExportService.exportToMagicCut(board, board.title, mode);
            
            await platform.notify("Export Successful", "Project created in Magic Cut");
            
            // Navigate to Magic Cut with project ID AND source query param
            navigate(ROUTES.MAGIC_CUT, `projectId=${projectId}&from=canvas`);
        } catch (e: any) {
            console.error("Export failed", e);
            await platform.notify("Export Failed", e.message || "Unknown error");
        } finally {
            // Critical: Ensure this runs even on error to unblock UI
            setIsExporting(false);
        }
    };
    
    const hasContent = elements.length > 0;

    return (
        <>
            <div className="absolute bottom-6 right-6 flex gap-3 pointer-events-auto items-end z-[2000]">
                
                {/* Actions Menu */}
                <div className="relative">
                    {showMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-52 bg-[#18181b] border border-[#333] rounded-xl shadow-2xl p-1 animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden">
                            <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#27272a] mb-1">
                                Actions
                            </div>
                            
                            <button 
                                onClick={handleImportJson}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-200 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors group"
                            >
                                <FileUp size={14} className="text-green-400" />
                                <span>Import Board (JSON)</span>
                            </button>
                            
                            <div className="h-px bg-[#27272a] my-1" />

                            <button 
                                onClick={handleMagicCutClick}
                                disabled={isExporting || !hasContent}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-colors group ${!hasContent ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-200 hover:text-white hover:bg-blue-600'}`}
                            >
                                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} className="text-pink-400 group-hover:text-white" />}
                                <span>{isExporting ? 'Exporting...' : 'Export to Magic Cut'}</span>
                            </button>
                            <button 
                                onClick={handleExportJson}
                                disabled={!hasContent}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-colors group ${!hasContent ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-200 hover:text-white hover:bg-[#27272a]'}`}
                            >
                                <FileJson size={14} className="text-yellow-400" />
                                <span>Export JSON</span>
                            </button>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className={`
                            h-9 px-3 bg-[#18181b]/90 backdrop-blur-md border border-[#333] rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-all
                            ${showMenu ? 'border-blue-500/50 text-white' : 'hover:border-gray-500'}
                        `}
                    >
                        <MoreHorizontal size={14} />
                        <span>Menu</span>
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="bg-[#18181b]/90 backdrop-blur-md border border-[#333] rounded-lg p-1 flex items-center shadow-xl h-9">
                    <button 
                        onClick={handleZoomOut} 
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#333] rounded-md text-gray-400 hover:text-white transition-colors"
                    >
                        <Minus size={14} />
                    </button>
                    
                    <button 
                        onClick={handleResetZoom}
                        className="w-12 text-center text-xs font-mono text-gray-300 hover:text-white transition-colors"
                        title="Reset Zoom"
                    >
                        {Math.round(viewport.zoom * 100)}%
                    </button>
                    
                    <button 
                        onClick={handleZoomIn} 
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#333] rounded-md text-gray-400 hover:text-white transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            <CanvasExportModal 
                isOpen={showMagicCutModal}
                onClose={() => setShowMagicCutModal(false)}
                onConfirm={handleExportMagicCutConfirm}
            />
        </>
    );
};
