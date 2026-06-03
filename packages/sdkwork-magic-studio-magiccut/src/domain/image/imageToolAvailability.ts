export type ImageToolId = 'remove-bg' | 'upscale' | 'erase' | 'remix';

export interface ImageToolAvailability {
  id: ImageToolId;
  label: string;
  available: boolean;
  reason: string;
}

export function resolveImageToolAvailability(): ImageToolAvailability[] {
  return [
    {
      id: 'remove-bg',
      label: 'Remove BG',
      available: false,
      reason: 'Background matting must run in the asset workflow before the result is brought back onto the timeline.',
    },
    {
      id: 'upscale',
      label: 'Upscale 4K',
      available: false,
      reason: '4K upscaling exists as an asset operation, not as a destructive in-timeline image rewrite.',
    },
    {
      id: 'erase',
      label: 'Magic Eraser',
      available: false,
      reason: 'Object removal needs mask authoring, and the current image panel does not expose a mask surface.',
    },
    {
      id: 'remix',
      label: 'Remix',
      available: false,
      reason: 'Remix needs a separate generation session and asset handoff outside the timeline editor.',
    },
  ];
}
