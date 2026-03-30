import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('app sdk auth recovery', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('retries once after the registered recovery handler restores the session', async () => {
    const sdkClientModule = await import('../useAppSdkClient');
    const recoveryHandler = vi.fn(async () => ({ recovered: true }));
    const unregister = sdkClientModule.registerAppSdkSessionRecoveryHandler(recoveryHandler);

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error('未授权'), {
        name: 'BusinessError',
        httpStatus: 401,
      }))
      .mockResolvedValueOnce('ok');

    await expect(sdkClientModule.runWithAppSdkAuthRecovery(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(recoveryHandler).toHaveBeenCalledTimes(1);

    unregister();
  });

  it('returns the original authorization error when recovery cannot restore the session', async () => {
    const sdkClientModule = await import('../useAppSdkClient');
    const recoveryHandler = vi.fn(async () => ({ recovered: false }));
    const unregister = sdkClientModule.registerAppSdkSessionRecoveryHandler(recoveryHandler);

    const error = Object.assign(new Error('未授权'), {
      name: 'BusinessError',
      businessCode: '401',
    });
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(error);

    await expect(sdkClientModule.runWithAppSdkAuthRecovery(operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(recoveryHandler).toHaveBeenCalledTimes(1);

    unregister();
  });

  it('recognizes app sdk authorization errors from common business error shapes', async () => {
    const sdkClientModule = await import('../useAppSdkClient');

    expect(sdkClientModule.isAppSdkAuthorizationError({
      httpStatus: 401,
    })).toBe(true);
    expect(sdkClientModule.isAppSdkAuthorizationError({
      businessCode: 'TOKEN_EXPIRED',
    })).toBe(true);
    expect(sdkClientModule.isAppSdkAuthorizationError(new Error('未授权'))).toBe(true);
    expect(sdkClientModule.isAppSdkAuthorizationError(new Error('network down'))).toBe(false);
  });
});
