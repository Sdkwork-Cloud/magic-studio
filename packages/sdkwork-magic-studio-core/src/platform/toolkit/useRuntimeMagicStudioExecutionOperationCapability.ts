import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  RuntimeMagicStudioExecutionCapabilityOptions,
  RuntimeMagicStudioExecutionOperationCapability,
} from './magicStudioServerCapabilities.ts';
import {
  readRuntimeMagicStudioExecutionOperationCapability,
  resolveRuntimeMagicStudioExecutionOperationUnavailableReason,
} from './magicStudioServerCapabilities.ts';

const DEFAULT_FEATURE = 'MagicStudioExecutionCapabilityHook';

function toCapabilityError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    typeof error === 'string'
      ? error
      : 'Failed to load canonical runtime execution capability.',
  );
}

export interface UseRuntimeMagicStudioExecutionOperationCapabilityOptions
  extends RuntimeMagicStudioExecutionCapabilityOptions {
  enabled?: boolean;
}

export interface UseRuntimeMagicStudioExecutionOperationCapabilityResult {
  capability: RuntimeMagicStudioExecutionOperationCapability | null;
  ready: boolean;
  isLoading: boolean;
  error: Error | null;
  unavailableReason: string | null;
  disabledReason: string | null;
  refresh: () => Promise<RuntimeMagicStudioExecutionOperationCapability | null>;
}

export function useRuntimeMagicStudioExecutionOperationCapability(
  capabilityKey: string,
  operationKey: string,
  options: UseRuntimeMagicStudioExecutionOperationCapabilityOptions = {},
): UseRuntimeMagicStudioExecutionOperationCapabilityResult {
  const enabled = options.enabled ?? true;
  const runtime = options.runtime;
  const feature = options.feature ?? DEFAULT_FEATURE;
  const requestIdRef = useRef(0);
  const [capability, setCapability] =
    useState<RuntimeMagicStudioExecutionOperationCapability | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const loadCapability = useCallback(
    async (
      refresh = false,
    ): Promise<RuntimeMagicStudioExecutionOperationCapability | null> => {
      const requestId = ++requestIdRef.current;

      if (!enabled) {
        setCapability(null);
        setError(null);
        setIsLoading(false);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextCapability =
          await readRuntimeMagicStudioExecutionOperationCapability(
            capabilityKey,
            operationKey,
            {
              runtime,
              feature,
              refresh,
            },
          );

        if (requestId === requestIdRef.current) {
          setCapability(nextCapability);
        }

        return nextCapability;
      } catch (error) {
        const normalizedError = toCapabilityError(error);
        if (requestId === requestIdRef.current) {
          setCapability(null);
          setError(normalizedError);
        }
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [capabilityKey, enabled, feature, operationKey, runtime],
  );

  useEffect(() => {
    void loadCapability(false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadCapability]);

  const refresh = useCallback(async () => loadCapability(true), [loadCapability]);

  const ready = enabled && capability?.executionStatus === 'ready';
  const unavailableReason = useMemo(() => {
    if (!enabled) {
      return null;
    }

    return resolveRuntimeMagicStudioExecutionOperationUnavailableReason(
      capabilityKey,
      operationKey,
      capability,
      {
        error,
        feature,
      },
    );
  }, [capability, capabilityKey, enabled, error, feature, operationKey]);
  const disabledReason = useMemo(() => {
    if (!enabled || ready) {
      return null;
    }

    if (isLoading) {
      return 'Checking canonical runtime capability...';
    }

    return unavailableReason;
  }, [enabled, isLoading, ready, unavailableReason]);

  return {
    capability,
    ready,
    isLoading,
    error,
    unavailableReason,
    disabledReason,
    refresh,
  };
}
