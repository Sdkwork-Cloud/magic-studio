import type { PlatformRuntime } from '../runtime/types.ts';
import type {
  MagicStudioPolicyAccessType,
  MagicStudioPolicySnapshot,
  MagicStudioPolicyValidationResult,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from './magicStudioServerRuntime.ts';

export type PolicyPathAccessType = MagicStudioPolicyAccessType;
export type PolicyValidationResult = MagicStudioPolicyValidationResult;
export type PolicySnapshot = MagicStudioPolicySnapshot;

const toPolicyError = (
  result: PolicyValidationResult,
  fallbackMessage: string
): Error => {
  const message = result.reason || fallbackMessage;
  const code = result.code ? `[${result.code}] ` : '';
  return new Error(`${code}${message}`);
};

type PolicyServerClient = Pick<
  MagicStudioServerClient,
  'readPolicySnapshot' | 'validatePolicyCommand' | 'validatePolicyPath'
>;

export interface PolicyClientOptions {
  serverClient?: MagicStudioServerClient;
}

export class PolicyClient {
  private readonly runtime: PlatformRuntime;
  private readonly serverClient: PolicyServerClient;

  constructor(
    runtime: PlatformRuntime = readDefaultPlatformRuntime('PolicyClient'),
    options: PolicyClientOptions = {},
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
        `[PolicyClient] ${feature} requires rust server runtime support`
      );
    }
  }

  async validatePath(
    path: string,
    access: PolicyPathAccessType
  ): Promise<PolicyValidationResult> {
    this.ensureSupported('validatePath');
    const response = await this.serverClient.validatePolicyPath({
      path,
      access,
    });
    return response.data;
  }

  async validateCommand(name: string): Promise<PolicyValidationResult> {
    this.ensureSupported('validateCommand');
    const response = await this.serverClient.validatePolicyCommand({ name });
    return response.data;
  }

  async snapshot(): Promise<PolicySnapshot> {
    this.ensureSupported('snapshot');
    const response = await this.serverClient.readPolicySnapshot();
    return response.data;
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

let currentPolicyClient: PolicyClient | null = null;

export const getPolicyClient = (): PolicyClient => {
  if (!currentPolicyClient) {
    currentPolicyClient = new PolicyClient();
  }
  return currentPolicyClient;
};

export const configurePolicyClient = (client: PolicyClient): PolicyClient => {
  currentPolicyClient = client;
  return currentPolicyClient;
};

export const resetPolicyClient = (): PolicyClient => {
  currentPolicyClient = new PolicyClient();
  return currentPolicyClient;
};
