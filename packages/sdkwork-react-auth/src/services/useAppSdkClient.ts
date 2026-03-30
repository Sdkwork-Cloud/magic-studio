import { useMemo } from 'react';
import type { SdkworkAppClient, SdkworkAppConfig } from '@sdkwork/app-sdk';
import {
    APP_SDK_AUTH_TOKEN_STORAGE_KEY,
    APP_SDK_ACCESS_TOKEN_STORAGE_KEY,
    APP_SDK_REFRESH_TOKEN_STORAGE_KEY,
    createAppSdkClientConfig,
    initAppSdkClient,
    getAppSdkClient,
    getAppSdkClientConfig,
    resolveAppSdkAccessToken,
    resetAppSdkClient,
    applyAppSdkSessionTokens,
    readAppSdkSessionTokens,
    persistAppSdkSessionTokens,
    clearAppSdkSessionTokens,
    getAppSdkClientWithSession,
    hasAppSdkAuthSession,
    isAppSdkAuthorizationError,
    registerAppSdkSessionRecoveryHandler,
    runWithAppSdkAuthRecovery,
    type AppRuntimeEnv,
    type AppSdkClientConfig,
    type AppSdkSessionTokens,
} from '@sdkwork/react-core';

export type { AppRuntimeEnv, AppSdkClientConfig, AppSdkSessionTokens };
export {
    APP_SDK_AUTH_TOKEN_STORAGE_KEY,
    APP_SDK_ACCESS_TOKEN_STORAGE_KEY,
    APP_SDK_REFRESH_TOKEN_STORAGE_KEY,
    createAppSdkClientConfig,
    initAppSdkClient,
    getAppSdkClient,
    getAppSdkClientConfig,
    resolveAppSdkAccessToken,
    resetAppSdkClient,
    applyAppSdkSessionTokens,
    readAppSdkSessionTokens,
    persistAppSdkSessionTokens,
    clearAppSdkSessionTokens,
    getAppSdkClientWithSession,
    hasAppSdkAuthSession,
    isAppSdkAuthorizationError,
    registerAppSdkSessionRecoveryHandler,
    runWithAppSdkAuthRecovery,
};

export function useAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): SdkworkAppClient {
    const key = JSON.stringify(overrides || {});
    return useMemo(() => getAppSdkClientWithSession(overrides), [key]);
}
