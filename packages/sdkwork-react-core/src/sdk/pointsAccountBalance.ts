import { useCallback, useEffect, useState } from 'react';
import type { PointsAccountInfoVO, PlusApiResultPointsAccountInfoVO } from '@sdkwork/app-sdk';
import { getAppSdkClientWithSession } from './useAppSdkClient';

function normalizePointsValue(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function resolvePointsAccountBalance(account: Partial<PointsAccountInfoVO> | null | undefined): number {
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
    const response = await getAppSdkClientWithSession().account.getPoints();
    const data = (response as PlusApiResultPointsAccountInfoVO | undefined)?.data;
    return resolvePointsAccountBalance(data);
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
    options: UsePointsAccountBalanceOptions = {}
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
            const normalizedError = error instanceof Error
                ? error
                : new Error('Failed to load points account');
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
