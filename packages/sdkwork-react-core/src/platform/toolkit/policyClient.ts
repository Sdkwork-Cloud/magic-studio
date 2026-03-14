import { getPlatformRuntime } from '../runtime';
import type { PlatformRuntime } from '../runtime';

export type PolicyPathAccessType = 'read' | 'write' | 'ensureDir';

export interface PolicyValidationResult {
  allowed: boolean;
  code?: string | null;
  reason?: string | null;
  matchedRule?: string | null;
}

export interface PolicySnapshot {
  allowDangerousCommands: boolean;
  allowSystemPaths: boolean;
  blockedCommands: string[];
  blockedPathPrefixes: string[];
  preferredWorkRoots: string[];
}

const toPolicyError = (
  result: PolicyValidationResult,
  fallbackMessage: string
): Error => {
  const message = result.reason || fallbackMessage;
  const code = result.code ? `[${result.code}] ` : '';
  return new Error(`${code}${message}`);
};

export class PolicyClient {
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
        `[PolicyClient] ${feature} requires desktop runtime with native bridge`
      );
    }
  }

  async validatePath(
    path: string,
    access: PolicyPathAccessType
  ): Promise<PolicyValidationResult> {
    this.ensureSupported('validatePath');
    return this.runtime.bridge.invoke<PolicyValidationResult>(
      'policy_validate_path',
      {
        path,
        access
      }
    );
  }

  async validateCommand(name: string): Promise<PolicyValidationResult> {
    this.ensureSupported('validateCommand');
    return this.runtime.bridge.invoke<PolicyValidationResult>(
      'policy_validate_command',
      { name }
    );
  }

  async snapshot(): Promise<PolicySnapshot> {
    this.ensureSupported('snapshot');
    return this.runtime.bridge.invoke<PolicySnapshot>('policy_snapshot');
  }

  async ensurePathAllowed(
    path: string,
    access: PolicyPathAccessType
  ): Promise<void> {
    const result = await this.validatePath(path, access);
    if (!result.allowed) {
      throw toPolicyError(result, 'path is blocked by policy');
    }
  }

  async ensureCommandAllowed(name: string): Promise<void> {
    const result = await this.validateCommand(name);
    if (!result.allowed) {
      throw toPolicyError(result, 'command is blocked by policy');
    }
  }
}

let currentPolicyClient: PolicyClient = new PolicyClient();

export const getPolicyClient = (): PolicyClient => currentPolicyClient;

export const configurePolicyClient = (client: PolicyClient): PolicyClient => {
  currentPolicyClient = client;
  return currentPolicyClient;
};

export const resetPolicyClient = (): PolicyClient => {
  currentPolicyClient = new PolicyClient(getPlatformRuntime());
  return currentPolicyClient;
};
