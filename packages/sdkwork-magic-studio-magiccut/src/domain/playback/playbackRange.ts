export interface PlaybackRange {
  inPoint: number | null;
  outPoint: number | null;
}

const clampTime = (time: number, duration: number): number =>
  Math.max(0, Math.min(time, duration));

const clampOptionalTime = (time: number | null, duration: number): number | null =>
  typeof time === 'number' ? clampTime(time, duration) : null;

export const setPlaybackInPoint = (
  currentRange: PlaybackRange,
  nextInPoint: number,
  duration: number
): PlaybackRange => {
  const inPoint = clampTime(nextInPoint, duration);
  const outPoint = clampOptionalTime(currentRange.outPoint, duration);

  if (outPoint !== null && outPoint <= inPoint) {
    return { inPoint, outPoint: null };
  }

  return { inPoint, outPoint };
};

export const setPlaybackOutPoint = (
  currentRange: PlaybackRange,
  nextOutPoint: number,
  duration: number
): PlaybackRange => {
  const outPoint = clampTime(nextOutPoint, duration);
  const inPoint = clampOptionalTime(currentRange.inPoint, duration);

  if (inPoint !== null && outPoint <= inPoint) {
    return { inPoint: null, outPoint };
  }

  return { inPoint, outPoint };
};

export const clampTimeToPlaybackRange = (
  time: number,
  range: PlaybackRange,
  duration: number
): number => {
  const clampedTime = clampTime(time, duration);
  const inPoint = clampOptionalTime(range.inPoint, duration);
  const outPoint = clampOptionalTime(range.outPoint, duration);

  if (inPoint !== null && clampedTime < inPoint) {
    return inPoint;
  }

  if (outPoint !== null && clampedTime > outPoint) {
    return outPoint;
  }

  return clampedTime;
};
