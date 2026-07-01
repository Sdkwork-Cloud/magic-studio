import type {
  MagicStudioAppCapabilityAdapterStatus,
  MagicStudioAppExecutionCapability,
  MagicStudioAppExecutionOperation,
  MagicStudioAppExecutionStatus,
} from '@sdkwork/magic-studio-server';

import type { PlatformRuntime } from '../runtime/types.ts';
import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
  resolveRuntimeMagicStudioServerHostDescriptor,
} from './magicStudioServerRuntime.ts';

export interface RuntimeMagicStudioExecutionCapabilityOptions {
  runtime?: PlatformRuntime;
  feature?: string;
  refresh?: boolean;
}

export interface RuntimeMagicStudioExecutionOperationCapability {
  capabilityKey: string;
  capabilityName: string;
  domain: string;
  pathPrefix: string;
  routeIds: readonly string[];
  operations: readonly string[];
  capabilityExecutionStatus: MagicStudioAppExecutionStatus;
  capabilityAdapterStatus: MagicStudioAppCapabilityAdapterStatus;
  operationKey: string;
  executionStatus: MagicStudioAppExecutionStatus;
  adapterStatus: MagicStudioAppCapabilityAdapterStatus;
  description: string;
}

type CapabilityErrorCode =
  | 'MAGIC_STUDIO_EXECUTION_CAPABILITY_NOT_FOUND'
  | 'MAGIC_STUDIO_EXECUTION_OPERATION_NOT_FOUND'
  | 'MAGIC_STUDIO_EXECUTION_OPERATION_NOT_READY';

const DEFAULT_FEATURE = 'MagicStudioExecutionCapabilityService';

const capabilityRequestCache = new Map<
  string,
  Promise<readonly MagicStudioAppExecutionCapability[]>
>();

function resolveRuntime(
  options: RuntimeMagicStudioExecutionCapabilityOptions = {},
): PlatformRuntime {
  return (
    options.runtime ??
    readDefaultPlatformRuntime(options.feature ?? DEFAULT_FEATURE)
  );
}

function resolveCacheKey(runtime: PlatformRuntime): string {
  return resolveRuntimeMagicStudioServerHostDescriptor(runtime).apiBaseUrl;
}

function createCapabilityError(
  code: CapabilityErrorCode,
  message: string,
  details?: Record<string, unknown>,
): Error & {
  code: CapabilityErrorCode;
  details?: Record<string, unknown>;
} {
  const error = new Error(message) as Error & {
    code: CapabilityErrorCode;
    details?: Record<string, unknown>;
  };
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
}

function findOperationDetail(
  capability: MagicStudioAppExecutionCapability,
  operationKey: string,
): MagicStudioAppExecutionOperation | null {
  if (Array.isArray(capability.operationDetails)) {
    const detail = capability.operationDetails.find(
      (item) => item.key === operationKey,
    );
    if (detail) {
      return detail;
    }
  }

  return capability.operations.includes(operationKey)
    ? {
        key: operationKey,
        executionStatus: capability.executionStatus,
        adapterStatus: capability.adapterStatus,
        description: capability.description,
      }
    : null;
}

export function clearRuntimeMagicStudioExecutionCapabilityCache(): void {
  capabilityRequestCache.clear();
}

export async function readRuntimeMagicStudioExecutionCapabilities(
  options: RuntimeMagicStudioExecutionCapabilityOptions = {},
): Promise<readonly MagicStudioAppExecutionCapability[]> {
  const runtime = resolveRuntime(options);
  const cacheKey = resolveCacheKey(runtime);
  if (options.refresh) {
    capabilityRequestCache.delete(cacheKey);
  }

  let request = capabilityRequestCache.get(cacheKey);
  if (!request) {
    const client = createRuntimeMagicStudioServerClient(runtime);
    request = client
      .listAppExecutionCapabilities()
      .then((response) => response.items ?? []);
    capabilityRequestCache.set(cacheKey, request);
  }

  try {
    return await request;
  } catch (error) {
    capabilityRequestCache.delete(cacheKey);
    throw error;
  }
}

export async function readRuntimeMagicStudioExecutionCapability(
  capabilityKey: string,
  options: RuntimeMagicStudioExecutionCapabilityOptions = {},
): Promise<MagicStudioAppExecutionCapability | null> {
  const capabilities = await readRuntimeMagicStudioExecutionCapabilities(options);
  return capabilities.find((capability) => capability.key === capabilityKey) ?? null;
}

