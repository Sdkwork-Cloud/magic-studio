import type { CutClip } from '../../entities/magicCut.entity';
import type { LinkedClipMove } from './linkedMove';
import type { InteractionState } from '../../store/types';

export interface LinkedGhostPreview {
  clipId: string;
  targetTrackId: string;
  left: number;
  top: number;
  trackHeight: number;
}

export interface BuildLinkedGhostPreviewsOptions {
  interaction: InteractionState;
  clipsMap: Record<string, CutClip>;
  trackLayouts: { id: string; top: number; height: number }[];
  pixelsPerSecond: number;
}

export const buildLinkedGhostPreviews = ({
  interaction,
  clipsMap,
  trackLayouts,
  pixelsPerSecond,
}: BuildLinkedGhostPreviewsOptions): LinkedGhostPreview[] => {
  if (interaction.type !== 'move' || !interaction.clipId || !interaction.linkedMoves) {
    return [];
  }

  return interaction.linkedMoves
    .filter((move: LinkedClipMove) => move.clipId !== interaction.clipId)
    .map((move: LinkedClipMove) => {
      const clip = clipsMap[move.clipId];
      const layout = trackLayouts.find((candidate) => candidate.id === move.targetTrackId);
      if (!clip || !layout) return null;

      return {
        clipId: move.clipId,
        targetTrackId: move.targetTrackId,
        left: Math.round(move.newStart * pixelsPerSecond),
        top: layout.top,
        trackHeight: layout.height,
      };
    })
    .filter((preview): preview is LinkedGhostPreview => !!preview);
};
