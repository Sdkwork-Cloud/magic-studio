import { describe, expect, it } from 'vitest';

import { buildVideoModeAvailabilityByModel } from './constants';

describe('buildVideoModeAvailabilityByModel', () => {
  it('enables image-to-video for the dedicated Wan I2V model', () => {
    const availability = buildVideoModeAvailabilityByModel('wan2.2-i2v-plus');

    expect(availability['image-to-video']).toEqual(
      expect.objectContaining({
        enabled: true,
      })
    );
  });

  it('enables video-to-video for kling v2.1 master', () => {
    const availability = buildVideoModeAvailabilityByModel('kling-v2.1-master');

    expect(availability['video-to-video']).toEqual(
      expect.objectContaining({
        enabled: true,
      })
    );
  });

  it('enables extend for kling v2.1 master', () => {
    const availability = buildVideoModeAvailabilityByModel('kling-v2.1-master');

    expect(availability.extend).toEqual(
      expect.objectContaining({
        enabled: true,
      })
    );
  });

  it('keeps face-swap disabled because the UI flow is still not implemented', () => {
    const availability = buildVideoModeAvailabilityByModel('kling-v2.1-master');

    expect(availability['face-swap']).toEqual(
      expect.objectContaining({
        enabled: false,
        reason: 'Coming soon: this mode is not implemented in UI yet',
      })
    );
  });
});
