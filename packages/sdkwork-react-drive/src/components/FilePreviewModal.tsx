import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { vfs } from '@sdkwork/react-fs';
import { viewerRegistry } from '../viewers/viewerRegistry';
import { pathUtils, type ServiceResult } from '@sdkwork/react-commons';
import { DriveItem } from '../entities';
import { driveBusinessService } from '../services';
import { FileIcon } from '@sdkwork/react-editor';
import { assetService } from '@sdkwork/react-assets';
import { useTranslation } from '@sdkwork/react-i18n';

interface FilePreviewModalProps {
    item: DriveItem;
    onClose: () => void;
}

const ensureResultSuccess = (result: ServiceResult<unknown>, operation: string): void => {
    if (!result.success) {
        throw new Error(result.message || `${operation} failed.`);
    }
};

const getResultDataOrThrow = <T,>(result: ServiceResult<T>, operation: string): T => {
    if (!result.success) {
        throw new Error(result.message || `${operation} failed.`);
    }
    if (result.data === undefined || result.data === null) {
        throw new Error(`${operation} returned no data.`);
    }
    return result.data;
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ item, onClose }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [headerElement, setHeaderElement] = useState<HTMLElement | null>(null);
    const headerRef = useCallback((node: HTMLElement | null) => {
        if (node !== null) {
            setHeaderElement(node);
        }
    }, []);

    const ViewerComponent = viewerRegistry.getViewer(item);

    useEffect(() => {
        let createdObjectUrl: string | null = null;

        const loadContent = async () => {
            setLoading(true);
            setError(null);

            const resolvedPath = item.path || item.id;

            try {
                const isMedia = item.mimeType?.startsWith('video/') ||
                    item.mimeType?.startsWith('audio/') ||
                    item.mimeType?.startsWith('image/') ||
                    /\.(mp4|mov|webm|mkv|mp3|wav|ogg|flac|png|jpg|jpeg|gif|webp|svg|pdf)$/i.test(item.name);

                if (isMedia) {
                    if (item.previewUrl) {
                        setUrl(item.previewUrl);
                        return;
                    }

                    const resolvedUrl = await assetService.resolveAssetUrl({ path: resolvedPath });
                    if (!resolvedUrl) {
                        throw new Error(t('drive.preview.errors.resolveUrl'));
                    }
                    setUrl(resolvedUrl);
                    return;
                }

                const contentResult = await driveBusinessService.getFileContent(item.id);
                const textContent = getResultDataOrThrow(contentResult, 'Load file content');
                const mime = item.mimeType || (item.name.endsWith('.md') ? 'text/markdown' : 'text/plain');
                const blob = new Blob([textContent], { type: mime });
                createdObjectUrl = URL.createObjectURL(blob);
                setUrl(createdObjectUrl);
            } catch (sdkError) {
                // Local fallback for local provider compatibility.
                try {
                    const binary = await vfs.readFileBinary(resolvedPath);
                    let mime = item.mimeType || 'application/octet-stream';
                    if (!item.mimeType) {
                        if (item.name.endsWith('.txt')) mime = 'text/plain';
                        else if (item.name.endsWith('.json')) mime = 'application/json';
                        else if (item.name.endsWith('.md')) mime = 'text/markdown';
                    }
                    const blob = new Blob([binary] as BlobPart[], { type: mime });
                    createdObjectUrl = URL.createObjectURL(blob);
                    setUrl(createdObjectUrl);
                } catch (localError) {
                    console.error('[FilePreview] Load failed', sdkError, localError);
                    setError(t('drive.preview.errors.loadContent'));
                }
            } finally {
                setLoading(false);
            }
        };

        loadContent();

        return () => {
            if (createdObjectUrl) {
                URL.revokeObjectURL(createdObjectUrl);
            }
        };
    }, [item.id, item.path, item.previewUrl, item.mimeType, item.name]);

    const handleSave = async (content: string | Uint8Array) => {
        try {
            if (typeof content === 'string') {
                const updateResult = await driveBusinessService.updateFileContent(item.id, content);
                ensureResultSuccess(updateResult, 'Save file content');
                return;
            }
            const parentPath = pathUtils.dirname(item.path || item.id);
            const uploadResult = await driveBusinessService.uploadFile(parentPath, item.name, content);
            ensureResultSuccess(uploadResult, 'Save file');
        } catch (e) {
            console.error('Save failed', e);
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

                <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#252526] z-10 h-14 flex-none select-none">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-[#333] rounded-lg">
                            <FileIcon name={item.name} isDirectory={false} expanded={false} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-gray-200 font-bold text-sm truncate">{item.name}</h3>
                            <p className="text-[10px] text-gray-500 font-mono opacity-70 truncate">{item.path || item.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div ref={headerRef} className="flex items-center gap-2" />

                        <div className="h-4 w-[1px] bg-[#444]" />

                        {url && (
                            <a href={url} download={item.name} title={t('drive.preview.actions.downloadFile')}>
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors">
                                    <Download size={18} />
                                </button>
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#c42b1c] rounded-lg transition-colors"
                            title={t('drive.preview.actions.closePreview')}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative bg-[#111]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">{t('drive.preview.loading')}</span>
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
                                <p>{t('drive.preview.unavailable')}</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