export async function readRuntimeMagicStudioExecutionOperationCapability(
  capabilityKey: string,
  operationKey: string,
  options: RuntimeMagicStudioExecutionCapabilityOptions = {},
): Promise<RuntimeMagicStudioExecutionOperationCapability | null> {
  const capability = await readRuntimeMagicStudioExecutionCapability(
    capabilityKey,
    options,
  );
  if (!capability) {
    return null;
  }

  const detail = findOperationDetail(capability, operationKey);
  if (!detail) {
    return null;
  }

  return {
    capabilityKey: capability.key,
    capabilityName: capability.name,
    domain: capability.domain,
    pathPrefix: capability.pathPrefix,
    routeIds: capability.routeIds,
    operations: capability.operations,
    capabilityExecutionStatus: capability.executionStatus,
    capabilityAdapterStatus: capability.adapterStatus,
    operationKey: detail.key,
    executionStatus: detail.executionStatus,
    adapterStatus: detail.adapterStatus,
    description: detail.description,
  };
}

export async function isRuntimeMagicStudioExecutionOperationReady(
  capabilityKey: string,
  operationKey: string,
  options: RuntimeMagicStudioExecutionCapabilityOptions = {},
): Promise<boolean> {
  const capability = await readRuntimeMagicStudioExecutionOperationCapability(
    capabilityKey,
    operationKey,
    options,
  );
  return capability?.executionStatus === 'ready';
}

export function resolveRuntimeMagicStudioExecutionOperationUnavailableReason(
  capabilityKey: string,
  operationKey: string,
  capability: RuntimeMagicStudioExecutionOperationCapability | null | undefined,
  options: {
    error?: unknown;
    feature?: string;
  } = {},
): string | null {
  const normalizedError =
    options.error instanceof Error
      ? options.error.message.trim()
      : typeof options.error === 'string'
        ? options.error.trim()
        : '';
  if (normalizedError.length > 0) {
    return normalizedError;
  }

  const feature = options.feature ?? DEFAULT_FEATURE;
  if (!capability) {
    return `[${feature}] execution capability ${capabilityKey}/${operationKey} is not defined by the canonical Rust host.`;
  }

  if (capability.executionStatus === 'ready') {
    return null;
  }

  const description = capability.description.trim();
  if (description.length > 0) {
    return description;
  }

  return `[${feature}] ${capability.capabilityName}/${operationKey} is not executable in the current runtime.`;
}

export async function assertRuntimeMagicStudioExecutionOperationReady(
  capabilityKey: string,
  operationKey: string,
  options: RuntimeMagicStudioExecutionCapabilityOptions = {},
): Promise<RuntimeMagicStudioExecutionOperationCapability> {
  const feature = options.feature ?? DEFAULT_FEATURE;
  const capability = await readRuntimeMagicStudioExecutionOperationCapability(
    capabilityKey,
    operationKey,
    options,
  );

  if (!capability) {
    const family = await readRuntimeMagicStudioExecutionCapability(
      capabilityKey,
      options,
    );
    if (!family) {
      throw createCapabilityError(
        'MAGIC_STUDIO_EXECUTION_CAPABILITY_NOT_FOUND',
        `[${feature}] execution capability ${capabilityKey} is not defined by the canonical Rust host.`,
        {
          capabilityKey,
          operationKey,
        },
      );
    }

    throw createCapabilityError(
      'MAGIC_STUDIO_EXECUTION_OPERATION_NOT_FOUND',
      `[${feature}] execution capability ${capabilityKey}/${operationKey} is not defined by the canonical Rust host.`,
      {
        capabilityKey,
        operationKey,
        capabilityName: family.name,
      },
    );
  }

  if (capability.executionStatus !== 'ready') {
    throw createCapabilityError(
      'MAGIC_STUDIO_EXECUTION_OPERATION_NOT_READY',
      `[${feature}] ${capability.capabilityName}/${operationKey} is not executable in the current runtime: ${capability.description}`,
      {
        capabilityKey,
        capabilityName: capability.capabilityName,
        operationKey,
        executionStatus: capability.executionStatus,
        adapterStatus: capability.adapterStatus,
      },
    );
  }

  return capability;
}
