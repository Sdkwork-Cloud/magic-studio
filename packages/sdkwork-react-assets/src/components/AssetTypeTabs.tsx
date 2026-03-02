import React, { useMemo } from 'react';
import type { AssetType } from '../entities';
import { useTranslation } from '@sdkwork/react-i18n';
import { ASSET_CENTER_CATEGORIES } from '../asset-center';
import { resolveTypeIcon, resolveTypeLabel } from './sidebar/assetSidebarConfig';

export interface AssetTypeTabsProps {
  filterType: AssetType | 'all';
  typeCounts: Partial<Record<AssetType | 'all', number>>;
  allowedTypes?: AssetType[];
  onChangeType: (type: AssetType | 'all') => void;
}

export const AssetTypeTabs: React.FC<AssetTypeTabsProps> = ({
  filterType,
  typeCounts,
  allowedTypes,
  onChangeType
}) => {
  const { t } = useTranslation();

  const typeItems = useMemo(() => {
    return ASSET_CENTER_CATEGORIES.filter((category) => {
      if (!allowedTypes || allowedTypes.length === 0) {
        return true;
      }
      return allowedTypes.includes(category.id);
    }).map((category) => ({
      id: category.id,
      label: resolveTypeLabel(category.id, t, category.label),
      Icon: resolveTypeIcon(category.id)
    }));
  }, [allowedTypes, t]);

  const allLabel = t('assetCenter.typeLabels.all', 'All Types');

  return (
    <div className="border-b border-[#27272a] bg-[#131316]">
      <div className="overflow-x-auto px-4 py-2 sm:px-6">
        <div className="flex min-w-max items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeType('all')}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              filterType === 'all'
                ? 'border-blue-400/50 bg-blue-500/20 text-blue-100'
                : 'border-[#34343a] bg-[#1f1f23] text-gray-300 hover:bg-[#2a2a2f] hover:text-gray-100'
            ].join(' ')}
          >
            <span>{allLabel}</span>
            <span className="rounded-full border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] font-mono">
              {typeCounts.all || 0}
            </span>
          </button>

          {typeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeType(item.id)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                filterType === item.id
                  ? 'border-blue-400/50 bg-blue-500/20 text-blue-100'
                  : 'border-[#34343a] bg-[#1f1f23] text-gray-300 hover:bg-[#2a2a2f] hover:text-gray-100'
              ].join(' ')}
            >
              <item.Icon size={14} />
              <span>{item.label}</span>
              <span className="rounded-full border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] font-mono">
                {typeCounts[item.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

