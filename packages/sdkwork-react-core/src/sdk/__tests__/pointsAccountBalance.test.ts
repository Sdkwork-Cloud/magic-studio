import { afterEach, describe, expect, it, vi } from 'vitest';

const getAppSdkClientWithSession = vi.fn();

vi.mock('../useAppSdkClient', () => ({
  getAppSdkClientWithSession,
}));

describe('points account balance', () => {
  afterEach(() => {
    vi.resetModules();
    getAppSdkClientWithSession.mockReset();
  });

  it('loads the available points balance from the points account endpoint', async () => {
    getAppSdkClientWithSession.mockReturnValue({
      account: {
        getPoints: vi.fn(async () => ({
          data: {
            availablePoints: 2468,
            totalPoints: 3000,
          },
        })),
      },
    });

    const { loadPointsAccountBalance } = await import('../pointsAccountBalance');

    await expect(loadPointsAccountBalance()).resolves.toBe(2468);
  });

  it('falls back to total points when the available balance is absent', async () => {
    getAppSdkClientWithSession.mockReturnValue({
      account: {
        getPoints: vi.fn(async () => ({
          data: {
            totalPoints: 512,
          },
        })),
      },
    });

    const { loadPointsAccountBalance } = await import('../pointsAccountBalance');

    await expect(loadPointsAccountBalance()).resolves.toBe(512);
  });
});
