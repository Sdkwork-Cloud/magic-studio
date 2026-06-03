import { useCallback, useEffect, useState } from 'react';
import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '../platform/toolkit/magicStudioServerRuntime';

type PointsAccountLike = Partial<{
  availablePoints: unknown;
  totalPoints: unknown;
  points: unknown;
}>;

let cachedServerClient:
  | Pick<ReturnType<typeof createRuntimeMagicStudioServerClient>, 'readTradeWallet'>
  | undefined;

function normalizePointsValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getServerClient(): Pick<
  ReturnType<typeof createRuntimeMagicStudioServerClient>,
  'readTradeWallet'
> {
  if (!cachedServerClient) {
    const runtime = readDefaultPlatformRuntime('PointsAccountBalance');
    if (!isMagicStudioServerRuntimeSupported(runtime)) {
      throw new Error(
        '[PointsAccountBalance] Points balance requires the canonical Magic Studio server runtime',
      );
    }
    cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
  }

  return cachedServerClient;
}

export function resolvePointsAccountBalance(
  account: PointsAccountLike | null | undefined,
): number {
  const points = normalizePointsValue(account?.points);
  if (points !== null) {
    return points;
  }

  const availablePoints = normalizePointsValue(account?.availablePoints);
  if (availablePoints !== null) {
    return availablePoints;
  }

  const totalPoints = normalizePointsValue(account?.totalPoints);
  if (totalPoints !== null) {
    return totalPoints;
  }

  return 0;
}

export async function loadPointsAccountBalance(): Promise<number> {
  const response = await getServerClient().readTradeWallet();
  return resolvePointsAccountBalance(response.data);
}

export interface UsePointsAccountBalanceOptions {
  enabled?: boolean;
}

export interface UsePointsAccountBalanceResult {
  pointsBalance: number | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<number | null>;
}

export function usePointsAccountBalance(
  options: UsePointsAccountBalanceOptions = {},
): UsePointsAccountBalanceResult {
  const enabled = options.enabled ?? true;
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (): Promise<number | null> => {
    if (!enabled) {
      setPointsBalance(null);
      setIsLoading(false);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextBalance = await loadPointsAccountBalance();
      setPointsBalance(nextBalance);
      return nextBalance;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Failed to load points account');
      setError(normalizedError);
      setPointsBalance(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    pointsBalance,
    isLoading,
    error,
    refresh,
  };
}
