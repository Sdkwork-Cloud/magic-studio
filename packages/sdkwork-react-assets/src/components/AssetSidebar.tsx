import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildFrameworkStyle } from '@sdkwork/react-commons';
import type { AssetType } from '../entities';
import { useAssetStore } from '../store/assetStore';
import { ASSET_CENTER_CATEGORIES } from '../asset-center';
import { useTranslation } from '@sdkwork/react-i18n';
import { Check, ChevronDown, ChevronRight, ChevronsLeftRight, LayoutGrid } from 'lucide-react';
import {
  QUICK_PRESETS,
  SOURCE_FILTERS,
  resolveSourceLabel,
  resolveTypeIcon,
  resolveTypeLabel
} from './sidebar/assetSidebarConfig';
import { assetUiStateService } from '../services/assetUiStateService';

const FRAMEWORK_STYLE = buildFrameworkStyle();

type SectionKey = 'quick' | 'source' | 'type';
type SectionState = Record<SectionKey, boolean>;

const DEFAULT_SECTION_STATE: SectionState = {
  quick: true,
  source: true,
  type: true
};

const isSectionState = (value: unknown): value is SectionState => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const state = value as Partial<SectionState>;
  return (
    typeof state.quick === 'boolean' &&
    typeof state.source === 'boolean' &&
    typeof state.type === 'boolean'
  );
};

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, expanded, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[var(--sdk-radius-sm)] px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--sdk-text-muted)] transition-colors hover:text-[var(--sdk-text-secondary)]"
      aria-expanded={expanded}
    >
      <span>{title}</span>
      {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
    </button>
  );
};

