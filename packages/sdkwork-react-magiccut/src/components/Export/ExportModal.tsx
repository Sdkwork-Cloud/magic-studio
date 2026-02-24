
import { videoExportService } from '../../services/export/videoExportService';
import { ExportConfig, ExportResolution, ExportFrameRate, ExportBitrate, ExportFormat, ExportOptions } from '../../services/export/types';
import { Button, logger } from 'sdkwork-react-commons';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, FolderOpen, Check, HelpCircle, 
    MonitorPlay, Music, FileVideo, ChevronDown, 
    Settings2, HardDrive, Clock, Loader2
} from 'lucide-react';
import { useMagicCutStore } from '../../store/magicCutStore';
;
;
import { platform } from 'sdkwork-react-core';
;
;

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Configuration Constants
const RESOLUTIONS: ExportResolution[] = ['480p', '720p', '1080p', '2k', '4k'];
const FRAME_RATES: ExportFrameRate[] = [24, 25, 30, 50, 60];
const BITRATES: { label: string, value: ExportBitrate }[] = [
    { label: 'Low (Smaller File)', value: 'lower' },
    { label: 'Recommended', value: 'recommended' },
    { label: 'High (Better Quality)', value: 'higher' }
];
const FORMATS: ExportFormat[] = ['mp4', 'mov', 'webm'];

