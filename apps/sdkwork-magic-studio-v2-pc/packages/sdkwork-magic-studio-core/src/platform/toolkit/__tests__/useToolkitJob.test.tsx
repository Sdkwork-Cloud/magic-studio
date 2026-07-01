/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@/tests/support/reactTesting';

import type {
  ToolkitJobClient,
  ToolkitJobRunOptions,
  ToolkitJobSnapshot,
  ToolkitOperation,
} from '../jobClient';
import { useToolkitJob, useToolkitJobSubscription } from '../useToolkitJob';

const snapshot: ToolkitJobSnapshot = {
  id: 'job-1',
  kind: 'toolkit',
  operation: 'mediaProbe',
  status: 'succeeded',
  progress: 100,
  stage: 'done',
  createdAtMs: 1,
  updatedAtMs: 2,
  error: null,
  result: null,
};

describe('useToolkitJob hooks', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('delivers subscription updates to the latest callback', async () => {
    let subscribedCallback: ((payload: ToolkitJobSnapshot) => void) | null = null;
    const subscribeJobUpdates = vi.fn(async (callback: (payload: ToolkitJobSnapshot) => void) => {
      subscribedCallback = callback;
      return () => {
        subscribedCallback = null;
      };
    });

    const client = {
      isSupported: vi.fn(() => true),
      subscribeJobUpdates,
    } as unknown as ToolkitJobClient;

    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const Harness = ({ onUpdate }: { onUpdate: (job: ToolkitJobSnapshot) => void }) => {
      useToolkitJobSubscription({
        client,
        enabled: true,
        onUpdate,
      });
      return null;
    };

    const view = render(<Harness onUpdate={firstHandler} />);

    await vi.waitFor(() => {
      expect(subscribeJobUpdates).toHaveBeenCalledTimes(1);
      expect(subscribedCallback).not.toBeNull();
    });

    view.rerender(<Harness onUpdate={secondHandler} />);

    act(() => {
      subscribedCallback?.(snapshot);
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith(snapshot);
  });

  it('uses the latest watch callbacks when running toolkit jobs', async () => {
    let latestResult: ReturnType<typeof useToolkitJob> | null = null;

    const runToolkitJob = vi.fn(
      async (
        _operation: ToolkitOperation,
        options: ToolkitJobRunOptions = {}
      ): Promise<ToolkitJobSnapshot> => {
        options.onUpdate?.(snapshot);
        options.onTerminal?.(snapshot);
        return snapshot;
      }
    );

    const client = {
      isSupported: vi.fn(() => true),
      runToolkitJob,
      listJobs: vi.fn(async () => []),
      getJob: vi.fn(async () => snapshot),
      cancelJob: vi.fn(async () => snapshot),
      submitToolkitJob: vi.fn(async () => snapshot),
      watchJob: vi.fn(() => ({
        stop: vi.fn(),
        done: Promise.resolve(snapshot),
      })),
    } as unknown as ToolkitJobClient;

    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const Harness = ({ onUpdate }: { onUpdate: (job: ToolkitJobSnapshot) => void }) => {
      const result = useToolkitJob({
        client,
        onUpdate,
      });

      React.useEffect(() => {
        latestResult = result;
      }, [result]);

      return null;
    };

    const view = render(<Harness onUpdate={firstHandler} />);

    await vi.waitFor(() => {
      expect(latestResult).not.toBeNull();
    });

    view.rerender(<Harness onUpdate={secondHandler} />);

    await act(async () => {
      await latestResult?.run({
        kind: 'mediaProbe',
        input: '/tmp/input.mp4',
      });
    });

    expect(runToolkitJob).toHaveBeenCalledTimes(1);
    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith(snapshot);
  });
});
