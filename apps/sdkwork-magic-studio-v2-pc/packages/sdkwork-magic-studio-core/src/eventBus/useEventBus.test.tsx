/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@/tests/support/reactTesting';

import { EventBus } from './EventBus';
import { useEventBus, useEventSubscription } from './useEventBus';

describe('useEventBus hooks', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('routes emitted payloads to the latest useEventBus handler after rerender', async () => {
    const eventBus = new EventBus();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const Harness = ({ handler }: { handler: (payload?: string) => void }) => {
      useEventBus(eventBus, 'media:ready', handler);
      return null;
    };

    const view = render(<Harness handler={firstHandler} />);

    await vi.waitFor(() => {
      expect(eventBus.listenerCount('media:ready')).toBe(1);
    });

    view.rerender(<Harness handler={secondHandler} />);

    act(() => {
      eventBus.emit('media:ready', 'asset-1');
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith('asset-1');

    view.unmount();

    expect(eventBus.listenerCount('media:ready')).toBe(0);
  });

  it('routes emitted payloads to the latest useEventSubscription handler', async () => {
    const eventBus = new EventBus();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const Harness = ({ handler }: { handler: (payload?: string) => void }) => {
      useEventSubscription('job:updated', handler, [], eventBus);
      return null;
    };

    const view = render(<Harness handler={firstHandler} />);

    await vi.waitFor(() => {
      expect(eventBus.listenerCount('job:updated')).toBe(1);
    });

    view.rerender(<Harness handler={secondHandler} />);

    act(() => {
      eventBus.emit('job:updated', 'job-42');
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith('job-42');
  });
});
