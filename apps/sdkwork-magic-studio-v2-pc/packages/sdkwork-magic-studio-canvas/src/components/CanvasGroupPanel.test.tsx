/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CanvasElement } from '../entities';

const mocks = vi.hoisted(() => ({
  updateElement: vi.fn(),
  store: {
    viewport: { x: 0, y: 0, zoom: 1 },
    highlightedGroupId: null as string | null,
  },
}));

vi.mock('../store/canvasStore', () => ({
  useCanvasStore: (selector: (state: {
    updateElement: typeof mocks.updateElement;
    viewport: typeof mocks.store.viewport;
    highlightedGroupId: string | null;
  }) => unknown) =>
    selector({
      updateElement: mocks.updateElement,
      viewport: mocks.store.viewport,
      highlightedGroupId: mocks.store.highlightedGroupId,
    }),
}));

vi.mock('./CanvasBoard', () => ({
  Z_LAYERS: {
    GROUPS: 10,
  },
}));

import { CanvasGroupPanel } from './CanvasGroupPanel';

const createGroupElement = (label: string): CanvasElement => ({
  id: null,
  uuid: 'group-uuid-1',
  type: 'group',
  x: 16,
  y: 24,
  width: 320,
  height: 180,
  data: { label },
  selected: true,
  groupChildren: [],
});

describe('CanvasGroupPanel', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    mocks.updateElement.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
  });

  it('commits trimmed labels through updateElement and falls back to Group for blank values', async () => {
    const element = createGroupElement('Storyboard');

    await act(async () => {
      root = createRoot(container);
      root.render(
        <CanvasGroupPanel
          element={element}
          onMouseDown={() => undefined}
          onContextMenu={() => undefined}
        />
      );
    });

    const label = Array.from(container.querySelectorAll('span')).find(
      (node) => node.textContent === 'Storyboard'
    );
    expect(label).toBeTruthy();

    await act(async () => {
      label?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    const input = container.querySelector('input') as HTMLInputElement | null;
    expect(input?.value).toBe('Storyboard');

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(input, '   ');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
      input?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    });

    expect(mocks.updateElement).toHaveBeenCalledWith(
      'group-uuid-1',
      expect.objectContaining({
        data: expect.objectContaining({
          label: 'Group',
        }),
      }),
      true
    );
  });

  it('renders the latest committed label from props when not editing', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <CanvasGroupPanel
          element={createGroupElement('Initial Label')}
          onMouseDown={() => undefined}
          onContextMenu={() => undefined}
        />
      );
    });

    expect(container.textContent).toContain('Initial Label');

    await act(async () => {
      root?.render(
        <CanvasGroupPanel
          element={createGroupElement('Renamed Label')}
          onMouseDown={() => undefined}
          onContextMenu={() => undefined}
        />
      );
    });

    expect(container.textContent).toContain('Renamed Label');
  });
});
