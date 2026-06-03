import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  isMagicStudioServerClientError,
  isMagicStudioServerResourceNotFoundError,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type { Page } from '@sdkwork/magic-studio-types/pagination';

let cachedServerClient: MagicStudioServerClient | undefined;
const CANONICAL_HISTORY_NOT_FOUND_CODES = [
  'APP_GENERATION_TASK_NOT_FOUND',
  'CREATION_HISTORY_ENTRY_NOT_FOUND',
] as const;

export function getCanonicalMagicStudioServerClient(
  feature: string,
): MagicStudioServerClient {
  if (!cachedServerClient) {
    const runtime = readDefaultPlatformRuntime(feature);
    if (!isMagicStudioServerRuntimeSupported(runtime)) {
      throw new Error(
        `[${feature}] canonical Magic Studio server access requires the Magic Studio server runtime.`,
      );
    }
    cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
  }

  return cachedServerClient;
}

export function toServerClientErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function toServerClientErrorCode(error: unknown): number {
  if (isMagicStudioServerClientError(error)) {
    return error.status;
  }
  return 500;
}

export function isServerClientNotFound(error: unknown): boolean {
  return isMagicStudioServerResourceNotFoundError(
    error,
    CANONICAL_HISTORY_NOT_FOUND_CODES,
  );
}

export function toPageEnvelope<TItem>(
  items: TItem[],
  page: number,
  size: number,
  total: number,
): Page<TItem> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / size);
  return {
    content: items,
    pageable: {
      pageNumber: page,
      pageSize: size,
      offset: page * size,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: totalPages === 0 ? true : page >= totalPages - 1,
    totalPages,
    totalElements: total,
    size,
    number: page,
    sort: { sorted: true, unsorted: false, empty: false },
    first: page === 0,
    numberOfElements: items.length,
    empty: items.length === 0,
  };
}
