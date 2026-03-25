export const getProtectedAssetDeleteMessage = (
  origin?: string | null,
  translate?: (origin: 'system' | 'stock') => string
): string | null => {
  if (origin === 'system') {
    return translate ? translate('system') : 'System assets are read-only and cannot be deleted.';
  }

  if (origin === 'stock') {
    return translate ? translate('stock') : 'Stock assets are read-only and cannot be deleted.';
  }

  return null;
};
