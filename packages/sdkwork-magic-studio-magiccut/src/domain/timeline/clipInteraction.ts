import { EditTool, InteractionType } from '../../store/types';

export type ClipPointerZone = 'body' | 'start-edge' | 'end-edge';

export const resolveClipToolInteraction = ({
  tool,
  zone,
}: {
  tool: EditTool;
  zone: ClipPointerZone;
}): InteractionType | null => {
  if (tool === 'razor') {
    return zone === 'body' ? 'razor-cut' : null;
  }

  if (tool === 'slip') {
    return zone === 'body' ? 'slip-trim' : null;
  }

  if (tool === 'ripple') {
    return zone === 'body' ? null : 'ripple-trim';
  }

  if (tool === 'roll') {
    return zone === 'body' ? null : 'roll-trim';
  }

  if (tool === 'slide') {
    return 'slide-trim';
  }

  if (tool === 'trim') {
    if (zone === 'start-edge') return 'trim-start';
    if (zone === 'end-edge') return 'trim-end';
    return null;
  }

  if (zone === 'body') {
    return 'move';
  }

  return zone === 'start-edge' ? 'trim-start' : 'trim-end';
};