// Helper to estimate file size (very rough approximation)
const estimateSize = (duration: number, resolution: ExportResolution, bitrate: ExportBitrate) => {
    let baseRate = 8; // Mbps for 1080p recommended
    if (resolution === '480p') baseRate = 2;
    if (resolution === '720p') baseRate = 5;
    if (resolution === '2k') baseRate = 15;
    if (resolution === '4k') baseRate = 45;
    
    if (bitrate === 'lower') baseRate *= 0.6;
    if (bitrate === 'higher') baseRate *= 1.5;

    const sizeMb = (baseRate * duration) / 8;
    return Math.round(sizeMb);
};

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const { project, state, activeTimeline, totalDuration, getResource } = useMagicCutStore();
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [domReady, setDomReady] = useState(false);
    
    // Cancellation
    const abortControllerRef = useRef<AbortController | null>(null);

    // Form State
    const [fileName, setFileName] = useState(project.name);
    const [exportPath, setExportPath] = useState<string>(''); 
    const [isDesktop, setIsDesktop] = useState(false);
    
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [resolution, setResolution] = useState<ExportResolution>('1080p');
    const [bitrate, setBitrate] = useState<ExportBitrate>('recommended');
    const [format, setFormat] = useState<ExportFormat>('mp4');
    const [fps, setFps] = useState<ExportFrameRate>(30);
    const [smartHdr, setSmartHdr] = useState(false);
    
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [audioFormat, setAudioFormat] = useState('mp3');

    useEffect(() => {
        setDomReady(true);
    }, []);

    // Load defaults
    useEffect(() => {
        const checkPlatform = async () => {
            const isNative = platform.getPlatform() === 'desktop';
            setIsDesktop(isNative);
            if (isNative) {
                const downloadDir = await platform.getPath('downloads');
                setExportPath(downloadDir);
            }
        };
        checkPlatform();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Resolve cover image for left preview
    const coverImage = useMemo(() => {
        if (!activeTimeline) return null;
        
        // Find first visual clip
        for (const trackRef of activeTimeline.tracks) {
            const track = state.tracks[trackRef.id];
            if (track && (track.type === 'video' || track.isMain) && track.clips.length > 0) {
                // Sort clips by start time to get the very first one
                const sortedClips = track.clips
                    .map(ref => state.clips[ref.id])
                    .filter(Boolean)
                    .sort((a, b) => a.start - b.start);

                if (sortedClips.length > 0) {
                    const firstClip = sortedClips[0];
                    const resource = getResource(firstClip.resource.id);
                    if (!resource) continue;

                    let url = resource.metadata?.thumbnailUrl || resource.url;
                    
                    // Desktop path conversion
                    if (url && !url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
                        if (platform.getPlatform() === 'desktop') {
                            try {
                                return platform.convertFileSrc(url);
                            } catch (e) {
                                console.warn("Failed to convert cover image src", e);
                            }
                        }
                    }
                    return url || null;
                }
            }
        }
        return null;
    }, [activeTimeline, state, getResource]);

    const handleBrowsePath = async () => {
        try {
            const selected = await platform.selectDir();
            if (selected) setExportPath(selected);
        } catch (e) { console.error(e); }
    };

    const handleCancel = () => {
        if (isExporting && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsExporting(false);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handleExport = async () => {
        if (!activeTimeline) return;
        
        setIsExporting(true);
        setProgress(0);
        
        // Setup Abort Controller
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const config: ExportConfig = {
            fileName,
            destinationPath: isDesktop ? exportPath : undefined,
            resolution,
            frameRate: fps,
            format,
            bitrate,
            exportVideo: videoEnabled,
            exportAudio: audioEnabled,
            smartHdr
        };

        const exportOptions: ExportOptions = {
            project,
            timeline: activeTimeline,
            state,
            config,
            signal: controller.signal
        };

        try {
            await videoExportService.exportVideo(exportOptions, (p) => setProgress(p));
            
            // Success
            if (!isDesktop) {
                 window.setTimeout(() => onClose(), 500);
            } else {
                 window.setTimeout(() => onClose(), 1000);
            }
        } catch (e: any) {
            if (e.message !== 'Export cancelled') {
                logger.error("Export error", e);
                await platform.notify('Export Failed', e.message || 'Unknown error');
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsExporting(false);
            }
            abortControllerRef.current = null;
        }
    };

    if (!isOpen || !domReady) return null;

    const estimatedSize = estimateSize(totalDuration, resolution, bitrate);
    const aspectRatio = project.settings.aspectRatio || '16:9';
    const [rw, rh] = aspectRatio.split(':').map(Number);
    const isPortrait = rh > rw;

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-4">
            <div 
                className="w-[1080px] h-[820px] max-h-[90vh] max-w-full bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl flex overflow-hidden text-gray-200 font-sans select-none ring-1 ring-white/5"
                onClick={e => e.stopPropagation()}
            >
                {/* LEFT: Preview Panel */}
                <div className="w-[40%] bg-[#09090b] flex flex-col relative border-r border-[#27272a] hidden md:flex">
                    <div className="h-16 flex items-center justify-center border-b border-[#27272a]/50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Preview
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                         <div 
                            className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/10 group bg-black transition-all duration-300" 
                            style={{ 
                                aspectRatio: aspectRatio.replace(':', '/'),
                                width: isPortrait ? 'auto' : '100%',
                                height: isPortrait ? '100%' : 'auto',
                                maxHeight: '500px',
                                maxWidth: '100%'
                            }}
                         >
                            {coverImage ? (
                                <img src={coverImage} className="w-full h-full object-cover opacity-80" alt="Preview" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#1e1e1e]">
                                    <MonitorPlay size={48} className="opacity-20 mb-2" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">No Preview</span>
                                </div>
                            )}
                            
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                 <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                                     <div className="w-0 h-0 border-t-[9px] border-t-transparent border-l-[16px] border-l-white border-b-[9px] border-b-transparent ml-1" />
                                 </div>
                            </div>
                         </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="p-8 border-t border-[#27272a] bg-[#121214]">
                        <div className="grid grid-cols-2 gap-6">
                             <StatItem label="Estimated Size" value={`~${estimatedSize} MB`} icon={<HardDrive size={14} className="text-blue-500" />} />
                             <StatItem label="Duration" value={`${totalDuration.toFixed(1)}s`} icon={<Clock size={14} className="text-green-500" />} />
                             <StatItem label="Resolution" value={resolution} icon={<MonitorPlay size={14} className="text-purple-500" />} />
                             <StatItem label="Format" value={format.toUpperCase()} icon={<FileVideo size={14} className="text-orange-500" />} />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Configuration Panel */}
                <div className="flex-1 flex flex-col bg-[#18181b] min-w-0">
                    {/* Header */}
                    <div className="flex-none h-20 px-8 flex items-center justify-between border-b border-[#27272a] bg-[#18181b]">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Export Project</h2>
                            <p className="text-xs text-gray-500 mt-1">Configure your final output settings</p>
                        </div>
                        <button 
                            onClick={handleCancel}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}>
                        
                        {/* 1. File Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Settings2 size={14} /> File Settings
                            </h3>
                            <div className="space-y-5 bg-[#202023] p-6 rounded-xl border border-[#27272a]">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400 font-medium">File Name</label>
                                    <input 
                                        type="text" 
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        className="w-full bg-[#121214] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>

                                {isDesktop && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Export Location</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={exportPath}
                                                readOnly
                                                className="flex-1 bg-[#121214] border border-[#333] rounded-lg px-4 py-3 text-xs text-gray-400 font-mono truncate cursor-default select-none"
                                            />
                                            <button 
                                                onClick={handleBrowsePath} 
                                                className="px-4 bg-[#27272a] hover:bg-[#333] border border-[#333] rounded-lg text-gray-300 hover:text-white transition-colors"
                                            >
                                                <FolderOpen size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Video Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileVideo size={14} /> Video Settings
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{videoEnabled ? 'Enabled' : 'Disabled'}</span>
                                    <Toggle checked={videoEnabled} onChange={setVideoEnabled} />
                                </div>
                            </div>

                            <div className={`space-y-6 bg-[#202023] p-6 rounded-xl border border-[#27272a] transition-all ${!videoEnabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Resolution</label>
                                        <Select value={resolution} onChange={v => setResolution(v as any)} options={RESOLUTIONS} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Frame Rate</label>
                                        <Select value={fps.toString()} onChange={v => setFps(parseInt(v) as any)} options={FRAME_RATES.map(String)} suffix="fps" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Format</label>
                                        <Select value={format} onChange={v => setFormat(v as any)} options={FORMATS} uppercase />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Quality</label>
                                        <Select value={bitrate} onChange={v => setBitrate(v as any)} options={BITRATES.map(b => b.value)} labels={BITRATES.map(b => b.label)} />
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-[#333]/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-300">Smart HDR</span>
                                        <HelpCircle size={12} className="text-gray-600" />
                                    </div>
                                    <Toggle checked={smartHdr} onChange={setSmartHdr} small />
                                </div>
                            </div>
                        </div>

                        {/* 3. Audio Settings */}
                        <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Music size={14} /> Audio Settings
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{audioEnabled ? 'Enabled' : 'Disabled'}</span>
                                    <Toggle checked={audioEnabled} onChange={setAudioEnabled} />
                                </div>
                            </div>
                             <div className={`bg-[#202023] p-6 rounded-xl border border-[#27272a] transition-all ${!audioEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400 font-medium">Audio Format</label>
                                    <Select value={audioFormat} onChange={setAudioFormat} options={['mp3', 'wav', 'aac']} uppercase />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex-none p-8 border-t border-[#27272a] bg-[#18181b] z-10 flex gap-4 items-center">
                        {isExporting ? (
                             <div className="flex-1 flex flex-col gap-2">
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>Rendering...</span>
                                     <span>{Math.round(progress)}%</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                 </div>
                             </div>
                        ) : (
                             <div className="flex-1 text-xs text-gray-500">
                                 Ready to export. Verify settings above.
                             </div>
                        )}

                        <Button 
                            variant="secondary" 
                            onClick={handleCancel} 
                            className="flex-shrink-0 bg-[#252526] border-[#333] hover:bg-[#333] text-gray-300 h-12 text-sm"
                        >
                            {isExporting ? 'Cancel' : 'Cancel'}
                        </Button>
                        <Button 
                            onClick={handleExport} 
                            disabled={isExporting}
                            className="flex-shrink-0 w-40 h-12 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 shadow-lg shadow-blue-900/20"
                        >
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : 'Export Video'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Sub Components ---

const StatItem: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#18181b] flex items-center justify-center border border-[#27272a]">
            {icon}
        </div>
        <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">{label}</div>
            <div className="text-sm font-medium text-gray-200">{value}</div>
        </div>
    </div>
);

const Select: React.FC<{ 
    value: string; 
    onChange: (val: string) => void; 
    options: string[]; 
    labels?: string[];
    suffix?: string;
    uppercase?: boolean;
}> = ({ value, onChange, options, labels, suffix, uppercase }) => (
    <div className="relative group">
        <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className={`
                w-full bg-[#121214] border border-[#333] hover:border-[#555] rounded-lg px-4 py-3 text-sm text-gray-200 appearance-none cursor-pointer focus:border-blue-500 focus:outline-none transition-all
                ${uppercase ? 'uppercase' : ''}
            `}
        >
            {options.map((opt, i) => (
                <option key={opt} value={opt} className="bg-[#18181b]">
                    {labels ? labels[i] : opt} {suffix}
                </option>
            ))}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
    </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; small?: boolean }> = ({ checked, onChange, small }) => (
    <button 
        onClick={() => onChange(!checked)}
        className={`
            ${small ? 'w-8 h-4' : 'w-10 h-6'} rounded-full relative transition-colors focus:outline-none
            ${checked ? 'bg-indigo-600' : 'bg-[#333] hover:bg-[#444]'}
        `}
    >
        <div 
            className={`
                absolute top-0.5 rounded-full bg-white transition-all shadow-sm
                ${small ? 'w-3 h-3' : 'w-5 h-5'}
                ${checked ? (small ? 'left-4.5' : 'left-4.5') : 'left-0.5'}
            `} 
        />
    </button>
);

