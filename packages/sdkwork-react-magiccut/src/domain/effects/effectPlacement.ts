import { AnyMediaResource, MediaResourceType } from '@sdkwork/react-commons';

import { CutClip, CutTrack } from '../../entities';

interface PlacementContext {
  time: number;
  preferredTrackId?: string | null;
  tracks: CutTrack[];
  clips: Record<string, CutClip>;
  resources: Record<string, AnyMediaResource>;
}

interface TransitionPlacementContext extends PlacementContext {
  tolerance?: number;
}

const EFFECT_COMPATIBLE_TYPES = new Set<MediaResourceType>([
  MediaResourceType.VIDEO,
  MediaResourceType.IMAGE,
  MediaResourceType.TEXT,
  MediaResourceType.SUBTITLE,
  MediaResourceType.CHARACTER,
  MediaResourceType.LOTTIE,
  MediaResourceType.MODEL_3D,
]);

const TRANSITION_COMPATIBLE_TYPES = new Set<MediaResourceType>([
  MediaResourceType.VIDEO,
  MediaResourceType.IMAGE,
  MediaResourceType.CHARACTER,
  MediaResourceType.LOTTIE,
]);

const isTrackAvailable = (track: CutTrack | undefined): track is CutTrack =>
  !!track && track.visible !== false && !track.locked;

const isCompatibleClip = (
  clip: CutClip | undefined,
  resources: Record<string, AnyMediaResource>,
  compatibleTypes: Set<MediaResourceType>
): clip is CutClip => {
  if (!clip) return false;
  const resource = resources[clip.resource.id];
  return !!resource && compatibleTypes.has(resource.type);
};

const getTrackSearchOrder = (
  tracks: CutTrack[],
  preferredTrackId?: string | null
): CutTrack[] => {
  if (!preferredTrackId) {
    return [...tracks];
  }

  const preferred = tracks.find((track) => track.id === preferredTrackId);
  if (!preferred) {
    return [...tracks];
  }

  return [preferred, ...tracks.filter((track) => track.id !== preferredTrackId)];
};

export const findEffectTargetClip = ({
  time,
  preferredTrackId,
  tracks,
  clips,
  resources,
}: PlacementContext): string | null => {
  for (const track of getTrackSearchOrder(tracks, preferredTrackId)) {
    if (!isTrackAvailable(track)) continue;

    const matchedClip = track.clips
      .map((ref) => clips[ref.id])
      .find((clip) => isCompatibleClip(clip, resources, EFFECT_COMPATIBLE_TYPES)
        && time >= clip.start
        && time <= clip.start + clip.duration);

    if (matchedClip) {
      return matchedClip.id;
    }
  }

  return null;
};

export const findTransitionTarget = ({
  time,
  preferredTrackId,
  tracks,
  clips,
  resources,
  tolerance = 0.08,
}: TransitionPlacementContext): { fromClipId: string; toClipId: string } | null => {
  for (const track of getTrackSearchOrder(tracks, preferredTrackId)) {
    if (!isTrackAvailable(track)) continue;

    const orderedClips = track.clips
      .map((ref) => clips[ref.id])
      .filter((clip): clip is CutClip => isCompatibleClip(clip, resources, TRANSITION_COMPATIBLE_TYPES))
      .sort((a, b) => a.start - b.start);

    for (let index = 0; index < orderedClips.length - 1; index += 1) {
      const currentClip = orderedClips[index];
      const nextClip = orderedClips[index + 1];
      const currentEnd = currentClip.start + currentClip.duration;
      const boundaryDelta = Math.abs(nextClip.start - currentEnd);
      const pointerDelta = Math.abs(time - currentEnd);

      if (boundaryDelta <= tolerance && pointerDelta <= tolerance) {
        return {
          fromClipId: currentClip.id,
          toClipId: nextClip.id,
        };
      }
    }
  }

  return null;
};
