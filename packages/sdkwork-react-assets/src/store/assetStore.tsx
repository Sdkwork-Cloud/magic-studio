import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { uploadHelper } from '@sdkwork/react-core';
import type { Page } from '@sdkwork/react-commons';
import type { AssetBusinessDomain, AssetContentKey } from '@sdkwork/react-types';
import type { Asset, AssetType, AssetOrigin } from '../entities';
import { createSpringPage } from '../services/impl/springPage';
import { assetUiStateService } from '../services/assetUiStateService';
import {
  assetBusinessFacade,
  assetCenterService,
  detectAssetTypeByFilename,
  mapUnifiedPageToAssetPage,
  normalizeSpringPageRequest,
  readWorkspaceScope,
  resolveAcceptExtensionsByTypes,
  resolveDomainAssetTypes,
  toContentKey
} from '../asset-center';

interface AssetStoreContextType {
  assets: Asset[];
  loadedAssets: Asset[];
  pageData: Page<Asset> | null;
  isLoading: boolean;
  originCounts: Record<AssetOrigin | 'all', number>;
  typeCounts: Partial<Record<AssetType | 'all', number>>;
  
  // Filters
  filterType: AssetType | 'all';
  filterOrigin: AssetOrigin | 'all'; // New: Source Filter
  searchQuery: string;
  domain: AssetBusinessDomain;
  
  // Selection
  selectedAsset: Asset | null;
  allowedTypes?: AssetType[];
  
  // Actions
  setFilterType: (type: AssetType | 'all') => void;
  setFilterOrigin: (origin: AssetOrigin | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  clearFilters: () => void;
  
  refresh: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  importAssets: () => Promise<void>;
  deleteAsset: (asset: Asset) => Promise<void>;
  renameAsset: (asset: Asset, newName: string) => Promise<void>;
}

const AssetStoreContext = createContext<AssetStoreContextType | undefined>(undefined);

interface AssetStoreProviderProps {
  children: ReactNode;
  initialAllowedTypes?: AssetType[];
  domain?: AssetBusinessDomain;
}

const createEmptyPage = (
  page: number,
  size: number,
  sort?: string[]
): Page<Asset> => createSpringPage([], { page, size, sort });

const ASSET_PAGE_SIZE = 60;
const FILTER_ORIGIN_CANDIDATES: Array<AssetOrigin | 'all'> = [
  'all',
  'upload',
  'ai',
  'stock',
  'system'
];

const resolveQueryContentKeys = (
  filterType: AssetType | 'all',
  allowedTypes?: AssetType[]
): AssetContentKey[] | undefined => {
  if (filterType !== 'all') {
    return [toContentKey(filterType)];
  }
  if (allowedTypes && allowedTypes.length > 0) {
    return allowedTypes.map((item) => toContentKey(item));
  }
  return undefined;
};

export const AssetStoreProvider: React.FC<AssetStoreProviderProps> = ({
  children,
  initialAllowedTypes,
  domain = 'asset-center'
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pageData, setPageData] = useState<Page<Asset> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterOrigin, setFilterOrigin] = useState<AssetOrigin | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const requestSequenceRef = useRef(0);

  const allowedTypes = useMemo<AssetType[] | undefined>(() => {
    const domainTypes = resolveDomainAssetTypes(domain);
    if (!initialAllowedTypes || initialAllowedTypes.length === 0) {
      return domainTypes;
    }
    const allowed = new Set(domainTypes);
    return initialAllowedTypes.filter((item) => allowed.has(item));
  }, [domain, initialAllowedTypes]);

  useEffect(() => {
    const parsed = assetUiStateService.readFilters(domain);
    if (!parsed) {
      return;
    }
    if (parsed.origin && FILTER_ORIGIN_CANDIDATES.includes(parsed.origin)) {
      setFilterOrigin(parsed.origin);
    }
    if (!parsed.type) {
      return;
    }
    if (parsed.type === 'all') {
      setFilterType('all');
      return;
    }
    if (!allowedTypes || allowedTypes.length === 0 || allowedTypes.includes(parsed.type)) {
      setFilterType(parsed.type);
    }
  }, [allowedTypes, domain]);

  useEffect(() => {
    assetUiStateService.writeFilters(domain, {
      type: filterType,
      origin: filterOrigin
    });
  }, [domain, filterOrigin, filterType]);

