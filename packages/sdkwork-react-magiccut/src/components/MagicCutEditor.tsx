
import { CutProject, TemplateMetadata } from '../entities/magicCut.entity'
import React, { useState, useEffect, useRef } from 'react';
import { MagicCutStoreProvider, useMagicCutStore } from '../store/magicCutStore';
import { MagicCutEventProvider, useMagicCutBus, useMagicCutEvent } from '../providers/MagicCutEventProvider';
import { MagicCutSidebar } from './Sidebar/MagicCutSidebar';
import { MagicCutResourcePanel } from './Resources/MagicCutResourcePanel';
import { MagicCutPlayer } from './Player/MagicCutPlayer';
import { MagicCutTimeline } from './Timeline/MagicCutTimeline';
import { MagicCutPropertyPanel } from './Properties/MagicCutPropertyPanel';
import { MagicCutDragOverlay } from './MagicCutDragOverlay';
import { LayoutTemplate, Download } from 'lucide-react';
import { MagicCutEvents, SeekPayload, ZoomPayload, TimelineAddClipPayload } from '../events';
import { ExportModal } from './Export/ExportModal';
import { SaveTemplateModal } from './SaveTemplateModal';
import { platform } from 'sdkwork-react-core';
import { MagicCutErrorBoundary } from './ErrorBoundary/MagicCutErrorBoundary';

// Resizer Helper
const Resizer: React.FC<{ orientation: 'vertical' | 'horizontal'; onMouseDown?: (e: React.MouseEvent) => void }> = ({ orientation, onMouseDown }) => (
    <div
        className={`flex-none z-50 flex items-center justify-center transition-colors hover:bg-blue-600/50 delay-75
            ${orientation === 'vertical' ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'}
        `}
        onMouseDown={onMouseDown}
    >
        <div className={`bg-[#1a1a1a] ${orientation === 'vertical' ? 'w-[1px] h-full' : 'h-[1px] w-full'}`} />
    </div>
);

