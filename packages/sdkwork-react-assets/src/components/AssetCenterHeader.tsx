import React from 'react';
import { Search, SlidersHorizontal, Upload } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

export interface AssetCenterHeaderProps {
  domainLabel: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenMobileFilters: () => void;
  onImport: () => void | Promise<void>;
  hasActiveCriteria: boolean;
  onClearAll: () => void;
  resultLabel: string;
  coverageLabel: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  canImport?: boolean;
}

export const AssetCenterHeader: React.FC<AssetCenterHeaderProps> = ({
  domainLabel,
  searchQuery,
  onSearchQueryChange,
  onOpenMobileFilters,
  onImport,
  hasActiveCriteria,
  onClearAll,
  resultLabel,
  coverageLabel,
  searchInputRef,
  canImport = true,
}) => {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 border-b border-[#27272a] bg-[#141417]/95 px-4 py-2 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-sm font-semibold text-gray-100">
            {t('assetCenter.page.title', 'Asset Center')}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#333] bg-[#202024] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
            {t('assetCenter.page.domain', 'Domain')}: {domainLabel}
          </span>
          <span className="hidden items-center rounded-full border border-[#333] bg-[#202024] px-2 py-0.5 text-[10px] font-mono text-gray-400 sm:inline-flex">
            {`${resultLabel} / ${coverageLabel}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveCriteria && (
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-md border border-[#333] bg-[#222225] px-2 py-1 text-[11px] font-semibold text-gray-300 transition-colors hover:bg-[#2a2a2d] hover:text-white"
            >
              {t('assetCenter.filters.clearAll', 'Clear All')}
            </button>
          )}
          <button
            onClick={onImport}
            disabled={!canImport}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors ${
              canImport
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'cursor-not-allowed bg-[#2a2a2d] text-gray-500'
            }`}
          >
            <Upload size={13} />
            {t('studio.common.import', 'Import')}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#222225] px-3 py-1.5 text-xs font-semibold text-gray-200 lg:hidden"
          aria-label={t('assetCenter.filters.mobileEntry', 'Filters')}
        >
          <SlidersHorizontal size={13} />
          {t('assetCenter.filters.mobileEntry', 'Filters')}
        </button>
        <div className="relative w-full max-w-[36rem]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('assetCenter.search.placeholder', 'Search assets by name, tag, or extension')}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#252526] py-1.5 pl-9 pr-3 text-sm text-gray-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>
    </div>
  );
};
