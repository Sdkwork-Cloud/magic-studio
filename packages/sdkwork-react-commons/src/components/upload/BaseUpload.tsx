import React, { useRef, useState } from 'react';
import { Upload, Loader2, FolderOpen, Replace, Trash2, Eye } from 'lucide-react';
import { BaseUploadProps } from './types';
import { uploadRuntimeService } from '../../services/uploadRuntimeService';

interface InternalBaseUploadProps extends BaseUploadProps {
    accept: string;
    renderPreview: (resolvedUrl: string | null, isResolving: boolean) => React.ReactNode;
    defaultIcon: React.ReactNode;
    resolvedUrl: string | null;
    isResolving: boolean;
}

/**
 * Base Upload Component (Logic Layer)
 * Handles: Drag & Drop, File System Interaction, Loading States, Hover Effects
 */
export const BaseUpload: React.FC<InternalBaseUploadProps> = ({
    value,
    onChange,
    onRemove,
    onAssetSelect,
    onPreview,
    accept,
    renderPreview,
    defaultIcon,
    resolvedUrl,
    isResolving,
    label,
    icon,
    loading = false,
    disabled = false,
    className = '',
    allowDelete = true,
    aspectRatio = 'aspect-square',
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isDesktop = uploadRuntimeService.getPlatform() === 'desktop';

    // Consolidated loading state.
    // Note: If value exists but isResolving is true, we consider it loading only if we don't have a resolvedUrl yet.
    // If we have resolvedUrl, we can show it even if 'isResolving' might be technically true during transition.
    // However, usually isResolving is the source of truth for the hook.
    const isLoading = loading || internalLoading || (!!value && isResolving && !resolvedUrl);

    const containerStyle: React.CSSProperties = {};
    let containerClass = `relative group rounded-xl overflow-hidden transition-all duration-200 select-none bg-[#111] ${className}`;

    if (typeof aspectRatio === 'number') {
        containerStyle.aspectRatio = `${aspectRatio}`;
    } else if (typeof aspectRatio === 'string' && !aspectRatio.includes('aspect-')) {
         // If generic string like "16/9"
         containerStyle.aspectRatio = aspectRatio;
    } else {
         containerClass += ` ${aspectRatio}`;
    }

    if (!value) containerClass += ' border-2 border-dashed border-[#27272a] hover:border-[#3f3f46]';
    else containerClass += ' border border-[#27272a]';

    if (isDragOver) containerClass += ' border-blue-500 bg-blue-500/10';
    if (disabled) containerClass += ' opacity-50 cursor-not-allowed';

    const processFile = async (fileObj: File) => {
        if (!onChange) return;
        setInternalLoading(true);
        try {
            // @ts-ignore - path exists in Electron/Tauri
            const path = fileObj.path;

            if (isDesktop && path) {
                const nativeUrl = uploadRuntimeService.convertFileSrc(path);
                onChange({
                    data: new Uint8Array(0),
                    name: fileObj.name,
                    url: nativeUrl,
                    path: path
                });
            } else {
                const tempUrl = URL.createObjectURL(fileObj);
                onChange({
                    data: fileObj,
                    name: fileObj.name,
                    url: tempUrl
                });
            }
        } catch (e) {
            console.error("Upload error", e);
        } finally {
            setInternalLoading(false);
        }
    };

    const handleFileSelect = async () => {
        if (disabled || internalLoading) return;

        if (isDesktop) {
            try {
                const files = await uploadRuntimeService.pickFiles(false, accept, false);
                if (files.length > 0) {
                    const f = files[0];
                    if (onChange) {
                        const url = f.path ? uploadRuntimeService.convertFileSrc(f.path) : '';
                        onChange({
                            data: f.data,
                            name: f.name,
                            url: url,
                            path: f.path
                        });
                    }
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            inputRef.current?.click();
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled || internalLoading) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleClick = () => {
        if (disabled || internalLoading) return;
        if (onAssetSelect && !value) return; // Wait for overlay selection
        if (!value) handleFileSelect();
    };

    return (
        <div
            className={containerClass}
            style={containerStyle}
            onDragOver={(e) => { e.preventDefault(); !disabled && setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={(e) => {
                    if (e.target.files?.[0]) processFile(e.target.files[0]);
                    e.target.value = '';
                }}
            />

            {/* Content Area */}
            {value ? (
                <>
                    {/* Render Specific Preview */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        {renderPreview(resolvedUrl, isLoading)}
                    </div>

                    {/* Actions Overlay */}
                    <div className={`
                        absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20
                        ${isLoading ? 'opacity-100 bg-black/80' : ''}
                    `}>
                         {isLoading ? (
                             <Loader2 size={24} className="text-blue-500 animate-spin" />
                         ) : (
                             <>
                                {onPreview && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
                                        title="Preview"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleFileSelect(); }}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
                                    title="Replace"
                                >
                                    <Replace size={16} />
                                </button>
                                {allowDelete && onRemove && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white rounded-full backdrop-blur-sm transition-colors border border-red-500/30"
                                        title="Remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                             </>
                         )}
                    </div>
                </>
            ) : (
                <>
                    {/* Empty State */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 transition-opacity duration-200 ${isHovered && onAssetSelect ? 'opacity-0' : 'opacity-100'}`}>
                        {internalLoading ? (
                            <Loader2 size={24} className="animate-spin text-blue-500" />
                        ) : (
                            <>
                                <div className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-200">
                                    {icon || defaultIcon}
                                </div>
                                {label && (
                                    <span className="text-xs font-medium text-center leading-tight">
                                        {label}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Asset Selection Overlay */}
                    {onAssetSelect && !internalLoading && (
                        <div className={`
                            absolute inset-0 bg-[#1e1e20] flex flex-col items-center justify-center gap-3 z-10 transition-opacity duration-200
                            ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                        `}>
                            <div className="flex gap-4 w-full px-4 justify-center">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleFileSelect(); }}
                                    className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg hover:bg-[#2a2a2d] text-gray-400 hover:text-white transition-all w-16 aspect-square border border-transparent hover:border-[#333]"
                                >
                                    <Upload size={18} />
                                    <span className="text-[10px] font-medium">Local</span>
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onAssetSelect(); }}
                                    className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg hover:bg-[#2a2a2d] text-gray-400 hover:text-white transition-all w-16 aspect-square border border-transparent hover:border-[#333]"
                                >
                                    <FolderOpen size={18} />
                                    <span className="text-[10px] font-medium">Assets</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
