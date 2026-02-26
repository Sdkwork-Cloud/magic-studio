
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
;
;
import { uploadHelper } from '@sdkwork/react-core';
import { Asset, AssetType, AssetOrigin } from '../entities/asset.entity';
import { Page } from '@sdkwork/react-commons';
import { assetService, ASSET_CATEGORIES } from '../services/assetService';

interface AssetStoreContextType {
  assets: Asset[];
  pageData: Page<Asset> | null;
  isLoading: boolean;
  
  // Filters
  filterType: AssetType | 'all';
  filterOrigin: AssetOrigin | 'all'; // New: Source Filter
  searchQuery: string;
  
  // Selection
  selectedAsset: Asset | null;
  allowedTypes?: AssetType[];
  
  // Actions
  setFilterType: (type: AssetType | 'all') => void;
  setFilterOrigin: (origin: AssetOrigin | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  
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
}

export const AssetStoreProvider: React.FC<AssetStoreProviderProps> = ({ children, initialAllowedTypes }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pageData, setPageData] = useState<Page<Asset> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter State
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterOrigin, setFilterOrigin] = useState<AssetOrigin | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const allowedTypes = initialAllowedTypes;

  const load = async (page = 0) => {
    setIsLoading(true);
    try {
        const result = await assetService.findAll({
            page,
            size: 1000, // Load larger batch for client-side filtering fluidity
            keyword: searchQuery
        });

        if (result.success && result.data) {
            setPageData(result.data);
            if (page === 0) {
                setAssets(result.data.content);
            } else {
                setAssets(prev => [...prev, ...(result.data?.content || [])]);
            }
        }
    } catch (e) {
        console.error("Failed to load assets", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
        load(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]); 

  // Initialize filter if props provided
  useEffect(() => {
      if (allowedTypes && allowedTypes.length > 0 && allowedTypes.length === 1) {
          setFilterType(allowedTypes[0]);
      }
  }, [allowedTypes]);

  const refresh = async () => {
      await assetService.refreshIndex();
      await load(0);
  };

  const importAssets = async () => {
      try {
          let accept = '*';
          if (allowedTypes && allowedTypes.length > 0) {
              const extensions = allowedTypes.flatMap(type => {
                  const cat = ASSET_CATEGORIES.find(c => c.id === type);
                  return cat ? cat.accepts : [];
              });
              if (extensions.length > 0) {
                  accept = extensions.join(',');
              }
          }

          // Use optimized file picker
          const files = await uploadHelper.pickFiles(true, accept);
          if (files.length === 0) return;
          
          setIsLoading(true);
          
          for (const file of files) {
              const ext = '.' + file.name.split('.').pop()?.toLowerCase();
              let targetCat: AssetType = 'image';
              
              // Auto-detect type
              for (const cat of ASSET_CATEGORIES) {
                  if (cat.accepts.includes(ext)) {
                      targetCat = cat.id as AssetType;
                      break;
                  }
              }
              
              if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(targetCat)) {
                  continue;
              }

              // Explicitly mark as 'upload' origin
              const newAsset = await assetService.importAsset(
                  file.data, 
                  file.name, 
                  targetCat, 
                  'upload', // Origin: User Upload
                  file.path // Source Path (Desktop optimization)
              );
              
              setAssets(prev => [newAsset, ...prev]);
          }
      } catch (e) {
          console.error(e);
          alert("Import failed");
      } finally {
          setIsLoading(false);
      }
  };

  const deleteAsset = async (asset: Asset) => {
      try {
          const res = await assetService.delete(asset);
          if (res.success) {
              setAssets(prev => prev.filter(a => a.id !== asset.id));
              if (selectedAsset?.id === asset.id) setSelectedAsset(null);
          }
      } catch (e) { console.error(e); }
  };

  const renameAsset = async (asset: Asset, newName: string) => {
       try {
           await assetService.renameAsset(asset.path, newName);
           await refresh();
       } catch (e) { console.error(e); }
  };

  // Client-side filtering logic
  const displayedAssets = useMemo(() => {
      return assets.filter(asset => {
          // 1. Type Constraint (Prop)
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

  return (
    <AssetStoreContext.Provider value={{
        assets: displayedAssets,
        pageData,
        isLoading,
        filterType,
        filterOrigin,
        searchQuery,
        selectedAsset,
        allowedTypes,
        setFilterType,
        setFilterOrigin,
        setSearchQuery,
        setSelectedAsset,
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
