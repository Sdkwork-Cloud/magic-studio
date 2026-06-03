import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

import type { NormalizedState } from '../../store/types';
import {
  findMagicCutClipByKey,
  findMagicCutTrackByRef,
  resolveMagicCutCanonicalClipKey,
} from '../../store/stateIdentity';

export interface ResolveLinkedSelectionStateOptions {
  clipId: string;
  state: NormalizedState;
  linkedSelectionEnabled?: boolean;
  multi?: boolean;
  selectedClipId: string | null;
  selectedClipIds: Set<string>;
}

export interface LinkedSelectionStateResult {
  selectedClipId: string | null;
  selectedClipIds: Set<string>;
  selectedTrackId: string | null;
}

const collectLinkedSelectionIds = (
  clipId: string,
  state: NormalizedState,
  linkedSelectionEnabled: boolean
): Set<string> => {
  const startingClip = findMagicCutClipByKey(state, clipId);
  if (!startingClip) {
    return new Set<string>();
  }

  const startingClipKey = resolveEntityKey(startingClip);

  if (!linkedSelectionEnabled) {
    return new Set([startingClipKey]);
  }

  const queue = [startingClipKey];
  const collectedIds = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || collectedIds.has(currentId)) continue;

    const clip = findMagicCutClipByKey(state, currentId);
    if (!clip) continue;

    const canonicalClipKey = resolveEntityKey(clip);
    collectedIds.add(canonicalClipKey);

    if (clip.linkedClipId) {
      const linkedClipKey = resolveMagicCutCanonicalClipKey(state, clip.linkedClipId);
      if (linkedClipKey && !collectedIds.has(linkedClipKey)) {
        queue.push(linkedClipKey);
      }
    }

    if (clip.linkGroupId) {
      Object.values(state.clips).forEach((candidate) => {
        const candidateKey = resolveEntityKey(candidate);
        if (
          candidate.linkGroupId === clip.linkGroupId &&
          !collectedIds.has(candidateKey)
        ) {
          queue.push(candidateKey);
        }
      });
    }
  }

  return collectedIds;
};

export const resolveLinkedSelectionState = ({
  clipId,
  state,
  linkedSelectionEnabled = true,
  multi = false,
  selectedClipId,
  selectedClipIds,
}: ResolveLinkedSelectionStateOptions): LinkedSelectionStateResult => {
  const canonicalSelectedClipId = selectedClipId
    ? resolveMagicCutCanonicalClipKey(state, selectedClipId)
    : null;
  const canonicalSelectedClipIds = new Set<string>(
    Array.from(selectedClipIds)
      .map((selectedId) => resolveMagicCutCanonicalClipKey(state, selectedId))
      .filter((selectedId): selectedId is string => Boolean(selectedId))
  );
  const clip = findMagicCutClipByKey(state, clipId);
  if (!clip) {
    return {
      selectedClipId: canonicalSelectedClipId,
      selectedClipIds: canonicalSelectedClipIds,
      selectedTrackId: null,
    };
  }

  const canonicalClipKey = resolveEntityKey(clip);
  const canonicalTrackKey = findMagicCutTrackByRef(state, clip.track)
    ? resolveEntityKey(findMagicCutTrackByRef(state, clip.track)!)
    : (clip.track.uuid || clip.track.id);
  const linkedIds = collectLinkedSelectionIds(
    canonicalClipKey,
    state,
    linkedSelectionEnabled
  );

  if (!multi) {
    return {
      selectedClipId: canonicalClipKey,
      selectedClipIds: linkedIds,
      selectedTrackId: canonicalTrackKey,
    };
  }

  const nextSelectedClipIds = new Set(canonicalSelectedClipIds);
  const shouldRemove = Array.from(linkedIds).every((id) => nextSelectedClipIds.has(id));

  if (shouldRemove) {
    linkedIds.forEach((id) => nextSelectedClipIds.delete(id));
  } else {
    linkedIds.forEach((id) => nextSelectedClipIds.add(id));
  }

  let nextPrimaryClipId = canonicalSelectedClipId;
  if (shouldRemove) {
    if (canonicalSelectedClipId && linkedIds.has(canonicalSelectedClipId)) {
      nextPrimaryClipId = null;
      for (const candidateId of nextSelectedClipIds) {
        nextPrimaryClipId = candidateId;
      }
    }
  } else {
    nextPrimaryClipId = canonicalClipKey;
  }

  return {
    selectedClipId: nextPrimaryClipId,
    selectedClipIds: nextSelectedClipIds,
    selectedTrackId: canonicalTrackKey,
  };
};
