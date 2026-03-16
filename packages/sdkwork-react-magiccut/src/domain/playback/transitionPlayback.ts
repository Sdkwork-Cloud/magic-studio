import type { CutClip, CutLayer, CutTrack } from '../../entities/magicCut.entity';

export interface TransitionLeadInArgs {
  track: CutTrack;
  clips: Record<string, CutClip>;
  layers: Record<string, CutLayer>;
}

export function buildIncomingTransitionLeadIns({
  track,
  clips,
  layers,
}: TransitionLeadInArgs): Map<string, number> {
  const leadIns = new Map<string, number>();

  for (const clipRef of track.clips) {
    const clip = clips[clipRef.id];
    if (!clip) {
      continue;
    }

    for (const layerRef of clip.layers || []) {
      const layer = layers[layerRef.id];
      if (!layer || !layer.enabled) {
        continue;
      }
      if (layer.layerType !== 'transition' && layer.layerType !== 'transition_out') {
        continue;
      }

      const nextClipId =
        typeof layer.params.nextClipId === 'string' ? layer.params.nextClipId : undefined;
      if (!nextClipId) {
        continue;
      }

      const duration = Math.max(0, Number(layer.params.duration || 0));
      if (duration <= 0) {
        continue;
      }

      const current = leadIns.get(nextClipId) ?? 0;
      if (duration > current) {
        leadIns.set(nextClipId, duration);
      }
    }
  }

  return leadIns;
}

export function resolveClipActivationStart({
  clipStart,
  incomingTransitionLeadIn = 0,
  defaultLookahead = 0.5,
}: {
  clipStart: number;
  incomingTransitionLeadIn?: number;
  defaultLookahead?: number;
}) {
  return clipStart - Math.max(0, defaultLookahead, incomingTransitionLeadIn);
}

export function clampTimelineTimeToClipStart(timelineTime: number, clipStart: number) {
  return Math.max(timelineTime, clipStart);
}
