import type { Asset, AssetType } from '../entities/asset.entity'
import {
    Button,
    CommandPalette,
    buildFrameworkStyle,
    type CommandPaletteCommand
} from '@sdkwork/react-commons'
import type { AssetBusinessDomain } from '@sdkwork/react-types';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, UploadCloud, CheckCircle2, LayoutGrid, FileText, Command, SlidersHorizontal } from 'lucide-react';
import { AssetStoreProvider, useAssetStore } from '../store/assetStore';
import { AssetSidebar } from './AssetSidebar';
import { AssetGrid } from './AssetGrid';
import { AssetFilterDrawer } from './AssetFilterDrawer';
import { useTranslation } from '@sdkwork/react-i18n';
import { platform, uploadHelper as _uploadHelper } from '@sdkwork/react-core'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface ChooseAssetModalContentProps {
    onClose: () => void;
    onConfirm: (assets: Asset[]) => void;
    accepts?: AssetType[];
    multiple?: boolean;
    title?: string;
    extractedImages?: string[]; // New: Images parsed from content
    initialTab?: 'library' | 'document';
    domain?: AssetBusinessDomain;
}

const FRAMEWORK_STYLE = buildFrameworkStyle();

const ChooseAssetModalContent: React.FC<ChooseAssetModalContentProps> = ({
    onClose, onConfirm, accepts: _accepts, multiple: _multiple, title, extractedImages = [], initialTab = 'library'
}) => {
    const { t } = useTranslation();
    const {
        selectedAsset, setSelectedAsset,
        importAssets, searchQuery, setSearchQuery,
        filterType: _filterType, setFilterType,
        filterOrigin, setFilterOrigin,
        deleteAsset,
        pageData,
        isLoading,
        requiresAuthentication
    } = useAssetStore();

    // Initialize tab based on props, defaulting to library unless document requested and images exist
    const [tab, setTab] = useState<'library' | 'document'>(
        (initialTab === 'document' && extractedImages.length > 0) ? 'document' : 'library'
    );
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isLibraryFiltersOpen, setIsLibraryFiltersOpen] = useState(false);
    const [docSelection, setDocSelection] = useState<string | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const selectedAssetIds = useMemo(() => selectedAssets.map((item) => item.id), [selectedAssets]);
    const pageSummary = useMemo(() => {
        if (!pageData) return null;
        const currentPage = (pageData.number || 0) + 1;
        const totalPages = Math.max(1, pageData.totalPages || 0);
        const totalElements = pageData.totalElements || 0;
        return `${currentPage}/${totalPages} | ${totalElements}`;
    }, [pageData]);
    const originLabel = useMemo(() => {
        switch (filterOrigin) {
            case 'upload':
                return 'UPLOAD';
            case 'ai':
                return 'AI';
            case 'stock':
                return 'STOCK';
            case 'system':
                return 'SYSTEM';
            case 'all':
            default:
                return 'ALL';
        }
    }, [filterOrigin]);

    // Initial Filter Setup
    useEffect(() => {
        if (_accepts && _accepts.length > 0 && _accepts[0] as string !== 'unknown') {
            setFilterType(_accepts[0]);
        }
    }, [_accepts]);

    const handleGridSelect = (asset: Asset) => {
        if (_multiple) {
            setSelectedAssets((prev) => {
                const exists = prev.some((item) => item.id === asset.id);
                if (exists) {
                    return prev.filter((item) => item.id !== asset.id);
                }
                return [...prev, asset];
            });
            return;
        }
        setSelectedAsset(asset);
    };

    const handleConfirm = useCallback(() => {
        if (tab === 'document' && docSelection) {
            // Create a transient Asset object for the selected document image
            const asset: Asset = {
                id: docSelection, // URL is the ID
                uuid: docSelection, // URL as UUID for transient
                name: 'Image from Content',
                type: 'image',
                path: docSelection,
                size: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                origin: 'ai',
                metadata: {}
            };
            onConfirm([asset]);
        } else if (_multiple && selectedAssets.length > 0) {
            onConfirm(selectedAssets);
        } else if (selectedAsset) {
            onConfirm([selectedAsset]);
        }
        onClose();
    }, [docSelection, onClose, onConfirm, selectedAsset, selectedAssets, tab, _multiple]);

    const handleDelete = async (asset: Asset) => {
        if (await platform.confirm(`Are you sure you want to delete "${asset.name}"?`, 'Delete Asset', 'warning')) {
            await deleteAsset(asset);
        }
    };

    const canConfirm = tab === 'library'
        ? (_multiple ? selectedAssets.length > 0 : Boolean(selectedAsset))
        : Boolean(docSelection);

    const commandPaletteCommands = useMemo<CommandPaletteCommand[]>(() => {
        const commands: CommandPaletteCommand[] = [
            {
                id: 'tab-library',
                label: 'Switch to Asset Library',
                description: 'Browse and pick assets from the library.',
                groupId: 'view',
                groupLabel: 'View',
                visible: extractedImages.length > 0,
                shortcut: 'Alt+1',
                onSelect: () => setTab('library')
            },
            {
                id: 'tab-document',
                label: 'Switch to From Content',
                description: 'Pick extracted images from document content.',
                groupId: 'view',
                groupLabel: 'View',
                visible: extractedImages.length > 0,
                shortcut: 'Alt+2',
                onSelect: () => setTab('document')
            },
            {
                id: 'upload-local',
                label: 'Upload Local Files',
                description: 'Open file picker and import files into asset center.',
                groupId: 'asset',
                groupLabel: 'Asset Actions',
                visible: tab === 'library',
                shortcut: 'Ctrl+U',
                onSelect: importAssets
            },
            {
                id: 'search-clear',
                label: 'Clear Search Query',
                description: 'Reset search text in current asset library view.',
                groupId: 'asset',
                groupLabel: 'Asset Actions',
                visible: tab === 'library',
                disabled: searchQuery.trim().length === 0,
                onSelect: () => setSearchQuery('')
            },
            {
                id: 'origin-all',
                label: 'Filter Origin: All',
                description: 'Show all origins in asset library.',
                groupId: 'filter',
                groupLabel: 'Filters',
                visible: tab === 'library',
                disabled: filterOrigin === 'all',
                onSelect: () => setFilterOrigin('all')
            },
            {
                id: 'origin-upload',
                label: 'Filter Origin: Upload',
                description: 'Show only uploaded assets.',
                groupId: 'filter',
                groupLabel: 'Filters',
                visible: tab === 'library',
                disabled: filterOrigin === 'upload',
                onSelect: () => setFilterOrigin('upload')
            },
            {
                id: 'origin-ai',
                label: 'Filter Origin: AI',
                description: 'Show only AI-generated assets.',
                groupId: 'filter',
                groupLabel: 'Filters',
                visible: tab === 'library',
                disabled: filterOrigin === 'ai',
                onSelect: () => setFilterOrigin('ai')
            },
            {
                id: 'selection-clear',
                label: 'Clear Selection',
                description: 'Remove current selected assets in this modal.',
                groupId: 'selection',
                groupLabel: 'Selection',
                visible: tab === 'library',
                disabled: _multiple ? selectedAssets.length === 0 : !selectedAsset,
                onSelect: () => {
                    if (_multiple) {
                        setSelectedAssets([]);
                        return;
                    }
                    setSelectedAsset(null);
                }
            },
            {
                id: 'confirm-selection',
                label: 'Confirm Selection',
                description: 'Confirm current selection and close modal.',
                groupId: 'selection',
                groupLabel: 'Selection',
                shortcut: 'Ctrl+Enter',
                disabled: !canConfirm,
                onSelect: handleConfirm
            },
            {
                id: 'close-modal',
                label: 'Close Modal',
                description: 'Close the picker without confirming.',
                groupId: 'system',
                groupLabel: 'System',
                shortcut: 'Esc',
                onSelect: onClose
            }
        ];
        return commands;
    }, [
        _multiple,
        canConfirm,
        extractedImages.length,
        filterOrigin,
        handleConfirm,
        importAssets,
        onClose,
        searchQuery,
        selectedAsset,
        selectedAssets.length,
        setFilterOrigin,
        setSearchQuery,
        setSelectedAsset,
        tab
    ]);

    useEffect(() => {
        if (tab !== 'library') {
            setIsLibraryFiltersOpen(false);
        }
    }, [tab]);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const closeDrawerWhenDesktop = (event: MediaQueryListEvent) => {
            if (event.matches) {
                setIsLibraryFiltersOpen(false);
            }
        };

        mediaQuery.addEventListener('change', closeDrawerWhenDesktop);
        return () => mediaQuery.removeEventListener('change', closeDrawerWhenDesktop);
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsCommandPaletteOpen((prev) => !prev);
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u' && tab === 'library') {
                event.preventDefault();
                void importAssets();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                if (canConfirm) {
                    handleConfirm();
                }
                return;
            }
            if (event.altKey && event.key === '1' && extractedImages.length > 0) {
                event.preventDefault();
                setTab('library');
                return;
            }
            if (event.altKey && event.key === '2' && extractedImages.length > 0) {
                event.preventDefault();
                setTab('document');
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [canConfirm, extractedImages.length, handleConfirm, importAssets, tab]);

    const clearLibrarySelection = useCallback(() => {
        if (_multiple) {
            setSelectedAssets([]);
            return;
        }
        setSelectedAsset(null);
    }, [_multiple, setSelectedAsset, setSelectedAssets]);

    const selectionSummary = useMemo(() => {
        if (_multiple && selectedAssets.length > 0) {
            return String(selectedAssets.length);
        }
        if (!_multiple && selectedAsset) {
            return selectedAsset.name;
        }
        return null;
    }, [_multiple, selectedAsset, selectedAssets.length]);

    return (
        <div
            className="relative flex h-[85vh] max-h-[960px] w-[96vw] max-w-[1500px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#333] bg-[#1e1e1e] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={FRAMEWORK_STYLE}
        >
            <div className="shrink-0 border-b border-[#333] bg-[#252526]">
                <div className="flex min-w-0 flex-col gap-4 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-bold text-white">
                                    {title || t('sidebar.assets')}
                                </h3>
                                {tab === 'library' && (
                                    <span className="hidden items-center rounded-full border border-[#333] bg-[#1b1b1d] px-2 py-1 text-[11px] font-mono text-gray-400 xl:inline-flex">
                                        {isLoading && !pageSummary
                                            ? 'Loading...'
                                            : `Page ${pageSummary || '1/1 | 0'} | Origin ${originLabel}`}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                onClick={() => setIsCommandPaletteOpen(true)}
                                className="hidden xl:flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1b1b1d] px-2.5 py-1.5 text-[11px] text-gray-300 transition-colors hover:text-white"
                            >
                                <Command size={12} /> Quick Actions
                                <span className="text-gray-500">Ctrl+K</span>
                            </button>
                            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#333] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {extractedImages.length > 0 && (
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <div className="flex min-w-0 flex-wrap rounded-lg border border-[#333] bg-[#111] p-1">
                                <button
                                    onClick={() => setTab('library')}
                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === 'library' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <LayoutGrid size={14} /> Asset Library
                                </button>
                                <button
                                    onClick={() => setTab('document')}
                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === 'document' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <FileText size={14} /> From Content ({extractedImages.length})
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'library' && (
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            {requiresAuthentication && (
                                <div className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                                    Sign in to browse and import assets in the shared library.
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsLibraryFiltersOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#18181b] px-3 py-2 text-xs font-semibold text-gray-200 lg:hidden"
                            >
                                <SlidersHorizontal size={14} />
                                Filters
                            </button>
                            <div className="relative min-w-[220px] flex-1 max-w-[640px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={t('common.actions.search')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-[#333] bg-[#18181b] py-2 pl-9 pr-4 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" onClick={importAssets} className="gap-2" disabled={requiresAuthentication}>
                                    <UploadCloud size={14} /> Upload
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                {tab === 'library' ? (
                    <>
                        <AssetFilterDrawer open={isLibraryFiltersOpen} onClose={() => setIsLibraryFiltersOpen(false)}>
                            <AssetSidebar />
                        </AssetFilterDrawer>

                        <div className="hidden h-full w-[296px] shrink-0 overflow-hidden border-r border-[#333] bg-[#101012] lg:block">
                            <AssetSidebar />
                        </div>

                        <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#111]">
                            <AssetGrid
                                onPreview={handleGridSelect}
                                selectedAssetIds={_multiple ? selectedAssetIds : (selectedAsset ? [selectedAsset.id] : [])}
                                onDelete={handleDelete}
                            />

                            {selectionSummary && (
                                <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
                                    <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-[#333] bg-[#1e1e1e] px-4 py-2 shadow-xl animate-in slide-in-from-bottom-4">
                                        <span className="min-w-0 truncate text-xs text-gray-300">
                                            Selected: <span className="font-medium text-white">{selectionSummary}</span>
                                        </span>
                                        <button onClick={clearLibrarySelection} className="shrink-0 text-gray-400 transition-colors hover:text-white">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#111] p-5 sm:p-8">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-6">
                            {extractedImages.map((src, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setDocSelection(src)}
                                    className={`
                                        group relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 bg-[#1e1e1e] transition-all
                                        ${docSelection === src ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#333] hover:border-gray-500'}
                                    `}
                                >
                                    <img src={src} className="h-full w-full object-cover" alt={`Document asset ${idx + 1}`} />
                                    {docSelection === src && (
                                        <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-0.5 text-white shadow-sm">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t border-[#333] bg-[#252526]">
                <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-4 sm:px-8">
                    <Button variant="secondary" onClick={onClose} size="lg">Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        size="lg"
                        className="bg-blue-600 px-8 shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                    >
                        {`Confirm Selection${_multiple && selectedAssets.length > 0 ? ` (${selectedAssets.length})` : ''}`}
                    </Button>
                </div>
            </div>

            {isCommandPaletteOpen && (
                <div
                    className="absolute inset-0 z-40 flex items-start justify-center bg-black/50 p-6"
                    onClick={() => setIsCommandPaletteOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center">
                        <CommandPalette
                            paletteId="choose-asset-modal-command-palette"
                            className="h-[440px]"
                            title="Quick Actions"
                            placeholder="Search asset modal actions..."
                            commands={commandPaletteCommands}
                            open={isCommandPaletteOpen}
                            onOpenChange={setIsCommandPaletteOpen}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export interface ChooseAssetModalProps extends ChooseAssetModalContentProps {
    isOpen: boolean;
}

export const ChooseAssetModal: React.FC<ChooseAssetModalProps> = (props) => {
    if (!props.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Wrap in Provider to give it a clean, independent state context */}
            <AssetStoreProvider
                initialAllowedTypes={props.accepts}
                domain={props.domain}
            >
                <ChooseAssetModalContent {...props} />
            </AssetStoreProvider>
        </div>
    );
};
