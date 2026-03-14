import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getToolkitJobClient,
  type ToolkitJobClient,
  type ToolkitJobRunOptions,
  type ToolkitJobSnapshot,
  type ToolkitJobStatus,
  type ToolkitJobWatchOptions,
  type ToolkitJobWatcher,
  type ToolkitNativeOperation
} from './jobClient';

const terminalStatuses: ReadonlySet<ToolkitJobStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled'
]);

const runningStatuses: ReadonlySet<ToolkitJobStatus> = new Set([
  'pending',
  'running'
]);

export interface UseToolkitJobOptions extends ToolkitJobWatchOptions {
  client?: ToolkitJobClient;
  initialSnapshot?: ToolkitJobSnapshot | null;
  autoWatchInitialSnapshot?: boolean;
}

export interface ToolkitJobSubmitOptions extends ToolkitJobWatchOptions {
  watch?: boolean;
}

export interface UseToolkitJobResult {
  supported: boolean;
  snapshot: ToolkitJobSnapshot | null;
  jobId: string | null;
  status: ToolkitJobStatus | null;
  progress: number;
  stage: string | null;
  error: Error | null;
  isWatching: boolean;
  isRunning: boolean;
  isTerminal: boolean;
  canCancel: boolean;
  submit: (
    operation: ToolkitNativeOperation,
    options?: ToolkitJobSubmitOptions
  ) => Promise<ToolkitJobSnapshot>;
  run: (
    operation: ToolkitNativeOperation,
    options?: ToolkitJobRunOptions
  ) => Promise<ToolkitJobSnapshot>;
  retry: (options?: ToolkitJobRunOptions) => Promise<ToolkitJobSnapshot>;
  watch: (
    targetJobId: string,
    options?: ToolkitJobWatchOptions
  ) => Promise<ToolkitJobSnapshot>;
  refresh: (targetJobId?: string) => Promise<ToolkitJobSnapshot | null>;
  list: () => Promise<ToolkitJobSnapshot[]>;
  cancel: (targetJobId?: string) => Promise<ToolkitJobSnapshot | null>;
  clearError: () => void;
  reset: () => void;
  stopWatching: () => void;
}

export interface UseToolkitJobSubscriptionOptions {
  client?: ToolkitJobClient;
  enabled?: boolean;
  onUpdate: (snapshot: ToolkitJobSnapshot) => void;
}

export const useToolkitJobSubscription = (
  options: UseToolkitJobSubscriptionOptions
): void => {
  const { onUpdate, enabled = true } = options;
  const client = options.client ?? getToolkitJobClient();
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !client.isSupported()) {
      return undefined;
    }
    let mounted = true;
    let unlisten: (() => void) | null = null;

    void client
      .subscribeJobUpdates((snapshot) => {
        if (!mounted) {
          return;
        }
        onUpdateRef.current(snapshot);
      })
      .then((dispose) => {
        if (!mounted) {
          dispose();
          return;
        }
        unlisten = dispose;
      })
      .catch(() => {
        unlisten = null;
      });

    return () => {
      mounted = false;
      if (unlisten) {
        unlisten();
      }
    };
  }, [client, enabled]);
};

