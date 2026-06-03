export const findByIdOrFirst = <T extends { id: string }>(
  items: readonly T[] | null | undefined,
  id?: string | null,
): T | null => {
  if (!items || items.length === 0) {
    return null;
  }

  if (typeof id === 'string' && id.length > 0) {
    const matched = items.find((item) => item.id === id);
    if (matched) {
      return matched;
    }
  }

  return items[0] ?? null;
};
