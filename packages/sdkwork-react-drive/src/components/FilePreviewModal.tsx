
import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, AlertCircle, FileText } from 'lucide-react';
import { vfs } from '@sdkwork/react-fs';
import { viewerRegistry } from '../viewers/viewerRegistry';
import { Button, pathUtils } from '@sdkwork/react-commons';
import { DriveItem } from '../entities/drive.entity';
import { driveService } from '../services/driveService';
import { FileIcon } from '@sdkwork/react-editor';
import { platform } from '@sdkwork/react-core';
import { assetService } from '@sdkwork/react-assets';

interface FilePreviewModalProps {
    item: DriveItem;
    onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ item, onClose }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // We use a callback ref to ensure we capture the DOM element once it's mounted
    const [headerElement, setHeaderElement] = useState<HTMLElement | null>(null);
    const headerRef = useCallback((node: HTMLElement | null) => {
        if (node !== null) {
            setHeaderElement(node);
        }
    }, []);

    // Resolve Viewer Component
    const ViewerComponent = viewerRegistry.getViewer(item);

    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Unified Resolution Strategy:
                // Treat the DriveItem ID (which is the path) as an asset path.
                // assetService handles the logic for Desktop (convertFileSrc) vs Web (VFS read -> Blob).
                
                // 1. Determine if we can use the Asset Service pipeline
                // For known media types, this is efficient. For code/text, we might want raw text.
                const isMedia = item.mimeType?.startsWith('video/') || 
                                item.mimeType?.startsWith('audio/') || 
                                item.mimeType?.startsWith('image/') ||
                                /\.(mp4|mov|webm|mp3|wav|png|jpg|jpeg|gif|webp|svg)$/i.test(item.name) ||
                                item.name.endsWith('.pdf');

                if (isMedia) {
                    // Use standard asset resolution
                    // We need to ensure the path is treated as an absolute path or virtual path correctly
                    // DriveItem.id is typically the absolute path (Desktop) or VFS path (Web)
                    let resolvePath = item.id;
                    
                    // Call the service to resolve the URL. This handles `assets://` resolution if needed,
                    // as well as converting local file paths to viewable URLs on desktop.
                    const resolvedUrl = await assetService.resolveAssetUrl({ path: resolvePath });
                    if (resolvedUrl) {
                        setUrl(resolvedUrl);
                    } else {
                        throw new Error("Could not resolve asset URL");
                    }
                } else {
                    // Text/Code/Unknown - Read content directly
                    // This allows the CodeViewer/DocViewer to handle the raw data or text
                    const binary = await vfs.readFileBinary(item.id);
                    
                    let mime = item.mimeType || 'application/octet-stream';
                    if (!item.mimeType) {
                        if (item.name.endsWith('.txt')) mime = 'text/plain';
                        else if (item.name.endsWith('.json')) mime = 'application/json';
                        else if (item.name.endsWith('.md')) mime = 'text/markdown';
                    }

                    const blob = new Blob([binary] as any, { type: mime });
                    const objectUrl = URL.createObjectURL(blob);
                    setUrl(objectUrl);
                }

            } catch (e) {
                console.error("[FilePreview] Load failed", e);
                setError('Unable to load file content.');
            } finally {
                setLoading(false);
            }
        };

        loadContent();
        
        return () => {
             // Cleanup Blob URLs (Asset URLs from convertFileSrc don't need revocation, but Blobs do)
             if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        }
    }, [item.id, item.mimeType, item.name]);

    const handleSave = async (content: string | Uint8Array) => {
        try {
            const parent = pathUtils.dirname(item.id);
            if (typeof content === 'string') {
                await vfs.writeFile(item.id, content);
            } else {
                await driveService.uploadFile(parent, item.name, content);
            }
        } catch (e) {
            console.error("Save failed", e);
            throw e;
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative w-[85vw] h-[85vh] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Unified Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#252526] z-10 h-14 flex-none select-none">
                    {/* Left: Title & Info */}
                    <div className="flex items-center gap-3 overflow-hidden">
                         <div className="p-2 bg-[#333] rounded-lg">
                             <FileIcon name={item.name} isDirectory={false} expanded={false} />
                         </div>
                         <div className="flex flex-col min-w-0">
                             <h3 className="text-gray-200 font-bold text-sm truncate">{item.name}</h3>
                             <p className="text-[10px] text-gray-500 font-mono opacity-70 truncate">{item.id}</p>
                         </div>
                    </div>

                    {/* Right: Viewer Actions (Portal) + Standard Actions */}
                    <div className="flex items-center gap-3">
                        {/* The Viewer will inject controls (Save, etc) here */}
                        <div ref={headerRef} className="flex items-center gap-2" />

                        <div className="h-4 w-[1px] bg-[#444]" />

                        {url && (
                            <a href={url} download={item.name} title="Download File">
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors">
                                    <Download size={18} />
                                </button>
                            </a>
                        )}
                        <button 
                            onClick={onClose} 
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#c42b1c] rounded-lg transition-colors"
                            title="Close Preview"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative bg-[#111]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
                             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                             <span className="text-xs">Loading content...</span>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        ViewerComponent && url ? (
                            <ViewerComponent 
                                item={item} 
                                url={url} 
                                onClose={onClose} 
                                onSave={handleSave}
                                headerElement={headerElement}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                 <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                                 <p>No preview available for this file type.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
