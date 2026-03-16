import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Clock,
    FileVideo,
    FolderOpen,
    HardDrive,
    Loader2,
    MonitorPlay,
    Music,
    Settings2,
    X,
} from 'lucide-react';

import { Button, logger } from '@sdkwork/react-commons';
import { platform } from '@sdkwork/react-core';

import {
    videoExportService,
    type ExportBitrate,
    type ExportConfig,
    type ExportFormat,
    type ExportFrameRate,
    type ExportResolution,
} from '../../services';
import {
    estimateAudioOnlyExportSizeMb,
    isAudioOnlyExportRequest,
    resolveAudioOnlyExportCard,
} from '../../domain/export/audioOnlyExport';
import {
    resolveExportRuntimePresentation,
    resolvePreferredAvailableFormat,
    type ExportRuntimePresentation as ExportRuntimeViewModel,
} from '../../domain/export/exportRuntimePresentation';
import { validateExportRequest } from '../../domain/export/exportValidation';
import { useMagicCutStore } from '../../store/magicCutStore';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RESOLUTIONS: ExportResolution[] = ['480p', '720p', '1080p', '2k', '4k'];
const FRAME_RATES: ExportFrameRate[] = [24, 25, 30, 50, 60];
const BITRATES: { label: string; value: ExportBitrate }[] = [
    { label: 'Low (Smaller File)', value: 'lower' },
    { label: 'Recommended', value: 'recommended' },
    { label: 'High (Better Quality)', value: 'higher' },
];

const estimateSize = (
    duration: number,
    resolution: ExportResolution,
    bitrate: ExportBitrate
) => {
    let baseRate = 8;
    if (resolution === '480p') baseRate = 2;
    if (resolution === '720p') baseRate = 5;
    if (resolution === '2k') baseRate = 15;
    if (resolution === '4k') baseRate = 45;

    if (bitrate === 'lower') baseRate *= 0.6;
    if (bitrate === 'higher') baseRate *= 1.5;

    const sizeMb = (baseRate * duration) / 8;
    return Math.round(sizeMb);
};

const resolveExportDuration = (
    totalDuration: number,
    inPoint: number | null,
    outPoint: number | null
) => {
    const start = inPoint ?? 0;
    const end = outPoint ?? totalDuration;
    return Math.max(0, end - start);
};

