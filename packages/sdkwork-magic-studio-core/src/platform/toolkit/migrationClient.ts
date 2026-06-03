import type { PlatformRuntime } from '../runtime/types.ts';
import type {
  MagicStudioAppliedMigration,
  MagicStudioMigrationApplyResult,
  MagicStudioMigrationPlan,
  MagicStudioMigrationScript,
  MagicStudioMigrationStatus,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from './magicStudioServerRuntime.ts';

export type MigrationScript = MagicStudioMigrationScript;
export type MigrationPlan = MagicStudioMigrationPlan;
export type AppliedMigration = MagicStudioAppliedMigration;
export type MigrationStatus = MagicStudioMigrationStatus;
export type MigrationApplyResult = MagicStudioMigrationApplyResult;

type MigrationServerClient = Pick<
  MagicStudioServerClient,
  'applyMigrations' | 'readMigrationStatus'
>;

export interface MigrationClientOptions {
  serverClient?: MagicStudioServerClient;
}

export class MigrationClient {
  private readonly runtime: PlatformRuntime;
  private readonly serverClient: MigrationServerClient;

  constructor(
    runtime: PlatformRuntime = readDefaultPlatformRuntime('MigrationClient'),
    options: MigrationClientOptions = {},
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
        `[MigrationClient] ${feature} requires rust server runtime support`
      );
    }
  }

  async status(dbPath: string): Promise<MigrationStatus> {
    this.ensureSupported('status');
    const response = await this.serverClient.readMigrationStatus({ dbPath });
    return response.data;
  }

  async apply(dbPath: string, plan: MigrationPlan): Promise<MigrationApplyResult> {
    this.ensureSupported('apply');
    const response = await this.serverClient.applyMigrations({
      dbPath,
      plan: {
        dryRun: plan.dryRun ?? false,
        scripts: plan.scripts,
      },
    });
    return response.data;
  }
}

let currentMigrationClient: MigrationClient | null = null;

export const getMigrationClient = (): MigrationClient => {
  if (!currentMigrationClient) {
    currentMigrationClient = new MigrationClient();
  }
  return currentMigrationClient;
};

export const configureMigrationClient = (
  client: MigrationClient
): MigrationClient => {
  currentMigrationClient = client;
  return currentMigrationClient;
};

export const resetMigrationClient = (): MigrationClient => {
  currentMigrationClient = new MigrationClient();
  return currentMigrationClient;
};
