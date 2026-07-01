import type {
  MagicStudioHostDescriptor,
  MagicStudioHostMode,
} from '@sdkwork/magic-studio-host-types';

export const MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST = '127.0.0.1';
export const MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT = 4318;
export const MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL =
  `http://${MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST}:${MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT}`;
export const MAGIC_STUDIO_DEFAULT_BIND_ADDRESS =
  `${MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST}:${MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT}`;

export type MagicStudioHostConnection = Pick<
  MagicStudioHostDescriptor,
  'kind' | 'host' | 'port' | 'apiBaseUrl'
>;

export function createMagicStudioHostConnection(
  kind: MagicStudioHostMode = 'server',
  overrides: Partial<MagicStudioHostConnection> = {},
): MagicStudioHostConnection {
  return {
    kind,
    host: MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
    port: MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
    apiBaseUrl: MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL,
    ...overrides,
  };
}
