import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';

import { TrackRulesFactory } from '../src/domain/dnd/TrackRulesFactory';
import { TrackFactory } from '../src/services/TrackFactory';

describe('TrackFactory', () => {
  it('returns explicit defaults for subtitle tracks', () => {
    expect(TrackFactory.getTrackConfig('subtitle')).toEqual({
      type: 'subtitle',
      height: 40,
      name: 'Subtitle Track',
    });
  });

  it('treats subtitle tracks like text tracks for drop compatibility', () => {
    const rules = TrackRulesFactory.getRules('subtitle');

    expect(rules.isCompatible(MediaResourceType.SUBTITLE)).toBe(true);
    expect(rules.isCompatible(MediaResourceType.TEXT)).toBe(true);
    expect(rules.isCompatible(MediaResourceType.VIDEO)).toBe(false);
  });
});
