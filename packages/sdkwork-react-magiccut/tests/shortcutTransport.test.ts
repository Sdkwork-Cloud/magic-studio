import { describe, expect, it, vi } from 'vitest';

import { createJklTransportHandlers } from '../src/domain/shortcuts/shortcutTransport';

describe('createJklTransportHandlers', () => {
  it('routes J/K/L transport shortcuts through the player controller', () => {
    const playerController = {
      handleJKLInput: vi.fn(),
    };

    const handlers = createJklTransportHandlers({
      playerController,
    });

    handlers.playForward();
    handlers.playBackward();
    handlers.pausePlayback();

    expect(playerController.handleJKLInput.mock.calls).toEqual([
      ['l'],
      ['j'],
      ['k'],
    ]);
  });
});