interface AssetSidebarProps {
  showTypeSection?: boolean;
}

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  showTypeSection = true
}) => {
  const {
    filterType,
    setFilterType,
    filterOrigin,
    setFilterOrigin,
    clearFilters,
    loadedAssets,
    originCounts,
    typeCounts,
    allowedTypes,
    pageData,
    domain
  } = useAssetStore();
  const { t } = useTranslation();
  const [sections, setSections] = useState<SectionState>(DEFAULT_SECTION_STATE);

  useEffect(() => {
    const parsed = assetUiStateService.readSidebarSections(domain);
    if (isSectionState(parsed)) {
      setSections(parsed);
    } else {
      setSections(DEFAULT_SECTION_STATE);
    }
  }, [domain]);

  useEffect(() => {
    assetUiStateService.writeSidebarSections(domain, sections);
  }, [domain, sections]);

  const toggleSection = useCallback((key: SectionKey) => {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const typeItems = useMemo(() => {
    return ASSET_CENTER_CATEGORIES
      .filter((category) => {
        if (!allowedTypes || allowedTypes.length === 0) {
          return true;
        }
        return allowedTypes.includes(category.id);
      })
      .map((category) => ({
        id: category.id,
        label: resolveTypeLabel(category.id, t, category.label),
        Icon: resolveTypeIcon(category.id)
      }));
  }, [allowedTypes, t]);

  const allTypesLabel = t('assetCenter.typeLabels.all', 'All Types');

  const typeLabelById = useMemo(() => {
    const map = new Map<AssetType | 'all', string>();
    map.set('all', allTypesLabel);
    typeItems.forEach((item) => map.set(item.id, item.label));
    return map;
  }, [allTypesLabel, typeItems]);

  const quickPresets = useMemo(() => {
    return QUICK_PRESETS.filter((preset) => {
      if (preset.type === 'all') {
        return true;
      }
      if (!allowedTypes || allowedTypes.length === 0) {
        return true;
      }
      return allowedTypes.includes(preset.type);
    });
  }, [allowedTypes]);

  const hasActiveFilters = filterType !== 'all' || filterOrigin !== 'all';
  const hasPartialDataset =
    typeof pageData?.totalElements === 'number' &&
    pageData.totalElements > loadedAssets.length;

  const loadedSummary = useMemo(() => {
    if (typeof pageData?.totalElements === 'number') {
      return t('assetCenter.filters.loadedWithTotal', {
        loaded: String(loadedAssets.length),
        total: String(pageData.totalElements)
      });
    }
    return t('assetCenter.filters.loadedOnly', {
      loaded: String(loadedAssets.length)
    });
  }, [loadedAssets.length, pageData?.totalElements, t]);

  const quickPresetCountById = useMemo(() => {
    const map = new Map<string, number>();
    quickPresets.forEach((preset) => {
      let count = 0;
      loadedAssets.forEach((asset) => {
        if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(asset.type)) {
          return;
        }
        if (preset.type !== 'all' && asset.type !== preset.type) {
          return;
        }
        if (preset.origin !== 'all' && asset.origin !== preset.origin) {
          return;
        }
        count += 1;
      });
      map.set(preset.id, count);
    });
    return map;
  }, [allowedTypes, loadedAssets, quickPresets]);

  return (
    <aside className="h-full min-h-0 w-full select-none overflow-hidden p-3" style={FRAMEWORK_STYLE}>
      <div className="app-ghost-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1">
        <section className="rounded-[var(--sdk-radius-md)] border border-[var(--sdk-border)] bg-[var(--sdk-surface)] p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--sdk-text-primary)]">
                {t('assetCenter.filters.title', 'Asset Filters')}
              </h2>
              <p className="mt-1 text-[11px] text-[var(--sdk-text-muted)]">
                {t('assetCenter.filters.subtitle', 'Narrow by source and media type.')}
              </p>
              <p className="mt-1 text-[10px] text-[var(--sdk-text-muted)]">
                {loadedSummary}
                {hasPartialDataset ? ` ${t('assetCenter.filters.partialDataset', '(partial dataset)')}` : ''}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--sdk-text-secondary)] transition-colors hover:bg-[var(--sdk-surface-elevated)]"
              >
                {t('assetCenter.filters.reset', 'Reset')}
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filterOrigin !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] px-2 py-1 text-[10px] text-[var(--sdk-text-secondary)]">
                <ChevronsLeftRight size={11} />
                {resolveSourceLabel(filterOrigin, t)}
              </span>
            )}
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] px-2 py-1 text-[10px] text-[var(--sdk-text-secondary)]">
                {React.createElement(resolveTypeIcon(filterType), { size: 14 })}
                {typeLabelById.get(filterType) || filterType}
              </span>
            )}
            {!hasActiveFilters && (
              <span className="text-[10px] text-[var(--sdk-text-muted)]">
                {t('assetCenter.filters.noActive', 'No active filters')}
              </span>
            )}
          </div>
        </section>

        <section className="rounded-[var(--sdk-radius-md)] border border-[var(--sdk-border)] bg-[var(--sdk-surface)] p-2">
          <SectionHeader
            title={t('assetCenter.sections.quickPresets', 'Quick Presets')}
            expanded={sections.quick}
            onToggle={() => toggleSection('quick')}
          />
          {sections.quick && (
            <>
              <div className="grid grid-cols-1 gap-1.5">
                {quickPresets.map((preset) => {
                  const active = filterType === preset.type && filterOrigin === preset.origin;
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFilterType(preset.type);
                        setFilterOrigin(preset.origin);
                      }}
                      className={[
                        'rounded-[var(--sdk-radius-sm)] border px-2.5 py-2 text-left transition-colors',
                        active
                          ? 'border-[var(--sdk-primary)] bg-[color-mix(in_srgb,var(--sdk-primary)_14%,var(--sdk-surface))]'
                          : 'border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] hover:border-[var(--sdk-border-strong)] hover:bg-[var(--sdk-surface-elevated)]'
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-[var(--sdk-text-secondary)]">
                          <Icon size={14} />
                          <span className="truncate">{t(preset.labelKey)}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          {active && <Check size={13} className="text-[var(--sdk-primary)]" />}
                          <span className="rounded-full border border-[var(--sdk-border)] bg-[var(--sdk-surface)] px-1.5 py-0.5 text-[10px] text-[var(--sdk-text-muted)]">
                            {quickPresetCountById.get(preset.id) || 0}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--sdk-text-muted)]">
                        {t(preset.descriptionKey)}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="px-1 pt-2 text-[10px] text-[var(--sdk-text-muted)]">
                {t(
                  'assetCenter.sections.countScope',
                  'Counts reflect currently loaded results for the active search.'
                )}
              </p>
            </>
          )}
        </section>

        <section className="rounded-[var(--sdk-radius-md)] border border-[var(--sdk-border)] bg-[var(--sdk-surface)] p-2">
          <SectionHeader
            title={t('assetCenter.sections.source', 'Source')}
            expanded={sections.source}
            onToggle={() => toggleSection('source')}
          />
          {sections.source && (
            <div className="space-y-1.5">
              {SOURCE_FILTERS.map((item) => {
                const active = filterOrigin === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterOrigin(item.id)}
                    className={[
                      'w-full rounded-[var(--sdk-radius-sm)] border px-2.5 py-2 text-left transition-colors',
                      active
                        ? 'border-[var(--sdk-primary)] bg-[color-mix(in_srgb,var(--sdk-primary)_14%,var(--sdk-surface))]'
                        : 'border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] hover:border-[var(--sdk-border-strong)] hover:bg-[var(--sdk-surface-elevated)]'
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--sdk-text-secondary)]">
                        <Icon size={16} />
                        {t(item.labelKey)}
                      </span>
                      <span className="rounded-full border border-[var(--sdk-border)] bg-[var(--sdk-surface)] px-1.5 py-0.5 text-[10px] text-[var(--sdk-text-muted)]">
                        {originCounts[item.id] || 0}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--sdk-text-muted)]">{t(item.descriptionKey)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {showTypeSection && (
          <section
            className={[
              'rounded-[var(--sdk-radius-md)] border border-[var(--sdk-border)] bg-[var(--sdk-surface)] p-2',
            ].join(' ')}
          >
            <SectionHeader
              title={t('assetCenter.sections.type', 'Type')}
              expanded={sections.type}
              onToggle={() => toggleSection('type')}
            />
            {sections.type && (
              <>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={[
                      'flex w-full items-center justify-between rounded-[var(--sdk-radius-sm)] border px-2.5 py-2 transition-colors',
                      filterType === 'all'
                        ? 'border-[var(--sdk-primary)] bg-[color-mix(in_srgb,var(--sdk-primary)_14%,var(--sdk-surface))]'
                        : 'border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] hover:border-[var(--sdk-border-strong)] hover:bg-[var(--sdk-surface-elevated)]'
                    ].join(' ')}
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--sdk-text-secondary)]">
                      <LayoutGrid size={16} />
                      {allTypesLabel}
                    </span>
                    <div className="inline-flex items-center gap-1.5">
                      {filterType === 'all' && <Check size={13} className="text-[var(--sdk-primary)]" />}
                      <span className="rounded-full border border-[var(--sdk-border)] bg-[var(--sdk-surface)] px-1.5 py-0.5 text-[10px] text-[var(--sdk-text-muted)]">
                        {typeCounts.all || 0}
                      </span>
                    </div>
                  </button>

                  {typeItems.map((item) => {
                    const active = filterType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilterType(item.id)}
                        className={[
                          'flex w-full items-center justify-between rounded-[var(--sdk-radius-sm)] border px-2.5 py-2 transition-colors',
                          active
                            ? 'border-[var(--sdk-primary)] bg-[color-mix(in_srgb,var(--sdk-primary)_14%,var(--sdk-surface))]'
                            : 'border-[var(--sdk-border)] bg-[var(--sdk-surface-muted)] hover:border-[var(--sdk-border-strong)] hover:bg-[var(--sdk-surface-elevated)]'
                        ].join(' ')}
                      >
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--sdk-text-secondary)]">
                          <span
                            className={
                              active
                                ? 'text-[var(--sdk-primary)]'
                                : 'text-[var(--sdk-text-muted)]'
                            }
                          >
                            <item.Icon size={16} />
                          </span>
                          {item.label}
                        </span>
                        <div className="inline-flex items-center gap-1.5">
                          {active && <Check size={13} className="text-[var(--sdk-primary)]" />}
                          <span className="rounded-full border border-[var(--sdk-border)] bg-[var(--sdk-surface)] px-1.5 py-0.5 text-[10px] text-[var(--sdk-text-muted)]">
                            {typeCounts[item.id] || 0}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {typeItems.length === 0 && (
                  <p className="px-1 pt-2 text-[11px] text-[var(--sdk-text-muted)]">
                    {t(
                      'assetCenter.sections.typeUnavailable',
                      'No asset type is available for current domain constraints.'
                    )}
                  </p>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </aside>
  );
};
