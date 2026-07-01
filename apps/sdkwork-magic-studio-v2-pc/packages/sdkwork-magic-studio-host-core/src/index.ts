export {
  createMagicStudioHostConnection,
  MAGIC_STUDIO_DEFAULT_BIND_ADDRESS,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
} from './descriptor.ts';
export {
  resolveMagicStudioHostConnection,
  resolveMagicStudioLocalApiBaseUrl,
} from './discovery.ts';
export type { MagicStudioHostConnection } from './descriptor.ts';
export type { MagicStudioHostDiscoveryInput } from './discovery.ts';
