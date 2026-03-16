import type { NormalizedState } from '../../store/types';

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
  if (!linkedSelectionEnabled) {
    return state.clips[clipId] ? new Set([clipId]) : new Set<string>();
  }

  const queue = [clipId];
  const collectedIds = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || collectedIds.has(currentId)) continue;

    const clip = state.clips[currentId];
    if (!clip) continue;

    collectedIds.add(currentId);

    if (clip.linkedClipId && !collectedIds.has(clip.linkedClipId)) {
      queue.push(clip.linkedClipId);
    }

    if (clip.linkGroupId) {
      Object.values(state.clips).forEach((candidate) => {
        if (
          candidate.linkGroupId === clip.linkGroupId &&
          !collectedIds.has(candidate.id)
        ) {
          queue.push(candidate.id);
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
  const clip = state.clips[clipId];
  if (!clip) {
    return {
      selectedClipId,
      selectedClipIds: new Set(selectedClipIds),
      selectedTrackId: null,
    };
  }

  const linkedIds = collectLinkedSelectionIds(
    clipId,
    state,
    linkedSelectionEnabled
  );

  if (!multi) {
    return {
      selectedClipId: clipId,
      selectedClipIds: linkedIds,
      selectedTrackId: clip.track.id,
    };
  }

  const nextSelectedClipIds = new Set(selectedClipIds);
  const shouldRemove = Array.from(linkedIds).every((id) => nextSelectedClipIds.has(id));

  if (shouldRemove) {
    linkedIds.forEach((id) => nextSelectedClipIds.delete(id));
  } else {
    linkedIds.forEach((id) => nextSelectedClipIds.add(id));
  }

  let nextPrimaryClipId = selectedClipId;
  if (shouldRemove) {
    if (selectedClipId && linkedIds.has(selectedClipId)) {
      nextPrimaryClipId = null;
      for (const candidateId of nextSelectedClipIds) {
        nextPrimaryClipId = candidateId;
      }
    }
  } else {
    nextPrimaryClipId = clipId;
  }

  return {
    selectedClipId: nextPrimaryClipId,
    selectedClipIds: nextSelectedClipIds,
    selectedTrackId: clip.track.id,
  };
};
