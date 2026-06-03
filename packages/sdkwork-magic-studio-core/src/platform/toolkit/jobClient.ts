import type {
  MagicStudioServerClient,
  MagicStudioToolkitFrameworkError,
  MagicStudioToolkitJobSubmission,
  MagicStudioToolkitJobSnapshot,
  MagicStudioToolkitJobStatus,
  MagicStudioToolkitCommandResult,
  MagicStudioToolkitOperation,
  MagicStudioToolkitOperationResult,
} from '@sdkwork/magic-studio-server';
import type { PlatformRuntime } from '../runtime/types.ts';
import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from './magicStudioServerRuntime.ts';

const DEFAULT_POLL_INTERVAL_MS = 1200;
const DEFAULT_RETRY_DELAY_MS = 1000;

type PollingMode = 'auto' | 'always' | 'never';

export type ToolkitJobStatus = MagicStudioToolkitJobStatus;
export type ToolkitFrameworkError = MagicStudioToolkitFrameworkError;
export type ToolkitCommandResult = MagicStudioToolkitCommandResult;
export type ToolkitOperationResult = MagicStudioToolkitOperationResult;
export type ToolkitOperation = MagicStudioToolkitOperation;
export type ToolkitJobSnapshot = MagicStudioToolkitJobSnapshot;

export interface ToolkitJobWatchOptions {
  pollingMode?: PollingMode;
  pollIntervalMs?: number;
  onUpdate?: (snapshot: ToolkitJobSnapshot) => void;
  onTerminal?: (snapshot: ToolkitJobSnapshot) => void;
  onError?: (error: Error) => void;
}

export interface ToolkitJobRunOptions extends ToolkitJobWatchOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  retryOnCancelled?: boolean;
  throwOnFailure?: boolean;
}

export interface ToolkitJobWatcher {
  stop: () => void;
  done: Promise<ToolkitJobSnapshot>;
}

type ToolkitJobServerClient = Pick<
  MagicStudioServerClient,
  'cancelToolkitJob' | 'listToolkitJobs' | 'readToolkitJob' | 'submitToolkitJob'
>;

export interface ToolkitJobClientOptions {
  serverClient?: MagicStudioServerClient;
}

const terminalStatuses: ReadonlySet<ToolkitJobStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

const toError = (error: unknown, fallback: string): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(error ? String(error) : fallback);
};

const isJobSnapshot = (value: unknown): value is ToolkitJobSnapshot => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ToolkitJobSnapshot>;
  return (
    candidate.kind === 'toolkit' &&
    typeof candidate.id === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.updatedAtMs === 'number'
  );
};

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const parseJobErrorMessage = (snapshot: ToolkitJobSnapshot): string => {
  if (snapshot.error?.message) {
    return snapshot.error.message;
  }
  return `job ${snapshot.id} finished with status "${snapshot.status}"`;
};

export class ToolkitJobClient {
  private readonly runtime: PlatformRuntime;
  private readonly serverClient: ToolkitJobServerClient;

  constructor(
    runtime: PlatformRuntime = readDefaultPlatformRuntime('ToolkitJobClient'),
    options: ToolkitJobClientOptions = {},
  ) {
    this.runtime = runtime;
    this.serverClient = createRuntimeMagicStudioServerClient(runtime, options.serverClient);
  }

  isSupported(): boolean {
    return isMagicStudioServerRuntimeSupported(this.runtime);
  }

  private ensureSupported(feature: string): void {
    if (!this.isSupported()) {
      throw new Error(
        `[ToolkitJobClient] ${feature} requires rust server runtime support`,
      );
    }
  }