  const load = useCallback(async (page = 0) => {
    const requestId = ++requestSequenceRef.current;
    setIsLoading(true);
    try {
      const normalized = normalizeSpringPageRequest({
        page,
        size: ASSET_PAGE_SIZE,
        keyword: searchQuery,
        sort: ['updatedAt,desc']
      });
      const scope = readWorkspaceScope();
      await assetCenterService.initialize();

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (initialAllowedTypes && initialAllowedTypes.length > 0 && (!allowedTypes || allowedTypes.length === 0)) {
        const emptyPage = createEmptyPage(normalized.page, normalized.size, normalized.sort);
        setPageData(emptyPage);
        setAssets([]);
        return;
      }

      const centerPage = await assetBusinessFacade.queryByDomain(domain, {
        page: normalized.page,
        size: normalized.size,
        keyword: normalized.keyword,
        sort: normalized.sort,
        scope,
        // Keep server query broad inside current domain; apply UI filters client-side.
        types: resolveQueryContentKeys('all', allowedTypes),
        origins: undefined,
        includeDeleted: false
      });

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      const mappedPage = mapUnifiedPageToAssetPage(centerPage);
      const content = mappedPage.content;
      setPageData(mappedPage);
      if (page === 0) {
        setAssets(content);
      } else {
        setAssets((prev) => [...prev, ...content]);
      }
    } catch (e) {
      console.error('Failed to load assets from unified asset-center', e);
    } finally {
      if (requestId === requestSequenceRef.current) {
        setIsLoading(false);
      }
    }
  }, [allowedTypes, domain, initialAllowedTypes, searchQuery]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      load(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Initialize filter if props provided
  useEffect(() => {
    if (allowedTypes && allowedTypes.length > 0 && allowedTypes.length === 1) {
      setFilterType(allowedTypes[0]);
    }
  }, [allowedTypes]);

  useEffect(() => {
    if (filterType !== 'all' && allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(filterType)) {
      setFilterType('all');
    }
  }, [allowedTypes, filterType]);

  const refresh = async () => {
    await load(0);
  };

  const clearFilters = useCallback(() => {
    setFilterType('all');
    setFilterOrigin('all');
  }, []);

  const importAssets = async () => {
    try {
      const effectiveTypes = allowedTypes && allowedTypes.length > 0
        ? allowedTypes
        : resolveDomainAssetTypes(domain);
      const extensions = resolveAcceptExtensionsByTypes(effectiveTypes);
      const accept = extensions.length > 0 ? extensions.join(',') : '*';
      const files = await uploadHelper.pickFiles(true, accept);
      if (files.length === 0) {
        return;
      }

      setIsLoading(true);
      const scope = readWorkspaceScope();
      for (const file of files) {
        const detected = detectAssetTypeByFilename(file.name, {
          preferred: filterType === 'all' ? undefined : filterType,
          candidates: effectiveTypes,
          fallback: effectiveTypes.includes('file')
            ? 'file'
            : effectiveTypes[0] || 'file'
        });
        if (
          effectiveTypes &&
          effectiveTypes.length > 0 &&
          !effectiveTypes.includes(detected)
        ) {
          continue;
        }

        const sourcePath = typeof file.path === 'string' && file.path.trim().length > 0
          ? file.path
          : undefined;
        await assetBusinessFacade.importByDomain(domain, {
          scope,
          type: toContentKey(detected),
          name: file.name,
          data: sourcePath ? undefined : file.data,
          sourcePath,
          metadata: {
            origin: 'upload',
            source: 'asset-center-import'
          }
        });
      }
      await load(0);
    } catch (e) {
      console.error(e);
      alert('Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAsset = async (asset: Asset) => {
    try {
      await assetCenterService.deleteById(asset.id);
      setAssets((prev) => prev.filter((item) => item.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
      }
      await load(0);
    } catch (e) {
      console.error(e);
    }
  };

  const renameAsset = async (asset: Asset, newName: string) => {
    try {
      await assetCenterService.renameAsset(asset.id, newName);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Client-side filtering logic
  const displayedAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 1. Type Constraint (Prop/Domain)
      if (allowedTypes && allowedTypes.length > 0) {
        if (!allowedTypes.includes(asset.type)) return false;
      }

      // 2. Type Filter (UI)
      const matchesType = filterType === 'all' || asset.type === filterType;
      if (!matchesType) return false;

      // 3. Origin Filter (UI)
      const matchesOrigin = filterOrigin === 'all' || asset.origin === filterOrigin;
      if (!matchesOrigin) return false;

      return true;
    });
  }, [assets, filterType, filterOrigin, allowedTypes]);

  const originCounts = useMemo<Record<AssetOrigin | 'all', number>>(() => {
    const counts: Record<AssetOrigin | 'all', number> = {
      all: 0,
      upload: 0,
      ai: 0,
      stock: 0,
      system: 0
    };
    assets.forEach((asset) => {
      if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(asset.type)) {
        return;
      }
      // Source facets should respect current type filter.
      if (filterType !== 'all' && asset.type !== filterType) {
        return;
      }
      counts.all += 1;
      if (asset.origin in counts) {
        counts[asset.origin as AssetOrigin] += 1;
      }
    });
    return counts;
  }, [allowedTypes, assets, filterType]);

  const typeCounts = useMemo<Partial<Record<AssetType | 'all', number>>>(() => {
    const counts: Partial<Record<AssetType | 'all', number>> = {
      all: 0
    };
    (allowedTypes || []).forEach((type) => {
      counts[type] = 0;
    });
    assets.forEach((asset) => {
      if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(asset.type)) {
        return;
      }
      // Type facets should respect current source filter.
      if (filterOrigin !== 'all' && asset.origin !== filterOrigin) {
        return;
      }
      counts.all = (counts.all || 0) + 1;
      counts[asset.type] = (counts[asset.type] || 0) + 1;
    });
    return counts;
  }, [allowedTypes, assets, filterOrigin]);

  return (
    <AssetStoreContext.Provider value={{
      assets: displayedAssets,
      loadedAssets: assets,
      pageData,
      isLoading,
      originCounts,
      typeCounts,
      filterType,
      filterOrigin,
      searchQuery,
      domain,
      selectedAsset,
      allowedTypes,
      setFilterType,
      setFilterOrigin,
      setSearchQuery,
      setSelectedAsset,
      clearFilters,
      refresh,
      loadPage: load,
      importAssets,
      deleteAsset,
      renameAsset
    }}>
      {children}
    </AssetStoreContext.Provider>
  );
};

export const useAssetStore = () => {
  const context = useContext(AssetStoreContext);
  if (!context) throw new Error('useAssetStore must be used within a AssetStoreProvider');
  return context;
};
