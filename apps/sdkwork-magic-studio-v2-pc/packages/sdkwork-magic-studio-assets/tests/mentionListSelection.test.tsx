/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MentionList,
  type MentionListRef,
} from '../src/components/CreationChatInput/components/MentionList';

describe('MentionList selection handling', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('resets keyboard selection to the first item when the suggestion dataset changes', async () => {
    const command = vi.fn();
    const ref = React.createRef<MentionListRef>();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <MentionList
          ref={ref}
          command={command}
          items={[
            {
              id: null,
              uuid: 'initial-first',
              name: 'initial-first.png',
              type: 'image',
              url: 'https://example.com/initial-first.png',
            },
            {
              id: null,
              uuid: 'initial-second',
              name: 'initial-second.png',
              type: 'image',
              url: 'https://example.com/initial-second.png',
            },
          ]}
        />
      );
    });

    await act(async () => {
      ref.current?.onKeyDown({ event: new KeyboardEvent('keydown', { key: 'ArrowDown' }) });
    });

    await act(async () => {
      root?.render(
        <MentionList
          ref={ref}
          command={command}
          items={[
            {
              id: null,
              uuid: 'replacement-first',
              name: 'replacement-first.png',
              type: 'image',
              url: 'https://example.com/replacement-first.png',
            },
            {
              id: null,
              uuid: 'replacement-second',
              name: 'replacement-second.png',
              type: 'image',
              url: 'https://example.com/replacement-second.png',
            },
          ]}
        />
      );
    });

    await act(async () => {
      ref.current?.onKeyDown({ event: new KeyboardEvent('keydown', { key: 'Enter' }) });
    });

    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'replacement-first',
      })
    );
  });
});
