import type { AnyMediaResource, MediaResourceType } from '@sdkwork/react-commons';

import type { CutClip, CutTrack } from '../../entities';
import { findEffectTargetClip, findTransitionTarget } from '../effects/effectPlacement';

export type ResourceDropPreview =
  | {
      kind: 'effect';
      clipId: string;
      trackId: string;
      start: number;
      end: number;
    }
  | {
      kind: 'transition';
      fromClipId: string;
      toClipId: string;
      trackId: string;
      boundaryTime: number;
    };

interface ResolveResourceDropPreviewOptions {
  resourceType: MediaResourceType;
  time: number;
  preferredTrackId?: string | null;
  tracks: CutTrack[];
  clips: Record<string, CutClip>;
  resources: Record<string, AnyMediaResource>;
}

export const resolveResourceDropPreview = ({
  resourceType,
  time,
  preferredTrackId,
  tracks,
  clips,
  resources,
}: ResolveResourceDropPreviewOptions): ResourceDropPreview | null => {
  if (resourceType === 'EFFECT') {
    const clipId = findEffectTargetClip({
      time,
      preferredTrackId,
      tracks,
      clips,
      resources,
    });

    if (!clipId) {
      return null;
    }

    const clip = clips[clipId];
    if (!clip) {
      return null;
    }

    return {
      kind: 'effect',
      clipId,
      trackId: clip.track.id,
      start: clip.start,
      end: clip.start + clip.duration,
    };
  }

  if (resourceType === 'TRANSITION') {
    const transitionTarget = findTransitionTarget({
      time,
      preferredTrackId,
      tracks,
      clips,
      resources,
    });

    if (!transitionTarget) {
      return null;
    }

    const fromClip = clips[transitionTarget.fromClipId];
    if (!fromClip) {
      return null;
    }

    return {
      kind: 'transition',
      fromClipId: transitionTarget.fromClipId,
      toClipId: transitionTarget.toClipId,
      trackId: fromClip.track.id,
      boundaryTime: fromClip.start + fromClip.duration,
    };
  }

  return null;
};
