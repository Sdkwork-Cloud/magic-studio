import React, { useEffect } from 'react';
import { useTranslation } from '@sdkwork/react-i18n';

export interface AssetFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AssetFilterDrawer: React.FC<AssetFilterDrawerProps> = ({
  open,
  onClose,
  children
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={t('common.actions.close', 'Close')}
      />
      <div className="absolute right-0 top-0 h-full w-[88vw] max-w-[320px] border-l border-[#27272a] bg-[#111]">
        <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-3">
          <span className="text-sm font-semibold text-gray-100">
            {t('assetCenter.filters.title', 'Asset Filters')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#333] bg-[#222225] px-2 py-1 text-xs text-gray-300"
          >
            {t('common.actions.close', 'Close')}
          </button>
        </div>
        <div className="h-[calc(100%-49px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

