export const getProtectedAssetDeleteMessage = (origin?: string | null): string | null => {
  if (origin === 'system') {
    return 'System assets are read-only and cannot be deleted.';
  }

  if (origin === 'stock') {
    return 'Stock assets are read-only and cannot be deleted.';
  }

  return null;
};
