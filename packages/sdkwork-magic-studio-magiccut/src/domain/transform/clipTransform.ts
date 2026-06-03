import type { CutClipTransform } from '../../entities/magicCut.entity';

export interface NormalizedClipTransform extends CutClipTransform {
  scaleX: number;
  scaleY: number;
}

const DEFAULT_TRANSFORM: NormalizedClipTransform = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
};

export function normalizeClipTransform(
  transform?: Partial<CutClipTransform> | null
): NormalizedClipTransform {
  return {
    ...DEFAULT_TRANSFORM,
    ...transform,
    scale: transform?.scale ?? DEFAULT_TRANSFORM.scale,
    scaleX: transform?.scaleX ?? DEFAULT_TRANSFORM.scaleX,
    scaleY: transform?.scaleY ?? DEFAULT_TRANSFORM.scaleY,
    opacity: transform?.opacity ?? DEFAULT_TRANSFORM.opacity,
  };
}

export function toggleClipTransformFlip(
  transform: Partial<CutClipTransform> | null | undefined,
  axis: 'horizontal' | 'vertical'
): NormalizedClipTransform {
  const normalized = normalizeClipTransform(transform);

  return axis === 'horizontal'
    ? { ...normalized, scaleX: normalized.scaleX * -1 }
    : { ...normalized, scaleY: normalized.scaleY * -1 };
}

export function resolveClipTransformScaleFactors(
  transform: Partial<CutClipTransform> | null | undefined
) {
  const normalized = normalizeClipTransform(transform);
  const effectiveScaleX = normalized.scale * normalized.scaleX;
  const effectiveScaleY = normalized.scale * normalized.scaleY;

  return {
    scaleX: normalized.scaleX,
    scaleY: normalized.scaleY,
    effectiveScaleX,
    effectiveScaleY,
    maxAbsScale: Math.max(Math.abs(effectiveScaleX), Math.abs(effectiveScaleY)),
  };
}
