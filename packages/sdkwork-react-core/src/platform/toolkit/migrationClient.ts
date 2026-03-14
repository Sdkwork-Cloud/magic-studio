import { getPlatformRuntime } from '../runtime';
import type { PlatformRuntime } from '../runtime';

export interface MigrationScript {
  version: number;
  name: string;
  sql: string;
  checksum?: string | null;
}

export interface MigrationPlan {
  dryRun?: boolean;
  scripts: MigrationScript[];
}

export interface AppliedMigration {
  version: number;
  name: string;
  checksum: string;
  appliedAtMs: number;
}

export interface MigrationStatus {
  currentVersion: number;
  migrations: AppliedMigration[];
}

export interface MigrationApplyResult {
  fromVersion: number;
  toVersion: number;
  appliedVersions: number[];
  skippedVersions: number[];
  dryRun: boolean;
}

export class MigrationClient {
  private readonly runtime: PlatformRuntime;

  constructor(runtime: PlatformRuntime = getPlatformRuntime()) {
    this.runtime = runtime;
  }

  isSupported(): boolean {
    return this.runtime.system.kind() === 'desktop' && this.runtime.bridge.available();
  }

  private ensureSupported(feature: string): void {
    if (!this.isSupported()) {
      throw new Error(
        `[MigrationClient] ${feature} requires desktop runtime with native bridge`
      );
    }
  }

  async status(dbPath: string): Promise<MigrationStatus> {
    this.ensureSupported('status');
    return this.runtime.bridge.invoke<MigrationStatus>('migration_status', {
      dbPath
    });
  }

  async apply(dbPath: string, plan: MigrationPlan): Promise<MigrationApplyResult> {
    this.ensureSupported('apply');
    return this.runtime.bridge.invoke<MigrationApplyResult>('migration_apply', {
      dbPath,
      plan: {
        dryRun: plan.dryRun ?? false,
        scripts: plan.scripts
      }
    });
  }
}

let currentMigrationClient: MigrationClient = new MigrationClient();

export const getMigrationClient = (): MigrationClient => currentMigrationClient;

export const configureMigrationClient = (
  client: MigrationClient
): MigrationClient => {
  currentMigrationClient = client;
  return currentMigrationClient;
};

export const resetMigrationClient = (): MigrationClient => {
  currentMigrationClient = new MigrationClient(getPlatformRuntime());
  return currentMigrationClient;
};