  async submitToolkitJob(operation: ToolkitOperation): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('submitToolkitJob');
    const payload: MagicStudioToolkitJobSubmission = {
      kind: 'toolkit',
      operation,
    };
    const response = await this.serverClient.submitToolkitJob(payload);
    return response.data;
  }

  async getJob(jobId: string): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('getJob');
    const response = await this.serverClient.readToolkitJob(jobId);
    return response.data;
  }

  async listJobs(): Promise<ToolkitJobSnapshot[]> {
    this.ensureSupported('listJobs');
    const response = await this.serverClient.listToolkitJobs();
    return response.items;
  }

  async cancelJob(jobId: string): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('cancelJob');
    const response = await this.serverClient.cancelToolkitJob(jobId);
    return response.data;
  }

  async subscribeJobUpdates(
    callback: (snapshot: ToolkitJobSnapshot) => void,
  ): Promise<() => void> {
    if (!this.isSupported()) {
      return () => {};
    }

    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    const lastUpdatedAtMsById = new Map<string, number>();

    const emitChanges = async (): Promise<void> => {
      if (!active) {
        return;
      }

      const snapshots = await this.listJobs();
      for (const snapshot of snapshots) {
        if (!isJobSnapshot(snapshot)) {
          continue;
        }

        const previousUpdatedAtMs = lastUpdatedAtMsById.get(snapshot.id) ?? -1;
        if (snapshot.updatedAtMs > previousUpdatedAtMs) {
          lastUpdatedAtMsById.set(snapshot.id, snapshot.updatedAtMs);
          callback(snapshot);
        }
      }
    };

    await emitChanges();
    timer = setInterval(() => {
      void emitChanges().catch(() => {
        // Periodic subscription polling is best-effort. Callers still have watchJob polling.
      });
    }, DEFAULT_POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }

  watchJob(jobId: string, options: ToolkitJobWatchOptions = {}): ToolkitJobWatcher {
    this.ensureSupported('watchJob');
    const pollInterval = Math.max(300, options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
    const pollingMode: PollingMode = options.pollingMode ?? 'auto';

    let active = true;
    let unlisten: (() => void) | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let lastUpdatedAtMs = -1;

    let resolveDone: (snapshot: ToolkitJobSnapshot) => void = () => {};
    let rejectDone: (error: Error) => void = () => {};

    const done = new Promise<ToolkitJobSnapshot>((resolve, reject) => {
      resolveDone = resolve;
      rejectDone = reject;
    });

    const stop = (): void => {
      active = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (unlisten) {
        unlisten();
        unlisten = null;
      }
    };

    const acceptSnapshot = (snapshot: ToolkitJobSnapshot): void => {
      if (!active) {
        return;
      }
      if (snapshot.updatedAtMs < lastUpdatedAtMs) {
        return;
      }
      lastUpdatedAtMs = snapshot.updatedAtMs;
      options.onUpdate?.(snapshot);
      if (terminalStatuses.has(snapshot.status)) {
        options.onTerminal?.(snapshot);
        stop();
        resolveDone(snapshot);
      }
    };

    const pullLatest = async (): Promise<void> => {
      if (!active) {
        return;
      }
      const snapshot = await this.getJob(jobId);
      acceptSnapshot(snapshot);
    };

    void (async (): Promise<void> => {
      let subscribed = false;
      if (pollingMode !== 'never') {
        try {
          unlisten = await this.subscribeJobUpdates((snapshot) => {
            if (snapshot.id === jobId) {
              acceptSnapshot(snapshot);
            }
          });
          subscribed = true;
        } catch (error) {
          options.onError?.(
            toError(error, '[ToolkitJobClient] Failed to subscribe job updates'),
          );
        }
      }

      const shouldPoll =
        pollingMode === 'always' || (pollingMode === 'auto' && !subscribed);
      if (shouldPoll) {
        timer = setInterval(() => {
          void pullLatest().catch((error) => {
            options.onError?.(
              toError(error, '[ToolkitJobClient] Failed to query job'),
            );
          });
        }, pollInterval);
      }

      try {
        await pullLatest();
      } catch (error) {
        const parsed = toError(error, '[ToolkitJobClient] Failed to watch job');
        options.onError?.(parsed);
        stop();
        rejectDone(parsed);
      }
    })();

    return {
      stop,
      done,
    };
  }

  async runToolkitJob(
    operation: ToolkitOperation,
    options: ToolkitJobRunOptions = {},
  ): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('runToolkitJob');

    const maxAttempts = Math.max(1, options.maxAttempts ?? 1);
    const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
    const retryOnCancelled = options.retryOnCancelled ?? false;
    const throwOnFailure = options.throwOnFailure ?? true;

    let attempt = 0;
    let finalSnapshot: ToolkitJobSnapshot | null = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      const submitted = await this.submitToolkitJob(operation);
      const watcher = this.watchJob(submitted.id, options);
      const snapshot = await watcher.done;
      finalSnapshot = snapshot;

      if (snapshot.status === 'succeeded') {
        return snapshot;
      }

      const canRetry =
        snapshot.status === 'failed'
        || (snapshot.status === 'cancelled' && retryOnCancelled);
      if (!canRetry || attempt >= maxAttempts) {
        break;
      }

      if (retryDelayMs > 0) {
        await sleep(retryDelayMs);
      }
    }

    if (!finalSnapshot) {
      throw new Error('[ToolkitJobClient] Job did not produce a final snapshot');
    }

    if (throwOnFailure) {
      throw new Error(`[ToolkitJobClient] ${parseJobErrorMessage(finalSnapshot)}`);
    }

    return finalSnapshot;
  }
}

let currentToolkitJobClient: ToolkitJobClient | null = null;

export const getToolkitJobClient = (): ToolkitJobClient => {
  if (!currentToolkitJobClient) {
    currentToolkitJobClient = new ToolkitJobClient();
  }
  return currentToolkitJobClient;
};

export const configureToolkitJobClient = (client: ToolkitJobClient): ToolkitJobClient => {
  currentToolkitJobClient = client;
  return currentToolkitJobClient;
};

export const resetToolkitJobClient = (): ToolkitJobClient => {
  currentToolkitJobClient = new ToolkitJobClient();
  return currentToolkitJobClient;
};
