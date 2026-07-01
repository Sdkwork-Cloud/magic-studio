import { useCallback, useMemo, useState } from 'react';
import type { SdkworkAppConfig } from './appSdkPort';
import {
    getAppSdkClientConfig,
    getAppSdkClientWithSession,
    initAppSdkClient,
    type AppSdkClient,
} from './useAppSdkClient';

type SdkworkConfig = SdkworkAppConfig;
type SdkworkClient = AppSdkClient;

function initSdkworkClient(config: SdkworkConfig): SdkworkClient {
    if (!config.baseUrl || String(config.baseUrl).trim().length === 0) {
        throw new Error('[SDK] Invalid config: baseUrl is required.');
    }

    return initAppSdkClient(config);
}

function getSdkworkClient(): SdkworkClient {
    return getAppSdkClientWithSession();
}

function hasSdkworkClient(): boolean {
    return getAppSdkClientConfig() !== null;
}

export interface UseSdkworkResult {
    client: SdkworkClient | null;
    isInitialized: boolean;
    isLoading: boolean;
    error: Error | null;
    init: (config: SdkworkConfig) => void;
}

export function useSdkwork(): UseSdkworkResult {
    const [client, setClient] = useState<SdkworkClient | null>(() => {
        if (!hasSdkworkClient()) {
            return null;
        }
        return getSdkworkClient();
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const init = useCallback((config: SdkworkConfig) => {
        setIsLoading(true);
        setError(null);
        try {
            const c = initSdkworkClient(config);
            setClient(c);
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to initialize SDK'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        client,
        isInitialized: client !== null,
        isLoading,
        error,
        init,
    };
}

export function useAppSdkClient(): SdkworkClient | null {
    return useMemo(() => {
        return hasSdkworkClient() ? getSdkworkClient() : null;
    }, []);
}

export interface UseSdkworkModuleResult<T> {
    module: T | null;
    isReady: boolean;
}

export function useSdkworkModule<T>(
    getModule: (client: SdkworkClient) => T
): UseSdkworkModuleResult<T> {
    const module = useMemo(() => {
        try {
            return getModule(getSdkworkClient());
        } catch {
            return null;
        }
    }, [getModule]);

    return {
        module,
        isReady: module !== null,
    };
}

export function useGeneration() {
    return useSdkworkModule((c) => c.generation);
}

export function useAuth() {
    return useSdkworkModule((c) => c.auth);
}

export function useUser() {
    return useSdkworkModule((c) => c.user);
}

export function useAssets() {
    return useSdkworkModule((c) => c.assets);
}

export function useChat() {
    return useSdkworkModule((c) => c.chat);
}

export function useProject() {
    return useSdkworkModule((c) => c.projects);
}

export function useHistory() {
    return useSdkworkModule((c) => c.history);
}

export function useUpload() {
    return useSdkworkModule((c) => c.upload);
}

export function usePayment() {
    return useSdkworkModule((c) => c.payments);
}

export function useVip() {
    return useSdkworkModule((c) => c.vip);
}

export function useOrder() {
    return useSdkworkModule((c) => c.orders);
}

export function useCart() {
    return useSdkworkModule((c) => c.cart);
}

export function useCoupon() {
    return useSdkworkModule((c) => c.coupons);
}

export function useFavorite() {
    return useSdkworkModule((c) => c.favorite);
}

export function useSocial() {
    return useSdkworkModule((c) => c.social);
}

export function useNotification() {
    return useSdkworkModule((c) => c.notification);
}

export function useSettings() {
    return useSdkworkModule((c) => c.settings);
}

export function useSearch() {
    return useSdkworkModule((c) => c.search);
}

export function useModel() {
    return useSdkworkModule((c) => c.model);
}

export function usePrompt() {
    return useSdkworkModule((c) => c.prompt);
}

export function useFeedback() {
    return useSdkworkModule((c) => c.feedback);
}

export function useWorkspace() {
    return useSdkworkModule((c) => c.workspaces);
}

export function useAnalytics() {
    return useSdkworkModule((c) => c.analytics);
}

export function useCategory() {
    return useSdkworkModule((c) => c.category);
}
