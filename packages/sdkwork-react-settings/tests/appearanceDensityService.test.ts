import { describe, expect, it } from 'vitest';

describe('appearanceDensityService', () => {
  it('recommends compact density for narrow windows', async () => {
    const { recommendAppearanceDensity } = await import('../src/services/appearanceDensityService');

    expect(
      recommendAppearanceDensity({
        windowWidth: 1200,
        devicePixelRatio: 1,
      }),
    ).toBe('compact');
  });

  it('caps auto recommendation at standard on scaled displays', async () => {
    const { recommendAppearanceDensity } = await import('../src/services/appearanceDensityService');

    expect(
      recommendAppearanceDensity({
        windowWidth: 1920,
        devicePixelRatio: 1.5,
      }),
    ).toBe('standard');
  });

  it('applies auto density as persisted shell metrics', async () => {
    const { applyAppearanceDensityMode } = await import('../src/services/appearanceDensityService');

    const result = applyAppearanceDensityMode(
      {
        theme: 'dark',
        themeColor: 'lobster',
        fontFamily: 'Inter',
        fontSize: 13,
        lineHeight: 1.5,
        sidebarPosition: 'left',
        densityMode: 'standard',
      },
      'auto',
      {
        windowWidth: 1920,
        devicePixelRatio: 1,
      },
    );

    expect(result.densityMode).toBe('auto');
    expect(result.fontSize).toBe(14);
    expect(result.lineHeight).toBe(1.6);
  });

  it('marks manual typography overrides as custom density', async () => {
    const { applyManualAppearanceMetrics } = await import('../src/services/appearanceDensityService');

    const result = applyManualAppearanceMetrics(
      {
        theme: 'dark',
        themeColor: 'lobster',
        fontFamily: 'Inter',
        fontSize: 13,
        lineHeight: 1.5,
        sidebarPosition: 'left',
        densityMode: 'standard',
      },
      {
        fontSize: 15,
      },
    );

    expect(result.densityMode).toBe('custom');
    expect(result.fontSize).toBe(15);
    expect(result.lineHeight).toBe(1.5);
  });
});
