import { useEffect } from 'react';
import type { RefObject } from 'react';

export interface UseAssetCenterShortcutsOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  hasActiveCriteria: boolean;
  onClearAllCriteria: () => void;
}

export const useAssetCenterShortcuts = ({
  searchInputRef,
  hasActiveCriteria,
  onClearAllCriteria
}: UseAssetCenterShortcutsOptions): void => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isInputTarget = !!target && (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      );

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isInputTarget
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (
        event.key === 'Escape' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isInputTarget &&
        hasActiveCriteria
      ) {
        event.preventDefault();
        onClearAllCriteria();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasActiveCriteria, onClearAllCriteria, searchInputRef]);
};
