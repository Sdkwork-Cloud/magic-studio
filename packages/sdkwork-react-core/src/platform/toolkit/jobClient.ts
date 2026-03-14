import { getPlatformRuntime } from '../runtime';
import type { PlatformRuntime } from '../runtime';

const DEFAULT_JOB_EVENT = 'job:updated';
const DEFAULT_POLL_INTERVAL_MS = 1200;
const DEFAULT_RETRY_DELAY_MS = 1000;

type PollingMode = 'auto' | 'always' | 'never';

export type ToolkitJobStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface ToolkitFrameworkError {
  code: string;
  message: string;
}

export interface ToolkitNativeCommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface ToolkitNativeOperationResult {
  operation: string;
  command?: ToolkitNativeCommandResult | null;
  probe?: Record<string, unknown> | null;
  archiveBytes?: number[] | null;
  notes?: string | null;
}

export interface ToolkitJobSnapshot {
  id: string;
  operation: string;
  status: ToolkitJobStatus;
  progress: number;
  stage?: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  error?: ToolkitFrameworkError | null;
  result?: ToolkitNativeOperationResult | null;
}

export type ToolkitNativeOperation =
  | {
      kind: 'probeMedia';
      input: string;
    }
  | {
      kind: 'resizeImage';
      input: string;
      output: string;
      width: number;
      height: number;
    }
  | {
      kind: 'transcodeVideoH264';
      input: string;
      output: string;
    }
  | {
      kind: 'extractAudioWav';
      input: string;
      output: string;
    }
  | {
      kind: 'mergeVideoAndAudio';
      videoInput: string;
      audioInput: string;
      output: string;
    }
  | {
      kind: 'zipAssets';
      sourcePaths: string[];
    }
  | {
      kind: 'recordAudio';
      output: string;
      durationSeconds?: number | null;
      inputDevice?: string | null;
    }
  | {
      kind: 'recordScreen';
      output: string;
      durationSeconds?: number | null;
      source?: string | null;
    };

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

const terminalStatuses: ReadonlySet<ToolkitJobStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled'
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
  private readonly eventName: string;

  constructor(runtime: PlatformRuntime = getPlatformRuntime(), eventName = DEFAULT_JOB_EVENT) {
    this.runtime = runtime;
    this.eventName = eventName;
  }

  isSupported(): boolean {
    return this.runtime.system.kind() === 'desktop' && this.runtime.bridge.available();
  }

  private ensureSupported(feature: string): void {
    if (!this.isSupported()) {
      throw new Error(
        `[ToolkitJobClient] ${feature} requires desktop runtime with native bridge`
      );
    }
  }

  async submitToolkitJob(operation: ToolkitNativeOperation): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('submitToolkitJob');
    return this.runtime.bridge.invoke<ToolkitJobSnapshot>('job_submit_toolkit', {
      operation
    });
  }

  async getJob(jobId: string): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('getJob');
    return this.runtime.bridge.invoke<ToolkitJobSnapshot>('job_get', { jobId });
  }

  async listJobs(): Promise<ToolkitJobSnapshot[]> {
    this.ensureSupported('listJobs');
    return this.runtime.bridge.invoke<ToolkitJobSnapshot[]>('job_list');
  }

  async cancelJob(jobId: string): Promise<ToolkitJobSnapshot> {
    this.ensureSupported('cancelJob');
    return this.runtime.bridge.invoke<ToolkitJobSnapshot>('job_cancel', { jobId });
  }

  async subscribeJobUpdates(
    callback: (snapshot: ToolkitJobSnapshot) => void
  ): Promise<() => void> {
    if (!this.isSupported()) {
      return () => {};
    }
    return this.runtime.bridge.listen<ToolkitJobSnapshot>(
      this.eventName,
      (payload: ToolkitJobSnapshot) => {
        if (isJobSnapshot(payload)) {
          callback(payload);
        }
      }
    );
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
            toError(error, '[ToolkitJobClient] Failed to subscribe job updates')
          );
        }
      }

      const shouldPoll =
        pollingMode === 'always' || (pollingMode === 'auto' && !subscribed);
      if (shouldPoll) {
        timer = setInterval(() => {
          void pullLatest().catch((error) => {
            options.onError?.(
              toError(error, '[ToolkitJobClient] Failed to query job')
            );
          });
        }, pollInterval);
      }

      try {
        await pullLatest();
      } catch (error) {
        options.onError?.(toError(error, '[ToolkitJobClient] Failed to watch job'));
        stop();
        rejectDone(toError(error, '[ToolkitJobClient] Failed to watch job'));
      }
    })();

    return {
      stop,
      done
    };
  }

  async runToolkitJob(
    operation: ToolkitNativeOperation,
    options: ToolkitJobRunOptions = {}
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
        snapshot.status === 'failed' ||
        (snapshot.status === 'cancelled' && retryOnCancelled);
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

let currentToolkitJobClient: ToolkitJobClient = new ToolkitJobClient();

export const getToolkitJobClient = (): ToolkitJobClient => currentToolkitJobClient;

export const configureToolkitJobClient = (client: ToolkitJobClient): ToolkitJobClient => {
  currentToolkitJobClient = client;
  return currentToolkitJobClient;
};

export const resetToolkitJobClient = (): ToolkitJobClient => {
  currentToolkitJobClient = new ToolkitJobClient(getPlatformRuntime());
  return currentToolkitJobClient;
};
