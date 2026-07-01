import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-commons';

import { TrackRulesFactory } from '../src/domain/dnd/TrackRulesFactory';
import { TrackFactory } from '../src/services/TrackFactory';

describe('TrackFactory', () => {
  it('returns explicit defaults for subtitle tracks', () => {
    const config = TrackFactory.getTrackConfig('subtitle');

    expect(config.type).toBe('subtitle');
    expect(config.height).toBe(40);
    expect(config.name).toMatch(/(Subtitle Track|\u5b57\u5e55\u8f68\u9053)/);
  });

  it('treats subtitle tracks like text tracks for drop compatibility', () => {
    const rules = TrackRulesFactory.getRules('subtitle');

    expect(rules.isCompatible(MediaResourceType.SUBTITLE)).toBe(true);
    expect(rules.isCompatible(MediaResourceType.TEXT)).toBe(true);
    expect(rules.isCompatible(MediaResourceType.VIDEO)).toBe(false);
  });
});
