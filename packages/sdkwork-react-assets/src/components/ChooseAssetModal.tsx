import type { Asset, AssetType } from '../entities/asset.entity'
import {
    AppShell,
    Button,
    CommandPalette,
    SplitView,
    buildFrameworkStyle,
    type CommandPaletteCommand
} from '@sdkwork/react-commons'
import type { AssetBusinessDomain } from '@sdkwork/react-types';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, UploadCloud, CheckCircle2, LayoutGrid, FileText, Command } from 'lucide-react';
import { AssetStoreProvider, useAssetStore } from '../store/assetStore';
import { AssetSidebar } from './AssetSidebar';
import { AssetGrid } from './AssetGrid';
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
        isLoading
    } = useAssetStore();

    // Initialize tab based on props, defaulting to library unless document requested and images exist
    const [tab, setTab] = useState<'library' | 'document'>(
        (initialTab === 'document' && extractedImages.length > 0) ? 'document' : 'library'
    );
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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

    return (
        <div
            className="relative w-[90vw] h-[85vh] max-w-[1600px] bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={FRAMEWORK_STYLE}
        >
            <AppShell
                id="choose-asset-modal-shell"
                className="h-full w-full"
                header={(
                    <div className="h-16 bg-[#252526] flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-white font-bold text-lg">{title || t('sidebar.assets')}</h3>

                            {/* View Switcher if extracted images exist */}
                            {extractedImages.length > 0 && (
                                <div className="flex bg-[#111] p-1 rounded-lg border border-[#333]">
                                    <button
                                        onClick={() => setTab('library')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${tab === 'library' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        <LayoutGrid size={14} /> Asset Library
                                    </button>
                                    <button
                                        onClick={() => setTab('document')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${tab === 'document' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        <FileText size={14} /> From Content ({extractedImages.length})
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {tab === 'library' && (
                                <>
                                    <div className="hidden lg:flex items-center px-2 py-1 rounded-md border border-[#333] bg-[#1b1b1d] text-[11px] text-gray-400 font-mono">
                                        {isLoading && !pageSummary
                                            ? 'Loading...'
                                            : `Page ${pageSummary || '1/1 | 0'} | Origin ${originLabel}`}
                                    </div>
                                    <div className="relative w-64">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder={t('common.actions.search')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#18181b] border border-[#333] rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <Button size="sm" onClick={importAssets} className="gap-2">
                                        <UploadCloud size={14} /> Upload
                                    </Button>
                                </>
                            )}
                            <button
                                onClick={() => setIsCommandPaletteOpen(true)}
                                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#333] bg-[#1b1b1d] text-[11px] text-gray-300 hover:text-white transition-colors"
                            >
                                <Command size={12} /> Quick Actions
                                <span className="text-gray-500">Ctrl+K</span>
                            </button>
                            <div className="h-6 w-[1px] bg-[#333] mx-2" />
                            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-[#333] rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}
                content={(
                    <div className="h-full flex overflow-hidden">
                        {tab === 'library' ? (
                            <div className="flex-1 overflow-hidden">
                                <SplitView
                                    id="choose-asset-library-split-view"
                                    className="h-full w-full"
                                    primary={<AssetSidebar />}
                                    secondary={(
                                        <div className="h-full bg-[#111] overflow-y-auto p-0 relative">
                                            <div className="absolute inset-0">
                                                <AssetGrid
                                                    onPreview={handleGridSelect}
                                                    selectedAssetIds={_multiple ? selectedAssetIds : (selectedAsset ? [selectedAsset.id] : [])}
                                                    onDelete={handleDelete}
                                                />
                                            </div>
                                            {/* Overlay Selection Indicator since AssetGrid doesn't show "selected" state persistently for pickers usually */}
                                            {_multiple && selectedAssets.length > 0 && (
                                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#1e1e1e] border border-[#333] rounded-full px-4 py-2 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                                                    <span className="text-xs text-gray-300">Selected: <span className="text-white font-medium">{selectedAssets.length}</span></span>
                                                    <button onClick={() => setSelectedAssets([])} className="hover:text-white"><X size={14} /></button>
                                                </div>
                                            )}
                                            {!_multiple && selectedAsset && (
                                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#1e1e1e] border border-[#333] rounded-full px-4 py-2 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                                                    <span className="text-xs text-gray-300">Selected: <span className="text-white font-medium">{selectedAsset.name}</span></span>
                                                    <button onClick={() => setSelectedAsset(null)} className="hover:text-white"><X size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    defaultPrimarySize={280}
                                    minPrimarySize={272}
                                    maxPrimarySize={380}
                                    minSecondarySize={520}
                                    dividerSize={6}
                                />
                            </div>
                        ) : (
                            /* Document Images Tab */
                            <div className="flex-1 bg-[#111] p-8 overflow-y-auto">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {extractedImages.map((src, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setDocSelection(src)}
                                            className={`
                                                group relative aspect-video bg-[#1e1e1e] border-2 rounded-xl cursor-pointer overflow-hidden transition-all
                                                ${docSelection === src ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#333] hover:border-gray-500'}
                                            `}
                                        >
                                            <img src={src} className="w-full h-full object-cover" />
                                            {docSelection === src && (
                                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                footer={(
                    <div className="h-20 bg-[#252526] flex items-center justify-end px-8 gap-4 z-20">
                        <Button variant="secondary" onClick={onClose} size="lg">Cancel</Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!canConfirm}
                            size="lg"
                            className="px-8 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                        >
                            {`Confirm Selection${_multiple && selectedAssets.length > 0 ? ` (${selectedAssets.length})` : ''}`}
                        </Button>
                    </div>
                )}
            />

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
