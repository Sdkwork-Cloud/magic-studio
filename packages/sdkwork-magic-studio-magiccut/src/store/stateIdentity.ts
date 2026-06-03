import {
  entityKeysEqual,
  resolveEntityKey,
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';
import {
  findMagicCutEntityByKey,
  findMagicCutEntityByRef,
  resolveMagicCutRecordKey,
} from '@sdkwork/magic-studio-types/magiccut';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';

import type {
  CutClip,
  CutTimeline,
  CutTrack,
} from '../entities/magicCut.entity';
import type { NormalizedState } from './types';

export const resolveMagicCutTimelineRecordKey = (
  state: Pick<NormalizedState, 'timelines'>,
  key: string | null | undefined
): string | null => resolveMagicCutRecordKey(state.timelines, key);

export const resolveMagicCutTrackRecordKey = (
  state: Pick<NormalizedState, 'tracks'>,
  key: string | null | undefined
): string | null => resolveMagicCutRecordKey(state.tracks, key);

export const resolveMagicCutClipRecordKey = (
  state: Pick<NormalizedState, 'clips'>,
  key: string | null | undefined
): string | null => resolveMagicCutRecordKey(state.clips, key);

export const resolveMagicCutResourceRecordKey = (
  state: Pick<NormalizedState, 'resources'>,
  key: string | null | undefined
): string | null => resolveMagicCutRecordKey(state.resources, key);

export const findMagicCutTimelineByKey = (
  state: Pick<NormalizedState, 'timelines'>,
  key: string | null | undefined
): CutTimeline | null => findMagicCutEntityByKey(state.timelines, key);

export const findMagicCutTrackByKey = (
  state: Pick<NormalizedState, 'tracks'>,
  key: string | null | undefined
): CutTrack | null => findMagicCutEntityByKey(state.tracks, key);

export const findMagicCutTrackByRef = (
  state: Pick<NormalizedState, 'tracks'>,
  ref: EntityIdentityLike | null | undefined
): CutTrack | null => findMagicCutEntityByRef(state.tracks, ref);

export const findMagicCutClipByKey = (
  state: Pick<NormalizedState, 'clips'>,
  key: string | null | undefined
): CutClip | null => findMagicCutEntityByKey(state.clips, key);

export const findMagicCutClipByRef = (
  state: Pick<NormalizedState, 'clips'>,
  ref: EntityIdentityLike | null | undefined
): CutClip | null => findMagicCutEntityByRef(state.clips, ref);

export const findMagicCutResourceByKey = (
  state: Pick<NormalizedState, 'resources'>,
  key: string | null | undefined
): AnyMediaResource | null => findMagicCutEntityByKey(state.resources, key);

export const findMagicCutResourceByRef = (
  state: Pick<NormalizedState, 'resources'>,
  ref: EntityIdentityLike | null | undefined
): AnyMediaResource | null => findMagicCutEntityByRef(state.resources, ref);

export const findMagicCutClipResourceByKey = (
  state: Pick<NormalizedState, 'clips' | 'resources'>,
  clipKey: string | null | undefined
): AnyMediaResource | null => {
  const clip = findMagicCutClipByKey(state, clipKey);
  return clip ? findMagicCutResourceByRef(state, clip.resource) : null;
};

export const findMagicCutTimelineByTrackRef = (
  state: Pick<NormalizedState, 'timelines'>,
  trackRef: EntityIdentityLike | null | undefined
): CutTimeline | null => (
  Object.values(state.timelines).find((timeline) => (
    timeline.tracks.some((timelineTrackRef) => entityKeysEqual(timelineTrackRef, trackRef))
  )) || null
);

export const resolveMagicCutCanonicalClipKey = (
  state: Pick<NormalizedState, 'clips'>,
  clipKey: string | null | undefined
): string | null => {
  const clip = findMagicCutClipByKey(state, clipKey);
  return clip ? resolveEntityKey(clip) : null;
};

export const resolveMagicCutCanonicalTrackKey = (
  state: Pick<NormalizedState, 'tracks'>,
  trackKey: string | null | undefined
): string | null => {
  const track = findMagicCutTrackByKey(state, trackKey);
  return track ? resolveEntityKey(track) : null;
};
