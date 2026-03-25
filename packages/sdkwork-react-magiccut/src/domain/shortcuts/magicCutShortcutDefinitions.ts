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

export type MagicCutShortcutSpec = Omit<ShortcutDefinition, 'action' | 'description'> & {
  id: MagicCutShortcutId;
  descriptionKey: string;
};

export const MAGIC_CUT_SHORTCUT_MANIFEST: MagicCutShortcutSpec[] = [
  { id: 'play-pause', keys: ['space'], descriptionKey: 'shortcuts.playPause', category: 'playback' },
  { id: 'play-forward', keys: ['l'], descriptionKey: 'shortcuts.playForward', category: 'playback' },
  { id: 'play-backward', keys: ['j'], descriptionKey: 'shortcuts.playBackward', category: 'playback' },
  { id: 'pause-playback', keys: ['k'], descriptionKey: 'shortcuts.pausePlayback', category: 'playback' },
  { id: 'step-forward', keys: ['right'], descriptionKey: 'shortcuts.stepForward', category: 'navigation' },
  { id: 'step-backward', keys: ['left'], descriptionKey: 'shortcuts.stepBackward', category: 'navigation' },
  { id: 'jump-start', keys: ['home'], descriptionKey: 'shortcuts.jumpStart', category: 'navigation' },
  { id: 'jump-end', keys: ['end'], descriptionKey: 'shortcuts.jumpEnd', category: 'navigation' },
  { id: 'select-all', keys: ['ctrl+a'], descriptionKey: 'common.selectAll', category: 'selection' },
  { id: 'deselect-all', keys: ['ctrl+shift+a'], descriptionKey: 'common.deselectAll', category: 'selection' },
  { id: 'delete', keys: ['delete', 'backspace'], descriptionKey: 'shortcuts.delete', category: 'editing' },
  { id: 'ripple-delete', keys: ['shift+delete', 'shift+backspace'], descriptionKey: 'shortcuts.rippleDelete', category: 'editing' },
  { id: 'copy', keys: ['ctrl+c'], descriptionKey: 'common.copy', category: 'editing' },
  { id: 'paste', keys: ['ctrl+v'], descriptionKey: 'common.paste', category: 'editing' },
  { id: 'paste-insert', keys: ['ctrl+shift+v'], descriptionKey: 'shortcuts.pasteInsert', category: 'editing' },
  { id: 'undo', keys: ['ctrl+z'], descriptionKey: 'common.undo', category: 'editing' },
  { id: 'redo', keys: ['ctrl+shift+z', 'ctrl+y'], descriptionKey: 'common.redo', category: 'editing' },
  { id: 'split', keys: ['ctrl+b'], descriptionKey: 'timeline.splitClip', category: 'editing' },
  { id: 'nudge-left', keys: [','], descriptionKey: 'shortcuts.nudgeLeft', category: 'editing' },
  { id: 'nudge-right', keys: ['.'], descriptionKey: 'shortcuts.nudgeRight', category: 'editing' },
  { id: 'nudge-left-big', keys: ['shift+,'], descriptionKey: 'shortcuts.nudgeLeftBig', category: 'editing' },
  { id: 'nudge-right-big', keys: ['shift+.'], descriptionKey: 'shortcuts.nudgeRightBig', category: 'editing' },
  { id: 'set-in-point', keys: ['i'], descriptionKey: 'shortcuts.setInPoint', category: 'editing' },
  { id: 'set-out-point', keys: ['o'], descriptionKey: 'shortcuts.setOutPoint', category: 'editing' },
  { id: 'clear-in-out', keys: ['ctrl+shift+x'], descriptionKey: 'shortcuts.clearInOut', category: 'editing' },
  { id: 'trim-start-to-playhead', keys: ['q'], descriptionKey: 'shortcuts.trimStartToPlayhead', category: 'editing' },
  { id: 'trim-end-to-playhead', keys: ['w'], descriptionKey: 'shortcuts.trimEndToPlayhead', category: 'editing' },
  { id: 'zoom-in', keys: ['+', '='], descriptionKey: 'timeline.zoomIn', category: 'navigation' },
  { id: 'zoom-out', keys: ['-'], descriptionKey: 'timeline.zoomOut', category: 'navigation' },
  { id: 'zoom-fit', keys: ['shift+z'], descriptionKey: 'shortcuts.zoomFit', category: 'navigation' },
  { id: 'toggle-snapping', keys: ['n'], descriptionKey: 'shortcuts.toggleSnapping', category: 'tools' },
  { id: 'toggle-skimming', keys: ['s'], descriptionKey: 'shortcuts.toggleSkimming', category: 'tools' },
  { id: 'toggle-linked-selection', keys: ['shift+l'], descriptionKey: 'shortcuts.toggleLinkedSelection', category: 'tools' },
  { id: 'tool-select', keys: ['v'], descriptionKey: 'shortcuts.toolSelect', category: 'tools' },
  { id: 'tool-trim', keys: ['t'], descriptionKey: 'shortcuts.toolTrim', category: 'tools' },
  { id: 'tool-ripple', keys: ['r'], descriptionKey: 'shortcuts.toolRipple', category: 'tools' },
  { id: 'tool-roll', keys: ['e'], descriptionKey: 'shortcuts.toolRoll', category: 'tools' },
  { id: 'tool-slip', keys: ['y'], descriptionKey: 'shortcuts.toolSlip', category: 'tools' },
  { id: 'tool-slide', keys: ['u'], descriptionKey: 'shortcuts.toolSlide', category: 'tools' },
  { id: 'tool-razor', keys: ['c'], descriptionKey: 'shortcuts.toolRazor', category: 'tools' },
];

export interface MagicCutShortcutDependencies {
  translate: (key: string, options?: Record<string, unknown>) => string;
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
    description: deps.translate(shortcut.descriptionKey),
    action: actions[shortcut.id],
  }));
};