// --- Context-Aware Toolbar (Internal) ---
const EditorToolbar: React.FC<{ onExportRequest: () => void, onSaveTemplateRequest: () => void }> = ({ onExportRequest, onSaveTemplateRequest }) => {
    const { project, commitHistory, isProcessing } = useMagicCutStore();

    const handleExportClick = () => {
        commitHistory();
        onExportRequest();
    };

    return (
        <div className="h-10 bg-[#050505]/50 border-b border-white/5 flex items-center justify-between px-4 z-20 select-none">
            {/* Left Status */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : (project.name ? 'bg-green-500' : 'bg-yellow-500')}`} />
                    <span className="text-[10px] text-gray-400 font-mono uppercase">{isProcessing ? 'Processing...' : 'Ready'}</span>
                </div>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onSaveTemplateRequest}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Save as Template"
                >
                    <LayoutTemplate size={14} />
                </button>

                <div className="w-px h-3 bg-white/10" />

                <button
                    onClick={handleExportClick}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Download size={12} />
                    <span>Export</span>
                </button>
            </div>
        </div>
    );
};

// --- Internal Layout Logic ---
const MagicCutEditorLayout: React.FC<{
    minimal?: boolean;
    onBack?: () => void;
    onExport?: (project: CutProject) => void;
}> = ({ minimal, onBack, onExport }) => {
    const [activeTab, setActiveTab] = useState('video');
    const {
        project, saveAsTemplate, play, pause, seek,
        undo, redo,
        splitClip, deleteSelected, trimStart, trimEnd, copyClip, pasteClip, addClip,
        toggleSnapping, toggleSkimming, addMarker,
        selectedClipId, selectedTrackId, totalDuration, store,
        useTransientState
    } = useMagicCutStore();
    const bus = useMagicCutBus();
    const containerRef = useRef<HTMLDivElement>(null);

    // UI State
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

    // Layout State
    // Reduced to 440px (~1/7 less than 512px)
    const [resourceWidth, setResourceWidth] = useState(440);
    // Increased to 320px for better property visibility
    const [propPanelWidth, setPropPanelWidth] = useState(320);
    const [timelineHeight, setTimelineHeight] = useState(380);
    const [isResizing, setIsResizing] = useState<string | null>(null);

    // Get reactive playing state from store (high frequency)
    const isPlaying = useTransientState(s => s.isPlaying);

    // --- EVENT BINDING ---
    // Connects the EventBus signals (from UI buttons) to Store Actions (Business Logic)

    // 1. Playback
    useMagicCutEvent(MagicCutEvents.PLAYBACK_TOGGLE, () => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, play, pause]);

    useMagicCutEvent<SeekPayload>(MagicCutEvents.PLAYBACK_SEEK, ({ time }) => {
        seek(time);
    }, [seek]);

    // 2. History
    useMagicCutEvent(MagicCutEvents.HISTORY_UNDO, () => undo(), [undo]);
    useMagicCutEvent(MagicCutEvents.HISTORY_REDO, () => redo(), [redo]);

    // 3. Clip Operations
    useMagicCutEvent(MagicCutEvents.CLIP_SPLIT, () => splitClip(), [splitClip]);
    useMagicCutEvent(MagicCutEvents.CLIP_DELETE, () => deleteSelected(), [deleteSelected]);
    useMagicCutEvent(MagicCutEvents.CLIP_TRIM_START, () => trimStart(), [trimStart]);
    useMagicCutEvent(MagicCutEvents.CLIP_TRIM_END, () => trimEnd(), [trimEnd]);

    useMagicCutEvent(MagicCutEvents.CLIP_COPY, () => {
        if (selectedClipId) copyClip(selectedClipId);
    }, [selectedClipId, copyClip]);

    useMagicCutEvent(MagicCutEvents.CLIP_PASTE, () => {
        // Access fresh time from store to avoid re-binding listener on every frame
        const currentTime = store.getState().currentTime;
        pasteClip(selectedTrackId, currentTime);
    }, [pasteClip, selectedTrackId, store]);

    useMagicCutEvent<TimelineAddClipPayload>(MagicCutEvents.TIMELINE_ADD_CLIP, ({ trackId, resource, start, duration }) => {
        addClip(trackId, resource, start, duration);
    }, [addClip]);

    // 4. Timeline Operations
    useMagicCutEvent(MagicCutEvents.TIMELINE_SNAP_TOGGLE, toggleSnapping, [toggleSnapping]);
    useMagicCutEvent(MagicCutEvents.TIMELINE_SKIMMING_TOGGLE, toggleSkimming, [toggleSkimming]);
    useMagicCutEvent(MagicCutEvents.TIMELINE_ADD_MARKER, addMarker, [addMarker]);

    // 5. View Operations
    useMagicCutEvent<ZoomPayload>(MagicCutEvents.VIEW_ZOOM, ({ level }) => {
        store.setState({ zoomLevel: level });
    }, [store]);

    useMagicCutEvent(MagicCutEvents.VIEW_FIT, () => {
        const state = store.getState();
        // Estimated usable width (container minus header)
        const width = state.containerWidth - 240;
        if (width > 0 && totalDuration > 0) {
            let newZoom = width / totalDuration;
            newZoom = Math.max(0.05, Math.min(80, newZoom));
            store.setState({ zoomLevel: newZoom, scrollLeft: 0 });
        }
    }, [store, totalDuration]);

    // ---------------------

    // Auto-focus the editor container on mount so keyboard shortcuts work immediately
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);

    // --- Scoped Keyboard Handling ---
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ignore if user is typing in an input field
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

        const isCtrlOrCmd = e.metaKey || e.ctrlKey;

        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            bus.emit(MagicCutEvents.CLIP_DELETE);
            return;
        }

        // Split (Ctrl+B)
        if (isCtrlOrCmd && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            bus.emit(MagicCutEvents.CLIP_SPLIT);
            return;
        }

        // Copy (Ctrl+C)
        if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            bus.emit(MagicCutEvents.CLIP_COPY);
            return;
        }

        // Paste (Ctrl+V)
        if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            bus.emit(MagicCutEvents.CLIP_PASTE);
            return;
        }

        // Trim Start/End (Q/W)
        if (e.key.toLowerCase() === 'q' && !isCtrlOrCmd) {
            bus.emit(MagicCutEvents.CLIP_TRIM_START);
            return;
        }
        if (e.key.toLowerCase() === 'w' && !isCtrlOrCmd) {
            bus.emit(MagicCutEvents.CLIP_TRIM_END);
            return;
        }

        // Undo/Redo
        if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                bus.emit(MagicCutEvents.HISTORY_REDO);
            } else {
                bus.emit(MagicCutEvents.HISTORY_UNDO);
            }
            return;
        }

        // Play/Pause (Space)
        if (e.code === 'Space') {
            e.preventDefault();
            bus.emit(MagicCutEvents.PLAYBACK_TOGGLE);
            return;
        }

        // Fit View (Shift+Z)
        if (e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            bus.emit(MagicCutEvents.VIEW_FIT);
            return;
        }

        // Add Marker (M)
        if (e.key.toLowerCase() === 'm' && !isCtrlOrCmd) {
            e.preventDefault();
            bus.emit(MagicCutEvents.TIMELINE_ADD_MARKER);
            return;
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            if (isResizing === 'resource') {
                const newWidth = e.clientX - 72; // Sidebar width
                if (newWidth > 200 && newWidth < 1000) setResourceWidth(newWidth);
            }
            if (isResizing === 'props') {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 240 && newWidth < 600) setPropPanelWidth(newWidth);
            }
            if (isResizing === 'timeline') {
                const newHeight = window.innerHeight - e.clientY;
                if (newHeight > 200 && newHeight < window.innerHeight - 200) setTimelineHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isResizing === 'timeline' ? 'row-resize' : 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const handleExportRequest = () => {
        setShowExportModal(true);
        if (onExport) { }
    };

    const handleSaveTemplateConfirm = async (metadata: TemplateMetadata) => {
        await saveAsTemplate(metadata);
        bus.emit(MagicCutEvents.TEMPLATE_SAVED);
        await platform.notify('Success', 'Template saved successfully!');
    };

    return (
        <div
            ref={containerRef}
            className="flex flex-col h-full w-full overflow-hidden bg-transparent text-gray-200 outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onDragOver={(e) => e.preventDefault()}
        >
            <MagicCutDragOverlay />

            {!minimal && (
                <EditorToolbar
                    onExportRequest={handleExportRequest}
                    onSaveTemplateRequest={() => setShowSaveTemplateModal(true)}
                />
            )}

            {/* TOP SECTION */}
            <div className="flex-1 flex min-h-0 relative">
                <div className="flex flex-none h-full border-r border-white/5 bg-[#050505]/50 backdrop-blur-sm">
                    <MagicCutSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
                    <div style={{ width: resourceWidth }} className="h-full flex flex-col border-l border-white/5">
                        <MagicCutResourcePanel activeTab={activeTab} />
                    </div>
                </div>

                <Resizer orientation="vertical" onMouseDown={() => setIsResizing('resource')} />

                <div className="flex-1 min-w-0 relative flex flex-col bg-black/20">
                    <MagicCutPlayer />
                </div>

                <Resizer orientation="vertical" onMouseDown={() => setIsResizing('props')} />

                <div style={{ width: propPanelWidth }} className="flex-none h-full border-l border-white/5 bg-[#050505]/50 backdrop-blur-sm">
                    <MagicCutPropertyPanel />
                </div>
            </div>

            <Resizer orientation="horizontal" onMouseDown={() => setIsResizing('timeline')} />

            <div style={{ height: timelineHeight }} className="flex-none border-t border-white/5 bg-[#050505] relative z-20">
                <MagicCutTimeline />
            </div>

            {/* Modals */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            <SaveTemplateModal
                isOpen={showSaveTemplateModal}
                onClose={() => setShowSaveTemplateModal(false)}
                onConfirm={handleSaveTemplateConfirm}
                initialName={project.name}
            />
        </div>
    );
};

// Export the Content Component for reuse in authenticated contexts
export const MagicCutEditorContent = MagicCutEditorLayout;

export interface MagicCutEditorProps {
    initialProject?: CutProject;
    onSave?: (project: CutProject) => void;
    onExport?: (project: CutProject) => void;
    onBack?: () => void;
    minimal?: boolean;
    className?: string;
}

export const MagicCutEditor: React.FC<MagicCutEditorProps> = ({
    initialProject,
    onSave,
    onExport,
    onBack,
    minimal = false,
    className = ""
}) => {
    return (
        <div className={`w-full h-full ${className}`}>
            <MagicCutStoreProvider initialProject={initialProject} onSave={onSave}>
                <MagicCutEventProvider>
                    <MagicCutErrorBoundary componentName="MagicCut Editor">
                        <MagicCutEditorLayout
                            minimal={minimal}
                            onBack={onBack}
                            onExport={onExport}
                        />
                    </MagicCutErrorBoundary>
                </MagicCutEventProvider>
            </MagicCutStoreProvider>
        </div>
    );
};