export const useToolkitJob = (
  options: UseToolkitJobOptions = {}
): UseToolkitJobResult => {
  const client = options.client ?? getToolkitJobClient();
  const supported = client.isSupported();

  const [snapshot, setSnapshot] = useState<ToolkitJobSnapshot | null>(
    options.initialSnapshot ?? null
  );
  const [jobId, setJobId] = useState<string | null>(
    options.initialSnapshot?.id ?? null
  );
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastOperation, setLastOperation] =
    useState<ToolkitNativeOperation | null>(null);

  const watcherRef = useRef<ToolkitJobWatcher | null>(null);
  const callbacksRef = useRef<Pick<
    ToolkitJobWatchOptions,
    'onUpdate' | 'onTerminal' | 'onError'
  >>({
    onUpdate: options.onUpdate,
    onTerminal: options.onTerminal,
    onError: options.onError
  });
  callbacksRef.current = {
    onUpdate: options.onUpdate,
    onTerminal: options.onTerminal,
    onError: options.onError
  };

  const stopWatching = useCallback((): void => {
    if (watcherRef.current) {
      watcherRef.current.stop();
      watcherRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const handleUpdate = useCallback((nextSnapshot: ToolkitJobSnapshot): void => {
    setSnapshot(nextSnapshot);
    setJobId(nextSnapshot.id);
    setError(null);
  }, []);

  const handleWatchError = useCallback((watchError: Error): void => {
    setError(watchError);
    callbacksRef.current.onError?.(watchError);
  }, []);

  const startWatch = useCallback(
    async (
      targetJobId: string,
      watchOptions: ToolkitJobWatchOptions = {}
    ): Promise<ToolkitJobSnapshot> => {
      if (!supported) {
        throw new Error('[useToolkitJob] watch requires desktop native runtime');
      }

      stopWatching();
      setIsWatching(true);

      const watcher = client.watchJob(targetJobId, {
        pollingMode: watchOptions.pollingMode ?? options.pollingMode,
        pollIntervalMs: watchOptions.pollIntervalMs ?? options.pollIntervalMs,
        onUpdate: (nextSnapshot) => {
          handleUpdate(nextSnapshot);
          callbacksRef.current.onUpdate?.(nextSnapshot);
          watchOptions.onUpdate?.(nextSnapshot);
        },
        onTerminal: (nextSnapshot) => {
          callbacksRef.current.onTerminal?.(nextSnapshot);
          watchOptions.onTerminal?.(nextSnapshot);
        },
        onError: (watchError) => {
          handleWatchError(watchError);
          watchOptions.onError?.(watchError);
        }
      });

      watcherRef.current = watcher;

      try {
        const terminalSnapshot = await watcher.done;
        setIsWatching(false);
        watcherRef.current = null;
        handleUpdate(terminalSnapshot);
        return terminalSnapshot;
      } catch (watchError) {
        setIsWatching(false);
        watcherRef.current = null;
        const parsed =
          watchError instanceof Error
            ? watchError
            : new Error(String(watchError));
        handleWatchError(parsed);
        throw parsed;
      }
    },
    [
      client,
      handleUpdate,
      handleWatchError,
      options.pollIntervalMs,
      options.pollingMode,
      stopWatching,
      supported
    ]
  );

  const submit = useCallback(
    async (
      operation: ToolkitNativeOperation,
      submitOptions: ToolkitJobSubmitOptions = {}
    ): Promise<ToolkitJobSnapshot> => {
      if (!supported) {
        throw new Error('[useToolkitJob] submit requires desktop native runtime');
      }

      setError(null);
      setLastOperation(operation);
      const submitted = await client.submitToolkitJob(operation);
      handleUpdate(submitted);

      const shouldWatch = submitOptions.watch ?? true;
      if (shouldWatch) {
        void startWatch(submitted.id, submitOptions).catch(() => {
          // Error is already recorded in hook state.
        });
      }

      return submitted;
    },
    [client, handleUpdate, startWatch, supported]
  );

  const run = useCallback(
    async (
      operation: ToolkitNativeOperation,
      runOptions: ToolkitJobRunOptions = {}
    ): Promise<ToolkitJobSnapshot> => {
      if (!supported) {
        throw new Error('[useToolkitJob] run requires desktop native runtime');
      }

      setError(null);
      setLastOperation(operation);

      const finalSnapshot = await client.runToolkitJob(operation, {
        pollingMode: runOptions.pollingMode ?? options.pollingMode,
        pollIntervalMs: runOptions.pollIntervalMs ?? options.pollIntervalMs,
        maxAttempts: runOptions.maxAttempts,
        retryDelayMs: runOptions.retryDelayMs,
        retryOnCancelled: runOptions.retryOnCancelled,
        throwOnFailure: runOptions.throwOnFailure,
        onUpdate: (nextSnapshot) => {
          handleUpdate(nextSnapshot);
          callbacksRef.current.onUpdate?.(nextSnapshot);
          runOptions.onUpdate?.(nextSnapshot);
        },
        onTerminal: (nextSnapshot) => {
          callbacksRef.current.onTerminal?.(nextSnapshot);
          runOptions.onTerminal?.(nextSnapshot);
        },
        onError: (runError) => {
          handleWatchError(runError);
          runOptions.onError?.(runError);
        }
      });

      handleUpdate(finalSnapshot);
      return finalSnapshot;
    },
    [client, handleUpdate, handleWatchError, options.pollIntervalMs, options.pollingMode, supported]
  );

  const retry = useCallback(
    async (runOptions: ToolkitJobRunOptions = {}): Promise<ToolkitJobSnapshot> => {
      if (!lastOperation) {
        throw new Error('[useToolkitJob] no previous operation to retry');
      }
      return run(lastOperation, runOptions);
    },
    [lastOperation, run]
  );

  const refresh = useCallback(
    async (targetJobId?: string): Promise<ToolkitJobSnapshot | null> => {
      if (!supported) {
        return null;
      }
      const id = targetJobId ?? jobId;
      if (!id) {
        return null;
      }
      const latest = await client.getJob(id);
      handleUpdate(latest);
      return latest;
    },
    [client, handleUpdate, jobId, supported]
  );

  const list = useCallback(async (): Promise<ToolkitJobSnapshot[]> => {
    if (!supported) {
      return [];
    }
    return client.listJobs();
  }, [client, supported]);

  const cancel = useCallback(
    async (targetJobId?: string): Promise<ToolkitJobSnapshot | null> => {
      if (!supported) {
        return null;
      }
      const id = targetJobId ?? jobId;
      if (!id) {
        return null;
      }
      const cancelledSnapshot = await client.cancelJob(id);
      handleUpdate(cancelledSnapshot);
      return cancelledSnapshot;
    },
    [client, handleUpdate, jobId, supported]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    stopWatching();
    setSnapshot(null);
    setJobId(null);
    setError(null);
    setLastOperation(null);
  }, [stopWatching]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  useEffect(() => {
    if (!options.autoWatchInitialSnapshot || !options.initialSnapshot?.id || !supported) {
      return;
    }
    void startWatch(options.initialSnapshot.id).catch(() => {
      // Error is already recorded in hook state.
    });
  }, [
    options.autoWatchInitialSnapshot,
    options.initialSnapshot?.id,
    startWatch,
    supported
  ]);

  const status = snapshot?.status ?? null;
  const progress = snapshot?.progress ?? 0;
  const stage = snapshot?.stage ?? null;
  const isRunning = status ? runningStatuses.has(status) : false;
  const isTerminal = status ? terminalStatuses.has(status) : false;
  const canCancel = Boolean(jobId && isRunning);

  return useMemo(
    () => ({
      supported,
      snapshot,
      jobId,
      status,
      progress,
      stage,
      error,
      isWatching,
      isRunning,
      isTerminal,
      canCancel,
      submit,
      run,
      retry,
      watch: startWatch,
      refresh,
      list,
      cancel,
      clearError,
      reset,
      stopWatching
    }),
    [
      cancel,
      canCancel,
      clearError,
      error,
      isRunning,
      isTerminal,
      isWatching,
      jobId,
      list,
      progress,
      refresh,
      reset,
      retry,
      run,
      snapshot,
      stage,
      startWatch,
      status,
      stopWatching,
      submit,
      supported
    ]
  );
};
