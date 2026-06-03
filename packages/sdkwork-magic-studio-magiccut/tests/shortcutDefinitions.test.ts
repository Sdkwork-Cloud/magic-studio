import { describe, expect, it, vi } from 'vitest';

import { MagicCutEvents } from '../src/events';
import {
  buildMagicCutShortcutDefinitions,
  MAGIC_CUT_SHORTCUT_MANIFEST,
} from '../src/domain/shortcuts/magicCutShortcutDefinitions';

const createDeps = () => {
  const emittedEvents: MagicCutEvents[] = [];
  const editToolCalls: string[] = [];
  const callCounts = {
    toggleSkimming: 0,
    toggleLinkedSelection: 0,
    zoomIn: 0,
    zoomOut: 0,
  };

  return {
    deps: {
      emit: (event: MagicCutEvents) => emittedEvents.push(event),
      playPause: vi.fn(),
      playForward: vi.fn(),
      playBackward: vi.fn(),
      pausePlayback: vi.fn(),
      stepForward: vi.fn(),
      stepBackward: vi.fn(),
      jumpStart: vi.fn(),
      jumpEnd: vi.fn(),
      selectAll: vi.fn(),
      deselectAll: vi.fn(),
      deleteSelected: vi.fn(),
      rippleDeleteSelected: vi.fn(),
      copySelected: vi.fn(),
      paste: vi.fn(),
      pasteInsert: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: () => true,
      canRedo: () => true,
      split: vi.fn(),
      nudge: vi.fn(),
      setInPoint: vi.fn(),
      setOutPoint: vi.fn(),
      clearInOut: vi.fn(),
      zoomIn: () => {
        callCounts.zoomIn += 1;
      },
      zoomOut: () => {
        callCounts.zoomOut += 1;
      },
      toggleSnapping: vi.fn(),
      toggleSkimming: () => {
        callCounts.toggleSkimming += 1;
      },
      toggleLinkedSelection: () => {
        callCounts.toggleLinkedSelection += 1;
      },
      setEditTool: (tool: string) => {
        editToolCalls.push(tool);
      },
    },
    emittedEvents,
    editToolCalls,
    callCounts,
  };
};

describe('MAGIC_CUT_SHORTCUT_MANIFEST', () => {
  it('includes the professional editing shortcuts exposed by the UI', () => {
    const manifestById = Object.fromEntries(
      MAGIC_CUT_SHORTCUT_MANIFEST.map((item) => [item.id, item])
    );

    expect(manifestById['trim-start-to-playhead']?.keys).toEqual(['q']);
    expect(manifestById['trim-end-to-playhead']?.keys).toEqual(['w']);
    expect(manifestById['zoom-fit']?.keys).toEqual(['shift+z']);
    expect(manifestById['toggle-skimming']?.keys).toEqual(['s']);
    expect(manifestById['toggle-linked-selection']?.keys).toEqual(['shift+l']);
    expect(manifestById['tool-slip']?.keys).toEqual(['y']);
    expect(manifestById['tool-slide']?.keys).toEqual(['u']);
    expect(manifestById['tool-razor']?.keys).toEqual(['c']);
  });
});

describe('buildMagicCutShortcutDefinitions', () => {
  it('wires trim and fit shortcuts to the same event bus actions used by the UI', () => {
    const { deps, emittedEvents } = createDeps();
    const definitions = buildMagicCutShortcutDefinitions(deps);

    definitions.find((item) => item.id === 'trim-start-to-playhead')?.action();
    definitions.find((item) => item.id === 'trim-end-to-playhead')?.action();
    definitions.find((item) => item.id === 'zoom-fit')?.action();

    expect(emittedEvents).toEqual([
      MagicCutEvents.CLIP_TRIM_START,
      MagicCutEvents.CLIP_TRIM_END,
      MagicCutEvents.VIEW_FIT,
    ]);
  });

  it('wires skimming and linked selection toggles to their runtime actions', () => {
    const { deps, callCounts } = createDeps();
    const definitions = buildMagicCutShortcutDefinitions(deps);

    definitions.find((item) => item.id === 'toggle-skimming')?.action();
    definitions.find((item) => item.id === 'toggle-linked-selection')?.action();

    expect(callCounts.toggleSkimming).toBe(1);
    expect(callCounts.toggleLinkedSelection).toBe(1);
  });

  it('wires tool selection shortcuts to the expected edit tools', () => {
    const { deps, editToolCalls } = createDeps();
    const definitions = buildMagicCutShortcutDefinitions(deps);

    definitions.find((item) => item.id === 'tool-select')?.action();
    definitions.find((item) => item.id === 'tool-trim')?.action();
    definitions.find((item) => item.id === 'tool-ripple')?.action();
    definitions.find((item) => item.id === 'tool-roll')?.action();
    definitions.find((item) => item.id === 'tool-slip')?.action();
    definitions.find((item) => item.id === 'tool-slide')?.action();
    definitions.find((item) => item.id === 'tool-razor')?.action();

    expect(editToolCalls).toEqual([
      'select',
      'trim',
      'ripple',
      'roll',
      'slip',
      'slide',
      'razor',
    ]);
  });
});
