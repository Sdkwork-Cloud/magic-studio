import { describe, expect, it } from 'vitest';

import type { Presentation } from '../entities';
import {
  findPresentationByKey,
  removePresentationByKey,
  replacePresentationByKey,
} from './presentationIdentity';

const createPresentation = (id: string, uuid: string, title: string): Presentation => ({
  id,
  uuid,
  title,
  createdAt: 1,
  updatedAt: 1,
  theme: 'modern',
  slides: [],
});

describe('presentationIdentity', () => {
  it('finds presentations by uuid first with id fallback', () => {
    const presentations = [
      createPresentation('presentation-db-1', 'presentation-uuid-1', 'First'),
      createPresentation('presentation-db-2', 'presentation-uuid-2', 'Second'),
    ];

    expect(findPresentationByKey(presentations, 'presentation-uuid-1')?.title).toBe('First');
    expect(findPresentationByKey(presentations, 'presentation-db-2')?.title).toBe('Second');
  });

  it('replaces presentations by uuid key', () => {
    const presentations = [
      createPresentation('presentation-db-1', 'presentation-uuid-1', 'First'),
      createPresentation('presentation-db-2', 'presentation-uuid-2', 'Second'),
    ];

    const next = replacePresentationByKey(
      presentations,
      'presentation-uuid-2',
      createPresentation('presentation-db-2', 'presentation-uuid-2', 'Second Updated')
    );

    expect(next[1]?.title).toBe('Second Updated');
  });

  it('removes presentations by uuid key', () => {
    const presentations = [
      createPresentation('presentation-db-1', 'presentation-uuid-1', 'First'),
      createPresentation('presentation-db-2', 'presentation-uuid-2', 'Second'),
    ];

    expect(removePresentationByKey(presentations, 'presentation-uuid-1')).toEqual([
      expect.objectContaining({ uuid: 'presentation-uuid-2' }),
    ]);
  });
});
