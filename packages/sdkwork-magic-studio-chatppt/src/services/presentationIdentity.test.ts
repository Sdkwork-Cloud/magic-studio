import { describe, expect, it } from 'vitest';

import {
  createPresentationDraft,
  createPresentationSlide,
  normalizePresentation,
} from './presentationIdentity';

describe('presentationIdentity', () => {
  it('creates a presentation draft with stable slide and element identities', () => {
    const presentation = createPresentationDraft('AGI Native Deck');

    expect(presentation.id).toBeNull();
    expect(presentation.uuid).toEqual(expect.any(String));
    expect(presentation.slides).toHaveLength(1);
    expect(presentation.slides[0]?.id).toBeNull();
    expect(presentation.slides[0]?.uuid).toEqual(expect.any(String));
    expect(presentation.slides[0]?.elements[0]?.id).toBeNull();
    expect(presentation.slides[0]?.elements[0]?.uuid).toEqual(expect.any(String));
  });

  it('creates new slides with stable nested identities', () => {
    const slide = createPresentationSlide('comparison', 'Roadmap');

    expect(slide.id).toBeNull();
    expect(slide.uuid).toEqual(expect.any(String));
    expect(slide.elements[0]?.id).toBeNull();
    expect(slide.elements[0]?.uuid).toEqual(expect.any(String));
  });

  it('normalizes legacy presentations to uuid-first nested models', () => {
    const presentation = normalizePresentation({
      id: 'presentation-db-1',
      uuid: 'presentation-uuid-1',
      title: 'Legacy Deck',
      createdAt: 1,
      updatedAt: 1,
      theme: 'modern',
      slides: [
        {
          id: 'slide-db-1',
          title: 'Legacy Slide',
          layout: 'title',
          elements: [
            {
              id: 'element-db-1',
              type: 'text',
              content: 'Legacy Slide',
              x: 10,
              y: 10,
            },
          ],
        },
      ],
    });

    expect(presentation.slides[0]).toMatchObject({
      id: 'slide-db-1',
      uuid: 'client-entity:slide-db-1',
    });
    expect(presentation.slides[0]?.elements[0]).toMatchObject({
      id: 'element-db-1',
      uuid: 'client-entity:element-db-1',
    });
  });
});
