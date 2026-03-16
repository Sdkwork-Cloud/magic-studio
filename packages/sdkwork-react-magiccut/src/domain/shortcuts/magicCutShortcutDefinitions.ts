import type { ShortcutDefinition } from '../../utils/shortcutManager';
import { MagicCutEvents } from '../../events';
import type { EditTool } from '../../store/types';

export type MagicCutShortcutId =
  | 'play-pause'
  | 'play-forward'
  | 'play-backward'
  | 'pause-playback'
  | 'step-forward'
  | 'step-backward'
  | 'jump-start'
  | 'jump-end'
  | 'select-all'
  | 'deselect-all'
  | 'delete'
  | 'ripple-delete'
  | 'copy'
  | 'paste'
  | 'paste-insert'
  | 'undo'
  | 'redo'
  | 'split'
  | 'nudge-left'
  | 'nudge-right'
  | 'nudge-left-big'
  | 'nudge-right-big'
  | 'set-in-point'
  | 'set-out-point'
  | 'clear-in-out'
  | 'trim-start-to-playhead'
  | 'trim-end-to-playhead'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-fit'
  | 'toggle-snapping'
  | 'toggle-skimming'
  | 'toggle-linked-selection'
  | 'tool-select'
  | 'tool-trim'
  | 'tool-ripple'
  | 'tool-roll'
  | 'tool-slip'
  | 'tool-slide'
  | 'tool-razor';

export type MagicCutShortcutSpec = Omit<ShortcutDefinition, 'action'> & {
  id: MagicCutShortcutId;
};

export const MAGIC_CUT_SHORTCUT_MANIFEST: MagicCutShortcutSpec[] = [
  { id: 'play-pause', keys: ['space'], description: 'Play/Pause', category: 'playback' },
  { id: 'play-forward', keys: ['l'], description: 'Play forward', category: 'playback' },
  { id: 'play-backward', keys: ['j'], description: 'Play backward', category: 'playback' },
  { id: 'pause-playback', keys: ['k'], description: 'Pause', category: 'playback' },
  { id: 'step-forward', keys: ['right'], description: 'Step forward', category: 'navigation' },
  { id: 'step-backward', keys: ['left'], description: 'Step backward', category: 'navigation' },
  { id: 'jump-start', keys: ['home'], description: 'Jump to start', category: 'navigation' },
  { id: 'jump-end', keys: ['end'], description: 'Jump to end', category: 'navigation' },
  { id: 'select-all', keys: ['ctrl+a'], description: 'Select all', category: 'selection' },
  { id: 'deselect-all', keys: ['ctrl+shift+a'], description: 'Deselect all', category: 'selection' },
  { id: 'delete', keys: ['delete', 'backspace'], description: 'Delete selected', category: 'editing' },
  { id: 'ripple-delete', keys: ['shift+delete', 'shift+backspace'], description: 'Ripple delete selected', category: 'editing' },
  { id: 'copy', keys: ['ctrl+c'], description: 'Copy', category: 'editing' },
  { id: 'paste', keys: ['ctrl+v'], description: 'Paste', category: 'editing' },
  { id: 'paste-insert', keys: ['ctrl+shift+v'], description: 'Paste insert', category: 'editing' },
  { id: 'undo', keys: ['ctrl+z'], description: 'Undo', category: 'editing' },
  { id: 'redo', keys: ['ctrl+shift+z', 'ctrl+y'], description: 'Redo', category: 'editing' },
  { id: 'split', keys: ['ctrl+b'], description: 'Split clip', category: 'editing' },
  { id: 'nudge-left', keys: [','], description: 'Nudge left', category: 'editing' },
  { id: 'nudge-right', keys: ['.'], description: 'Nudge right', category: 'editing' },
  { id: 'nudge-left-big', keys: ['shift+,'], description: 'Nudge left 10 frames', category: 'editing' },
  { id: 'nudge-right-big', keys: ['shift+.'], description: 'Nudge right 10 frames', category: 'editing' },
  { id: 'set-in-point', keys: ['i'], description: 'Set In point', category: 'editing' },
  { id: 'set-out-point', keys: ['o'], description: 'Set Out point', category: 'editing' },
  { id: 'clear-in-out', keys: ['ctrl+shift+x'], description: 'Clear In/Out', category: 'editing' },
  { id: 'trim-start-to-playhead', keys: ['q'], description: 'Trim Start to Playhead', category: 'editing' },
  { id: 'trim-end-to-playhead', keys: ['w'], description: 'Trim End to Playhead', category: 'editing' },
  { id: 'zoom-in', keys: ['+', '='], description: 'Zoom in', category: 'navigation' },
  { id: 'zoom-out', keys: ['-'], description: 'Zoom out', category: 'navigation' },
  { id: 'zoom-fit', keys: ['shift+z'], description: 'Fit timeline to view', category: 'navigation' },
  { id: 'toggle-snapping', keys: ['n'], description: 'Toggle snapping', category: 'tools' },
  { id: 'toggle-skimming', keys: ['s'], description: 'Toggle skimming', category: 'tools' },
  { id: 'toggle-linked-selection', keys: ['shift+l'], description: 'Toggle linked selection', category: 'tools' },
  { id: 'tool-select', keys: ['v'], description: 'Selection Tool', category: 'tools' },
  { id: 'tool-trim', keys: ['t'], description: 'Trim Tool', category: 'tools' },
  { id: 'tool-ripple', keys: ['r'], description: 'Ripple Edit Tool', category: 'tools' },
  { id: 'tool-roll', keys: ['e'], description: 'Roll Edit Tool', category: 'tools' },
  { id: 'tool-slip', keys: ['y'], description: 'Slip Tool', category: 'tools' },
  { id: 'tool-slide', keys: ['u'], description: 'Slide Tool', category: 'tools' },
  { id: 'tool-razor', keys: ['c'], description: 'Razor Tool', category: 'tools' },
];

