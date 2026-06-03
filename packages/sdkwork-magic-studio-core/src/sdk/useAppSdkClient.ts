import { useMemo } from 'react';
import type {
  SdkworkAppConfig,
  SdkworkAppClient as GeneratedAppSdkClient,
} from '@sdkwork/app-sdk';
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

export type { AppRuntimeEnv } from './appSdkEnv';

export type AppSdkClientConfig = AppSdkEnvResolvedConfig;

type CoreAppClient = ReturnType<typeof getAppClient>;
type GeneratedGenerationModule = GeneratedAppSdkClient['generation'];

export interface AppSdkCoverPromptSuggestionsRequest {
  context: string;
  count?: number;
  language?: string;
  styleHints?: string[];
}

export interface AppSdkCoverPromptSuggestionsResponse {
  code?: number;
  data?: {
    prompts?: string[];
  };
  message?: string;
  msg?: string;
}

export type AppSdkGenerationModule = GeneratedGenerationModule & {
  getCoverPromptSuggestions(
    request: AppSdkCoverPromptSuggestionsRequest,
  ): Promise<AppSdkCoverPromptSuggestionsResponse>;
};

export type AppSdkClient = Omit<GeneratedAppSdkClient, 'generation'> & {
  readonly generation: AppSdkGenerationModule;
  readonly assets: GeneratedAppSdkClient['asset'];
  readonly notes: GeneratedAppSdkClient['note'];
  readonly projects: GeneratedAppSdkClient['project'];
  readonly payments: GeneratedAppSdkClient['payment'];
  readonly orders: GeneratedAppSdkClient['order'];
  readonly coupons: GeneratedAppSdkClient['coupon'];
  readonly settings: GeneratedAppSdkClient['setting'];
  readonly workspaces: GeneratedAppSdkClient['workspace'];
  readonly analytics: GeneratedAppSdkClient['analytic'];
};

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
  generation: GeneratedGenerationModule,
): AppSdkGenerationModule {
  const generationWithCompat = generation as Partial<AppSdkGenerationModule>
    & GeneratedGenerationModule;

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