type ExportFormatCardOption =
    | ExportRuntimeViewModel['formatOptions'][number]
    | ReturnType<typeof resolveAudioOnlyExportCard>;

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const { project, state, activeTimeline, totalDuration, getResource, inPoint, outPoint } = useMagicCutStore();
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [domReady, setDomReady] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [fileName, setFileName] = useState(project.name);
    const [exportPath, setExportPath] = useState<string>('');
    const [isDesktop, setIsDesktop] = useState(false);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [resolution, setResolution] = useState<ExportResolution>('1080p');
    const [bitrate, setBitrate] = useState<ExportBitrate>('recommended');
    const [format, setFormat] = useState<ExportFormat>('mp4');
    const [fps, setFps] = useState<ExportFrameRate>(30);
    const [smartHdr, setSmartHdr] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    const [runtimePresentation, setRuntimePresentation] = useState<ExportRuntimeViewModel | null>(null);
    const [runtimeLoading, setRuntimeLoading] = useState(false);
    const [runtimeError, setRuntimeError] = useState<string | null>(null);

    useEffect(() => {
        setDomReady(true);
    }, []);

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

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let active = true;
        setRuntimeLoading(true);
        setRuntimeError(null);

        void videoExportService
            .getRuntimeExportSupport()
            .then((support) => {
                if (!active) return;

                const presentation = resolveExportRuntimePresentation(support);
                setRuntimePresentation(presentation);
                setFormat((currentFormat) => resolvePreferredAvailableFormat(currentFormat, presentation) ?? currentFormat);
            })
            .catch((error) => {
                if (!active) return;
                setRuntimeError(error instanceof Error ? error.message : 'Failed to inspect export runtime.');
                setRuntimePresentation(null);
            })
            .finally(() => {
                if (active) {
                    setRuntimeLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!videoEnabled && smartHdr) {
            setSmartHdr(false);
        }
    }, [smartHdr, videoEnabled]);

    useEffect(() => {
        if (smartHdr && runtimePresentation && !runtimePresentation.smartHdrSupported) {
            setSmartHdr(false);
        }
    }, [runtimePresentation, smartHdr]);

    const coverImage = useMemo(() => {
        if (!activeTimeline) return null;

        for (const trackRef of activeTimeline.tracks) {
            const track = state.tracks[trackRef.id];
            if (track && (track.trackType === 'video' || track.isMain) && track.clips.length > 0) {
                const sortedClips = track.clips
                    .map((ref) => state.clips[ref.id])
                    .filter(Boolean)
                    .sort((a, b) => a.start - b.start);

                if (sortedClips.length > 0) {
                    const firstClip = sortedClips[0];
                    const resource = getResource(firstClip.resource.id);
                    if (!resource) continue;

                    const url = resource.metadata?.thumbnailUrl || resource.url;
                    if (
                        url &&
                        !url.startsWith('http') &&
                        !url.startsWith('data:') &&
                        !url.startsWith('blob:') &&
                        platform.getPlatform() === 'desktop'
                    ) {
                        try {
                            return platform.convertFileSrc(url);
                        } catch (error) {
                            console.warn('Failed to convert cover image src', error);
                        }
                    }

                    return url || null;
                }
            }
        }

        return null;
    }, [activeTimeline, state, getResource]);

    const audioOnlyFormatOption = useMemo(() => resolveAudioOnlyExportCard(), []);
    const isAudioOnly = isAudioOnlyExportRequest({
        exportVideo: videoEnabled,
        exportAudio: audioEnabled,
    });
    const selectedFormatOption = runtimePresentation?.formatOptions.find((option) => option.format === format) ?? null;
    const exportDuration = resolveExportDuration(totalDuration, inPoint, outPoint);
    const hasExportRange = (inPoint ?? 0) > 0 || outPoint !== null;
    const activeFormatOption: ExportFormatCardOption | null = isAudioOnly ? audioOnlyFormatOption : selectedFormatOption;
    const formatOptions: ExportFormatCardOption[] = isAudioOnly
        ? [audioOnlyFormatOption]
        : (runtimePresentation?.formatOptions ?? []);
    const estimatedSize = isAudioOnly
        ? estimateAudioOnlyExportSizeMb(exportDuration || totalDuration)
        : estimateSize(exportDuration || totalDuration, resolution, bitrate);
    const aspectRatio = project.settings.aspectRatio || '16:9';
    const [rw, rh] = aspectRatio.split(':').map(Number);
    const isPortrait = rh > rw;

    useEffect(() => {
        if (isAudioOnly && format !== 'wav') {
            setFormat('wav');
            return;
        }

        if (videoEnabled && format === 'wav') {
            setFormat(runtimePresentation ? resolvePreferredAvailableFormat('mp4', runtimePresentation) ?? 'mp4' : 'mp4');
        }
    }, [format, isAudioOnly, runtimePresentation, videoEnabled]);

    const handleVideoToggle = (nextValue: boolean) => {
        setVideoEnabled(nextValue);
        if (!nextValue) {
            setAudioEnabled(true);
            setSmartHdr(false);
            setFormat('wav');
        }
    };

    const handleAudioToggle = (nextValue: boolean) => {
        if (!nextValue && !videoEnabled) {
            setVideoEnabled(true);
            setFormat(runtimePresentation ? resolvePreferredAvailableFormat('mp4', runtimePresentation) ?? 'mp4' : 'mp4');
        }
        setAudioEnabled(nextValue);
    };

    const exportBlockedReason = useMemo(() => {
        if (!videoEnabled && !audioEnabled) {
            return 'Enable video or audio before exporting.';
        }

        if (isAudioOnly) {
            return format === 'wav' ? null : 'Audio-only export currently supports WAV only.';
        }

        if (runtimeLoading) {
            return 'Inspecting runtime export capabilities...';
        }

        if (runtimeError) {
            return runtimeError;
        }

        if (!runtimePresentation) {
            return null;
        }

        if (runtimePresentation.blockingReason) {
            return runtimePresentation.blockingReason;
        }

        if (selectedFormatOption && !selectedFormatOption.available) {
            return selectedFormatOption.description;
        }

        return null;
    }, [audioEnabled, format, isAudioOnly, runtimeLoading, runtimeError, runtimePresentation, selectedFormatOption, videoEnabled]);

    const footerMessage = isExporting
        ? (isAudioOnly ? 'Rendering and encoding the final audio mixdown...' : 'Rendering and muxing the final timeline...')
        : exportBlockedReason || activeFormatOption?.description || (isAudioOnly ? 'Ready to export a standalone WAV mixdown.' : 'Ready to export with the selected runtime path.');

    const handleBrowsePath = async () => {
        try {
            const selected = await platform.selectDir();
            if (selected) setExportPath(selected);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancel = () => {
        if (isExporting && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsExporting(false);
            setProgress(0);
            return;
        }

        onClose();
    };

    const handleExport = async () => {
        if (!activeTimeline) return;

        const safeFileName = fileName.trim();
        if (!safeFileName) {
            await platform.notify('Export Failed', 'Please enter a file name.');
            return;
        }

        if (exportBlockedReason) {
            await platform.notify('Export Failed', exportBlockedReason);
            return;
        }

        const exportValidationError = validateExportRequest({
            exportVideo: videoEnabled,
            exportAudio: audioEnabled,
            format,
        });
        if (exportValidationError) {
            await platform.notify('Export Failed', exportValidationError);
            return;
        }

        if (smartHdr && runtimePresentation && !runtimePresentation.smartHdrSupported) {
            await platform.notify('Export Failed', runtimePresentation.smartHdrReason);
            return;
        }

        if (inPoint !== null && outPoint !== null && outPoint <= inPoint) {
            await platform.notify('Export Failed', 'Out point must be greater than In point.');
            return;
        }

        setIsExporting(true);
        setProgress(0);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const config: ExportConfig = {
            fileName: safeFileName,
            destinationPath: isDesktop ? exportPath : undefined,
            resolution,
            frameRate: fps,
            format,
            bitrate,
            exportVideo: videoEnabled,
            exportAudio: audioEnabled,
            smartHdr,
        };

        try {
            await videoExportService.exportTimeline(
                {
                    project,
                    timeline: activeTimeline,
                    state,
                    config,
                    signal: controller.signal,
                    inPoint,
                    outPoint,
                },
                (nextProgress) => setProgress(nextProgress)
            );

            window.setTimeout(() => onClose(), isDesktop ? 1000 : 500);
        } catch (error: any) {
            if (error.message !== 'Export cancelled') {
                logger.error('Export error', error);
                await platform.notify('Export Failed', error.message || 'Unknown error');
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsExporting(false);
            }
            abortControllerRef.current = null;
        }
    };

    if (!isOpen || !domReady) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-4">
            <div
                className="w-[1080px] h-[820px] max-h-[90vh] max-w-full bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl flex overflow-hidden text-gray-200 font-sans select-none ring-1 ring-white/5"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="w-[40%] bg-[#09090b] flex flex-col relative border-r border-[#27272a] hidden md:flex">
                    <div className="h-16 flex items-center justify-center border-b border-[#27272a]/50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Preview
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                        <div
                            className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/10 bg-black transition-all duration-300"
                            style={{
                                aspectRatio: aspectRatio.replace(':', '/'),
                                width: isPortrait ? 'auto' : '100%',
                                height: isPortrait ? '100%' : 'auto',
                                maxHeight: '500px',
                                maxWidth: '100%',
                            }}
                        >
                            {coverImage ? (
                                <img src={coverImage} className="w-full h-full object-cover opacity-85" alt="Export preview" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#1e1e1e]">
                                    <MonitorPlay size={48} className="opacity-20 mb-2" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">No Cover Frame</span>
                                </div>
                            )}

                            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-black/55 border border-white/10 text-[10px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                                    Cover Frame
                                </span>
                                {hasExportRange && (
                                    <span className="px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/30 text-[10px] font-semibold tracking-[0.18em] text-cyan-100 uppercase">
                                        In/Out Range
                                    </span>
                                )}
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                                <div className="text-[10px] uppercase tracking-[0.22em] text-white/55 font-semibold">
                                    {isAudioOnly
                                        ? 'Audio mixdown'
                                        : activeFormatOption?.route === 'webcodecs'
                                        ? 'WebCodecs export'
                                        : activeFormatOption?.route === 'browser-media-recorder'
                                            ? 'MediaRecorder export'
                                            : activeFormatOption?.route === 'audio-buffer'
                                                ? 'PCM WAV export'
                                            : 'Export preview'}
                                </div>
                                <div className="mt-2 text-lg font-semibold text-white">
                                    {activeFormatOption?.label || format.toUpperCase()} • {isAudioOnly ? '48 kHz PCM' : resolution}
                                </div>
                                <div className="mt-1 text-sm text-white/65">
                                    {exportDuration.toFixed(1)}s timeline • {isAudioOnly ? 'Standalone WAV audio' : `${aspectRatio} canvas`}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-[#27272a] bg-[#121214]">
                        <div className="grid grid-cols-2 gap-6">
                            <StatItem label="Estimated Size" value={`~${estimatedSize} MB`} icon={<HardDrive size={14} className="text-blue-500" />} />
                            <StatItem label="Duration" value={`${exportDuration.toFixed(1)}s`} icon={<Clock size={14} className="text-green-500" />} />
                            <StatItem label={isAudioOnly ? 'Audio Mode' : 'Resolution'} value={isAudioOnly ? '48 kHz / Stereo' : resolution} icon={isAudioOnly ? <Music size={14} className="text-cyan-400" /> : <MonitorPlay size={14} className="text-cyan-400" />} />
                            <StatItem label="Format" value={(activeFormatOption?.label || format).toUpperCase()} icon={isAudioOnly ? <Music size={14} className="text-orange-500" /> : <FileVideo size={14} className="text-orange-500" />} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-[#18181b] min-w-0">
                    <div className="flex-none h-20 px-8 flex items-center justify-between border-b border-[#27272a] bg-[#18181b]">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Export Project</h2>
                            <p className="text-xs text-gray-500 mt-1">Configure output settings based on the current runtime.</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                        onChange={(event) => setFileName(event.target.value)}
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

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileVideo size={14} /> Video Settings
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{videoEnabled ? 'Enabled' : 'Disabled'}</span>
                                    <Toggle checked={videoEnabled} onChange={handleVideoToggle} />
                                </div>
                            </div>

                            <div className={`space-y-6 bg-[#202023] p-6 rounded-xl border border-[#27272a] transition-all ${!videoEnabled ? 'opacity-65' : ''}`}>
                                {videoEnabled ? (
                                    <RuntimeNotice
                                        loading={runtimeLoading}
                                        error={runtimeError}
                                        presentation={runtimePresentation}
                                    />
                                ) : (
                                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-4 text-xs text-cyan-100/80">
                                        Video rendering is disabled. The export switches to a standalone WAV audio mixdown with the current In/Out range.
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Resolution</label>
                                        <Select value={resolution} onChange={(value) => setResolution(value as ExportResolution)} options={RESOLUTIONS} disabled={!videoEnabled} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Frame Rate</label>
                                        <Select value={fps.toString()} onChange={(value) => setFps(parseInt(value, 10) as ExportFrameRate)} options={FRAME_RATES.map(String)} suffix="fps" disabled={!videoEnabled} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs text-gray-400 font-medium">Format</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {formatOptions.map((option) => (
                                            <FormatCard
                                                key={option.format}
                                                option={option}
                                                selected={format === option.format}
                                                onSelect={(nextFormat) => setFormat(nextFormat)}
                                            />
                                        ))}
                                        {videoEnabled && runtimeLoading && Array.from({ length: 2 }).map((_, index) => (
                                            <div
                                                key={`format-skeleton-${index}`}
                                                className="h-[118px] rounded-xl border border-white/8 bg-white/[0.03] animate-pulse"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Quality</label>
                                        <Select
                                            value={bitrate}
                                            onChange={(value) => setBitrate(value as ExportBitrate)}
                                            options={BITRATES.map((item) => item.value)}
                                            labels={BITRATES.map((item) => item.label)}
                                            disabled={!videoEnabled}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Range</label>
                                        <div className="rounded-lg border border-[#333] bg-[#121214] px-4 py-3 text-sm text-gray-300">
                                            {hasExportRange
                                                ? `In ${inPoint?.toFixed(1) ?? '0.0'}s -> Out ${(outPoint ?? totalDuration).toFixed(1)}s`
                                                : 'Full timeline'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between gap-4 pt-2 border-t border-[#333]/50">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-300">Smart HDR</span>
                                        </div>
                                        <p className="text-xs leading-5 text-gray-500">
                                            {videoEnabled
                                                ? (runtimePresentation?.smartHdrReason || 'Checking HDR export support...')
                                                : 'Audio-only WAV mixdown does not include HDR metadata.'}
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={videoEnabled && smartHdr && !!runtimePresentation?.smartHdrSupported}
                                        onChange={setSmartHdr}
                                        small
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Music size={14} /> Audio Settings
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{audioEnabled ? (isAudioOnly ? 'Master' : 'Included') : 'Muted'}</span>
                                    <Toggle checked={audioEnabled} onChange={handleAudioToggle} />
                                </div>
                            </div>
                            <div className="bg-[#202023] p-6 rounded-xl border border-[#27272a] transition-all">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-medium">{isAudioOnly ? 'Standalone Mixdown' : 'Embedded Audio'}</label>
                                    <p className="text-xs leading-5 text-gray-500">
                                        {isAudioOnly
                                            ? 'Exports a standalone uncompressed WAV master using the current timeline mix, clip effects, fades, and In/Out range.'
                                            : audioEnabled
                                                ? 'Audio is embedded into the selected video container. Disable video to switch into standalone WAV export.'
                                                : 'The current export will mute timeline audio. Enable audio to embed it in video or export a standalone WAV mixdown.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-none p-8 border-t border-[#27272a] bg-[#18181b] z-10 flex gap-4 items-center">
                        {isExporting ? (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{footerMessage}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        ) : (
                            <div className={`flex-1 text-xs ${exportBlockedReason ? 'text-amber-300/80' : 'text-gray-500'}`}>
                                {footerMessage}
                            </div>
                        )}

                        <Button
                            variant="secondary"
                            onClick={handleCancel}
                            className="flex-shrink-0 bg-[#252526] border-[#333] hover:bg-[#333] text-gray-300 h-12 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || !!exportBlockedReason}
                            className="flex-shrink-0 w-40 h-12 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : (isAudioOnly ? 'Export Audio' : 'Export Video')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const RuntimeNotice: React.FC<{
    loading: boolean;
    error: string | null;
    presentation: ExportRuntimeViewModel | null;
}> = ({ loading, error, presentation }) => {
    if (loading) {
        return (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-xs text-gray-400">
                Checking export runtime capabilities...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 text-amber-300" />
                    <div>
                        <div className="text-xs font-semibold text-amber-100">Runtime inspection failed</div>
                        <p className="mt-1 text-xs leading-5 text-amber-100/70">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!presentation) return null;

    const blocked = !!presentation.blockingReason;

    return (
        <div className={`rounded-xl border px-4 py-4 ${blocked ? 'border-amber-500/25 bg-amber-500/10' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
            <div className="flex items-start gap-3">
                {blocked ? (
                    <AlertTriangle size={16} className="mt-0.5 text-amber-300" />
                ) : (
                    <Check size={16} className="mt-0.5 text-emerald-300" />
                )}
                <div>
                    <div className={`text-xs font-semibold ${blocked ? 'text-amber-100' : 'text-emerald-100'}`}>
                        {blocked ? 'Runtime export unavailable' : 'Runtime export verified'}
                    </div>
                    <p className={`mt-1 text-xs leading-5 ${blocked ? 'text-amber-100/75' : 'text-emerald-100/70'}`}>
                        {presentation.blockingReason || presentation.runtimeSummary}
                    </p>
                </div>
            </div>
        </div>
    );
};

const FormatCard: React.FC<{
    option: ExportFormatCardOption;
    selected: boolean;
    onSelect: (format: ExportFormat) => void;
}> = ({ option, selected, onSelect }) => (
    <button
        type="button"
        onClick={() => option.available && onSelect(option.format)}
        disabled={!option.available}
        className={`rounded-xl border p-4 text-left transition-all ${
            option.available
                ? selected
                    ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                : 'border-white/8 bg-white/[0.02] opacity-55 cursor-not-allowed'
        }`}
    >
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className="text-sm font-semibold text-white">{option.label}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gray-500">
                    {option.route === 'webcodecs'
                        ? 'WebCodecs'
                        : option.route === 'browser-media-recorder'
                            ? 'MediaRecorder'
                            : option.route === 'audio-buffer'
                                ? 'Offline PCM'
                            : 'Not available'}
                </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ${
                option.available && option.recommended
                    ? 'bg-emerald-400/15 text-emerald-100 border border-emerald-300/25'
                    : option.available
                        ? 'bg-white/10 text-white/70 border border-white/10'
                        : 'bg-white/6 text-white/45 border border-white/8'
            }`}>
                {option.badge}
            </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-400">{option.description}</p>
    </button>
);

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
    disabled?: boolean;
}> = ({ value, onChange, options, labels, suffix, disabled }) => (
    <div className="relative group">
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className={`w-full bg-[#121214] border border-[#333] rounded-lg px-4 py-3 text-sm text-gray-200 appearance-none focus:border-blue-500 focus:outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#555] cursor-pointer'}`}
        >
            {options.map((option, index) => (
                <option key={option} value={option} className="bg-[#18181b]">
                    {labels ? labels[index] : option} {suffix}
                </option>
            ))}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
    </div>
);

const Toggle: React.FC<{
    checked: boolean;
    onChange: (value: boolean) => void;
    small?: boolean;
    disabled?: boolean;
}> = ({ checked, onChange, small, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
            ${small ? 'w-8 h-4' : 'w-10 h-6'} rounded-full relative transition-colors focus:outline-none
            ${checked ? 'bg-indigo-600' : 'bg-[#333] hover:bg-[#444]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <div
            className={`
                absolute top-0.5 rounded-full bg-white transition-all shadow-sm
                ${small ? 'w-3 h-3' : 'w-5 h-5'}
                ${checked ? 'left-4.5' : 'left-0.5'}
            `}
        />
    </button>
);