export interface MagicCutShortcutDependencies {
  emit: (event: MagicCutEvents) => void;
  playPause: () => void;
  playForward: () => void;
  playBackward: () => void;
  pausePlayback: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpStart: () => void;
  jumpEnd: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  deleteSelected: () => void;
  rippleDeleteSelected: () => void;
  copySelected: () => void;
  paste: () => void;
  pasteInsert: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  split: () => void;
  nudge: (deltaFrames: number) => void;
  setInPoint: () => void;
  setOutPoint: () => void;
  clearInOut: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleSnapping: () => void;
  toggleSkimming: () => void;
  toggleLinkedSelection: () => void;
  setEditTool: (tool: EditTool) => void;
}

export const buildMagicCutShortcutDefinitions = (
  deps: MagicCutShortcutDependencies
): ShortcutDefinition[] => {
  const actions: Record<MagicCutShortcutId, () => void> = {
    'play-pause': deps.playPause,
    'play-forward': deps.playForward,
    'play-backward': deps.playBackward,
    'pause-playback': deps.pausePlayback,
    'step-forward': deps.stepForward,
    'step-backward': deps.stepBackward,
    'jump-start': deps.jumpStart,
    'jump-end': deps.jumpEnd,
    'select-all': deps.selectAll,
    'deselect-all': deps.deselectAll,
    delete: deps.deleteSelected,
    'ripple-delete': deps.rippleDeleteSelected,
    copy: deps.copySelected,
    paste: deps.paste,
    'paste-insert': deps.pasteInsert,
    undo: () => {
      if (deps.canUndo()) deps.undo();
    },
    redo: () => {
      if (deps.canRedo()) deps.redo();
    },
    split: deps.split,
    'nudge-left': () => deps.nudge(-1),
    'nudge-right': () => deps.nudge(1),
    'nudge-left-big': () => deps.nudge(-10),
    'nudge-right-big': () => deps.nudge(10),
    'set-in-point': deps.setInPoint,
    'set-out-point': deps.setOutPoint,
    'clear-in-out': deps.clearInOut,
    'trim-start-to-playhead': () => deps.emit(MagicCutEvents.CLIP_TRIM_START),
    'trim-end-to-playhead': () => deps.emit(MagicCutEvents.CLIP_TRIM_END),
    'zoom-in': deps.zoomIn,
    'zoom-out': deps.zoomOut,
    'zoom-fit': () => deps.emit(MagicCutEvents.VIEW_FIT),
    'toggle-snapping': deps.toggleSnapping,
    'toggle-skimming': deps.toggleSkimming,
    'toggle-linked-selection': deps.toggleLinkedSelection,
    'tool-select': () => deps.setEditTool('select'),
    'tool-trim': () => deps.setEditTool('trim'),
    'tool-ripple': () => deps.setEditTool('ripple'),
    'tool-roll': () => deps.setEditTool('roll'),
    'tool-slip': () => deps.setEditTool('slip'),
    'tool-slide': () => deps.setEditTool('slide'),
    'tool-razor': () => deps.setEditTool('razor'),
  };

  return MAGIC_CUT_SHORTCUT_MANIFEST.map((shortcut) => ({
    ...shortcut,
    action: actions[shortcut.id],
  }));
};
