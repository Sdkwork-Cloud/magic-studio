import type { CutClip } from '../../entities/magicCut.entity';
import type { NormalizedState } from '../../store/types';

export interface LinkedClipMove {
  clipId: string;
  targetTrackId: string;
  newStart: number;
}

export interface LinkedMovePlan {
  moves: LinkedClipMove[];
  primaryStart: number;
  hasCollision: boolean;
  excludeIds: Set<string>;
}

export interface ResolveLinkedMovePlanOptions {
  state: NormalizedState;
  primaryClipId: string;
  targetTrackId: string;
  newStart: number;
  linkedSelectionEnabled?: boolean;
  skipCollisionForClipIds?: Set<string>;
  checkCollision?: (
    trackId: string,
    start: number,
    duration: number,
    exclude: Set<string>
  ) => boolean;
}

const collectLinkedClipIds = (
  primaryClipId: string,
  state: NormalizedState,
  linkedSelectionEnabled: boolean
): string[] => {
  if (!linkedSelectionEnabled) {
    return state.clips[primaryClipId] ? [primaryClipId] : [];
  }

  const queue = [primaryClipId];
  const collectedIds = new Set<string>();

  while (queue.length > 0) {
    const clipId = queue.shift();
    if (!clipId || collectedIds.has(clipId)) continue;

    const clip = state.clips[clipId];
    if (!clip) continue;

    collectedIds.add(clipId);

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

  return Array.from(collectedIds);
};

const hasInternalOverlap = (
  moves: LinkedClipMove[],
  clipsById: Record<string, CutClip>
): boolean => {
  const movesByTrack = new Map<string, LinkedClipMove[]>();

  moves.forEach((move) => {
    const trackMoves = movesByTrack.get(move.targetTrackId) || [];
    trackMoves.push(move);
    movesByTrack.set(move.targetTrackId, trackMoves);
  });

  for (const trackMoves of movesByTrack.values()) {
    const sortedMoves = [...trackMoves].sort((left, right) => {
      if (Math.abs(left.newStart - right.newStart) > 0.0001) {
        return left.newStart - right.newStart;
      }
      return left.clipId.localeCompare(right.clipId);
    });

    for (let index = 1; index < sortedMoves.length; index += 1) {
      const previous = sortedMoves[index - 1];
      const current = sortedMoves[index];
      const previousClip = clipsById[previous.clipId];
      const currentClip = clipsById[current.clipId];

      if (!previousClip || !currentClip) continue;
      const previousEnd = previous.newStart + previousClip.duration;
      if (current.newStart < previousEnd - 0.001) {
        return true;
      }
    }
  }

  return false;
};

export const resolveLinkedClipMovePlan = ({
  state,
  primaryClipId,
  targetTrackId,
  newStart,
  linkedSelectionEnabled = true,
  skipCollisionForClipIds,
  checkCollision,
}: ResolveLinkedMovePlanOptions): LinkedMovePlan => {
  const primaryClip = state.clips[primaryClipId];
  if (!primaryClip) {
    return {
      moves: [],
      primaryStart: Math.max(0, newStart),
      hasCollision: false,
      excludeIds: new Set<string>(),
    };
  }

  const movementGroupIds = collectLinkedClipIds(
    primaryClipId,
    state,
    linkedSelectionEnabled
  );
  const movementClips = movementGroupIds
    .map((clipId) => state.clips[clipId])
    .filter((clip): clip is CutClip => !!clip);

  const maxAllowedLeftDelta = -Math.min(
    ...movementClips.map((clip) => clip.start)
  );
  const requestedDelta = Math.max(0, newStart) - primaryClip.start;
  const boundedDelta = Math.max(requestedDelta, maxAllowedLeftDelta);
  const primaryStart = Math.max(0, primaryClip.start + boundedDelta);

  const moves = movementClips
    .map((clip) => ({
      clipId: clip.id,
      targetTrackId: clip.id === primaryClipId ? targetTrackId : clip.track.id,
      newStart: Math.max(0, clip.start + boundedDelta),
    }))
    .sort((left, right) => {
      if (left.clipId === primaryClipId) return -1;
      if (right.clipId === primaryClipId) return 1;
      return left.clipId.localeCompare(right.clipId);
    });

  const excludeIds = new Set(movementGroupIds);

  const hasExternalCollision =
    typeof checkCollision === 'function' &&
    moves.some((move) => {
      if (skipCollisionForClipIds?.has(move.clipId)) {
        return false;
      }

      const clip = state.clips[move.clipId];
      if (!clip) return false;

      return checkCollision(
        move.targetTrackId,
        move.newStart,
        clip.duration,
        excludeIds
      );
    });

  return {
    moves,
    primaryStart,
    hasCollision: hasInternalOverlap(moves, state.clips) || !!hasExternalCollision,
    excludeIds,
  };
};
