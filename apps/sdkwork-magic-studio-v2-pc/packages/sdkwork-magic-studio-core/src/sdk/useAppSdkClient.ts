import { useMemo } from 'react';
import {
  createDriveAppClient,
  type SdkworkDriveAppClient,
} from '@sdkwork/drive-app-sdk';
import {
  applyAppClientSessionTokens,
  createScopedAppClient,
  decorateAppClientCompatAliases,
  getAppClient,
  getAppClientConfig,
  getAppClientWithSession,
  initAppClient,
  resolveAppClientAccessToken,
  SDKWORK_PC_REACT_DEFAULT_APP_CLIENT_COMPAT_ALIASES,
} from '@sdkwork/core-pc-react/app';
import {
  clearPcReactRuntimeSession,
  persistPcReactRuntimeSession,
  readPcReactRuntimeSession,
  resetPcReactRuntime,
} from '@sdkwork/core-pc-react/runtime';
import {
  createAppSdkClientConfigFromEnv,
  readAppSdkEnv,
  type AppSdkEnvResolvedConfig,
} from './appSdkEnv';
import type {
  AppSdkClient,
  AppSdkCoverPromptSuggestionsRequest,
  AppSdkCoverPromptSuggestionsResponse,
  AppSdkGenerationModule,
  MagicStudioGenerationModule,
  SdkworkAppConfig,
} from './appSdkPort';

export type { AppRuntimeEnv } from './appSdkEnv';
export type {
  AppSdkClient,
  AppSdkCoverPromptSuggestionsRequest,
  AppSdkCoverPromptSuggestionsResponse,
  AppSdkGenerationModule,
} from './appSdkPort';

export type AppSdkClientConfig = AppSdkEnvResolvedConfig;

type CoreAppClient = ReturnType<typeof getAppClient>;
export type DriveAppSdkClient = SdkworkDriveAppClient;

export interface AppSdkSessionTokens {
  authToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeStringList = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
};

function decorateGenerationCompatAliases(
  generation: MagicStudioGenerationModule,
): AppSdkGenerationModule {
  const generationWithCompat = generation as Partial<AppSdkGenerationModule>
    & MagicStudioGenerationModule;

  if (typeof generationWithCompat.getCoverPromptSuggestions !== 'function') {
    Object.defineProperty(generationWithCompat, 'getCoverPromptSuggestions', {
      configurable: true,
      enumerable: false,
      value: async (
        request: AppSdkCoverPromptSuggestionsRequest,
      ): Promise<AppSdkCoverPromptSuggestionsResponse> => {
        const response = await generationWithCompat.enhanceGenerationPrompt({
          prompt: request.context,
          scene: 'asset-cover',
          style: normalizeStringList(request.styleHints).join(', ') || undefined,
          language: normalizeText(request.language),
          maxWords: 180,
        });
        const enhancedPrompt = normalizeText(response.data?.prompt);

        return {
          code: response.code,
          message: normalizeText(response.message) ?? normalizeText(response.msg),
          msg: normalizeText(response.msg),
          data: {
            prompts: enhancedPrompt ? [enhancedPrompt] : [],
          },
        };
      },
    });
  }

  return generationWithCompat as AppSdkGenerationModule;
}

function ensureAppSdkClientCompat(client: CoreAppClient): AppSdkClient {
  const appClient = decorateAppClientCompatAliases(
    client,
    SDKWORK_PC_REACT_DEFAULT_APP_CLIENT_COMPAT_ALIASES,
  ) as unknown as AppSdkClient;

  decorateGenerationCompatAliases(appClient.generation);

  return appClient;
}

export function createAppSdkClientConfig(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClientConfig {
  return createAppSdkClientConfigFromEnv(readAppSdkEnv(), overrides);
}

export function initAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
  return ensureAppSdkClientCompat(initAppClient(overrides));
}

export function getAppSdkClient(): AppSdkClient {
  return ensureAppSdkClientCompat(getAppClient());
}

export function getAppSdkClientConfig(): AppSdkClientConfig | null {
  return getAppClientConfig() as AppSdkClientConfig | null;
}

export function resolveAppSdkAccessToken(): string {
  return resolveAppClientAccessToken();
}

export function resetAppSdkClient(): void {
  resetPcReactRuntime({
    clearStorage: false,
    clearConfiguration: false,
  });
}

export function applyAppSdkSessionTokens(tokens: {
  authToken?: string;
  accessToken?: string;
}): void {
  applyAppClientSessionTokens(tokens);
}

export function readAppSdkSessionTokens(): AppSdkSessionTokens {
  const session = readPcReactRuntimeSession();
  return {
    authToken: session.authToken,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

export function persistAppSdkSessionTokens(tokens: AppSdkSessionTokens): void {
  persistPcReactRuntimeSession(tokens);
}

export function clearAppSdkSessionTokens(): void {
  void clearPcReactRuntimeSession();
}

export function createScopedAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
  return ensureAppSdkClientCompat(createScopedAppClient(overrides));
}

export function getAppSdkClientWithSession(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
  return Object.keys(overrides).length > 0
    ? ensureAppSdkClientCompat(createScopedAppClient(overrides))
    : ensureAppSdkClientCompat(getAppClientWithSession());
}

const applyDriveAppSdkSessionTokens = (
  client: SdkworkDriveAppClient,
  tokens: AppSdkSessionTokens,
): void => {
  if (tokens.authToken?.trim()) {
    client.setAuthToken(tokens.authToken.trim().replace(/^Bearer\s+/iu, ''));
  }
  if (tokens.accessToken?.trim()) {
    client.setAccessToken(tokens.accessToken.trim().replace(/^Bearer\s+/iu, ''));
  }
};

export function getDriveAppSdkClientWithSession(
  overrides: Partial<SdkworkAppConfig> = {},
): DriveAppSdkClient {
  const sessionTokens = readAppSdkSessionTokens();
  const client = createDriveAppClient(
    createAppSdkClientConfig({
      ...overrides,
      authToken: overrides.authToken ?? sessionTokens.authToken,
      accessToken: overrides.accessToken ?? sessionTokens.accessToken,
    }),
  );
  applyDriveAppSdkSessionTokens(client, sessionTokens);
  return client;
}

const serializeAppSdkOverrides = (overrides: Partial<SdkworkAppConfig>): string =>
  JSON.stringify(overrides || {});

const deserializeAppSdkOverrides = (serialized: string): Partial<SdkworkAppConfig> =>
  serialized && serialized !== '{}'
    ? (JSON.parse(serialized) as Partial<SdkworkAppConfig>)
    : {};

export function useAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
  const key = serializeAppSdkOverrides(overrides);

  return useMemo(
    () => getAppSdkClientWithSession(deserializeAppSdkOverrides(key)),
    [key]
  );
}
