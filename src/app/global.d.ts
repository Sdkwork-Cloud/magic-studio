import type { PlatformRuntime } from '@sdkwork/magic-studio-core/platform';

/**
 * Global type declarations for the injected runtime capability and Upload Helper.
 *
 * These APIs are injected onto the `window` object during application startup
 * through `bootstrap.ts` and are consumed by the `@sdkwork/magic-studio-commons`
 * and `@sdkwork/magic-studio-fs` packages.
 */

/**
 * Upload Helper contract.
 */
interface UploadHelper {
  pickFiles(multiple: boolean, accept: string, compress: boolean): Promise<any[]>;
}

declare global {
  interface Window {
    /**
     * Global platform runtime injected by `bootstrap.ts` for packages that
     * need standardized access to runtime capabilities without importing the
     * platform manager eagerly.
     */
    __sdkworkPlatformRuntime: PlatformRuntime;

    /**
     * Global Upload Helper instance provided by `@sdkwork/magic-studio-core`
     * and injected in `bootstrap.ts`.
     */
    __sdkworkUploadHelper: UploadHelper;
  }
}

// Export types for reuse in other files.
export type { PlatformRuntime, UploadHelper };
