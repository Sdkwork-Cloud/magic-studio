interface MeterClipLike {
  start: number;
  duration: number;
  volume?: number | null;
}

interface TrackMeterInput {
  masterLevel: number;
  isPlaying: boolean;
  currentTime: number;
  trackVolume: number;
  isMuted: boolean;
  clips: MeterClipLike[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function buildTrackMeterLevel(input: TrackMeterInput): number {
  if (!input.isPlaying || input.isMuted) return 0;

  const activeClips = input.clips.filter((clip) => {
    if (!Number.isFinite(clip.start) || !Number.isFinite(clip.duration) || clip.duration <= 0) {
      return false;
    }

    return input.currentTime >= clip.start && input.currentTime < clip.start + clip.duration;
  });

  if (activeClips.length === 0) return 0;

  const averageClipGain =
    activeClips.reduce((sum, clip) => sum + clamp(clip.volume ?? 1, 0, 2), 0) / activeClips.length;
  const normalizedGain = clamp((clamp(input.trackVolume, 0, 2) * averageClipGain) / 2, 0, 1);
  const densityWeight = clamp(0.55 + (activeClips.length - 1) * 0.15, 0.55, 1);

  return Number((clamp(input.masterLevel, 0, 1) * normalizedGain * densityWeight).toFixed(4));
}

export function buildMasterMeterBars(masterLevel: number, count: number): number[] {
  const resolvedCount = Math.max(0, Math.floor(count));
  const clampedLevel = clamp(masterLevel, 0, 1);

  if (resolvedCount === 0) return [];
  if (clampedLevel === 0) return Array.from({ length: resolvedCount }, () => 0);

  return Array.from({ length: resolvedCount }, (_, index) => {
    const progress = resolvedCount === 1 ? 1 : index / (resolvedCount - 1);
    const shapedLevel = clampedLevel * (0.35 + progress * 0.65) + index * 0.03;
    return Number(clamp(shapedLevel, 0, 1).toFixed(4));
  });
}
