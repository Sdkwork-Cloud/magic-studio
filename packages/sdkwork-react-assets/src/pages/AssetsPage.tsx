import type { Asset } from '../entities';
import { AssetGrid } from '../components/AssetGrid';
import { AssetSidebar } from '../components/AssetSidebar';
import { AssetCenterHeader } from '../components/AssetCenterHeader';
import { AssetTypeTabs } from '../components/AssetTypeTabs';
import { AssetFilterDrawer } from '../components/AssetFilterDrawer';
import { AssetPreviewModal } from '../components/AssetPreviewModal';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAssetStore } from '../store/assetStore';
import { useTranslation } from '@sdkwork/react-i18n';
import { platform } from '@sdkwork/react-core';
import { useAssetCenterShortcuts } from '../hooks/useAssetCenterShortcuts';

const AssetsPage: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    importAssets,
    deleteAsset,
    filterType,
    setFilterType,
    filterOrigin,
    clearFilters,
    pageData,
    assets,
    loadedAssets,
    requiresAuthentication,
    domain,
    typeCounts,
    allowedTypes
  } = useAssetStore();
  const { t } = useTranslation();
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handlePreview = (asset: Asset) => {
    setPreviewAsset(asset);
  };

  const handleDelete = async (asset: Asset) => {
    const confirmed = await platform.confirm(`Are you sure you want to delete "${asset.name}"?`, 'Delete Asset', 'warning');
    if (confirmed) {
      await deleteAsset(asset);
    }
  };

  const hasQuery = searchQuery.trim().length > 0;
  const hasActiveFilters = filterType !== 'all' || filterOrigin !== 'all';
  const hasActiveCriteria = hasActiveFilters || hasQuery;
  const totalLabel = pageData ? pageData.totalElements : loadedAssets.length;
  const loadedLabel = loadedAssets.length;

  const resultLabel = hasActiveCriteria
    ? t('assetCenter.stats.filtered', { count: String(assets.length) })
    : t('assetCenter.stats.results', { count: String(assets.length) });
  const coverageLabel = totalLabel > loadedLabel
    ? t('assetCenter.stats.loadedWithTotal', {
      loaded: String(loadedLabel),
      total: String(totalLabel)
    })
    : t('assetCenter.stats.total', { total: String(totalLabel) });

  const domainLabel = useMemo(() => {
    const fallback = domain
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
    return t(`assetCenter.domains.${domain}`, fallback);
  }, [domain, t]);

  const clearAllCriteria = useCallback(() => {
    clearFilters();
    setSearchQuery('');
  }, [clearFilters, setSearchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const closeMobileDrawerWhenDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileFilterOpen(false);
      }
    };
    mediaQuery.addEventListener('change', closeMobileDrawerWhenDesktop);
    return () => mediaQuery.removeEventListener('change', closeMobileDrawerWhenDesktop);
  }, []);

  useAssetCenterShortcuts({
    searchInputRef,
    hasActiveCriteria,
    onClearAllCriteria: clearAllCriteria
  });

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#121214]">
      <div className="hidden w-[296px] shrink-0 overflow-hidden border-r border-[#27272a] bg-[#0f0f11] lg:block">
        <AssetSidebar showTypeSection={false} />
      </div>

      <AssetFilterDrawer open={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)}>
        <AssetSidebar showTypeSection={false} />
      </AssetFilterDrawer>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#111]">
        <AssetCenterHeader
          domainLabel={domainLabel}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
          onImport={importAssets}
          hasActiveCriteria={hasActiveCriteria}
          onClearAll={clearAllCriteria}
          resultLabel={resultLabel}
          coverageLabel={coverageLabel}
          searchInputRef={searchInputRef}
          canImport={!requiresAuthentication}
        />
        <AssetTypeTabs
          filterType={filterType}
          typeCounts={typeCounts}
          allowedTypes={allowedTypes}
          onChangeType={setFilterType}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <AssetGrid onPreview={handlePreview} onDelete={handleDelete} />
        </div>
      </div>

      {previewAsset && (
        <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
      )}
    </div>
  );
};

export default AssetsPage;
