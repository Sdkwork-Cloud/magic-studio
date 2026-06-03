export function buildDeterministicBarHeights(
  assetId: string,
  count: number,
  minHeight: number,
  maxHeight: number
): number[] {
  const resolvedCount = Math.max(0, Math.floor(count));
  const lowerBound = Math.min(minHeight, maxHeight);
  const upperBound = Math.max(minHeight, maxHeight);
  const range = upperBound - lowerBound;

  if (resolvedCount === 0) return [];
  if (range === 0) return Array.from({ length: resolvedCount }, () => lowerBound);

  let seed = 0;
  for (let index = 0; index < assetId.length; index += 1) {
    seed = (seed * 31 + assetId.charCodeAt(index)) >>> 0;
  }

  return Array.from({ length: resolvedCount }, (_, index) => {
    seed = (seed * 1664525 + 1013904223 + index) >>> 0;
    const normalized = seed / 0xffffffff;
    return Number((lowerBound + normalized * range).toFixed(4));
  });
}
