import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';

import type { Presentation, Slide, SlideElement } from '../entities';

type SlideElementDraft = Omit<SlideElement, 'id' | 'uuid'> & Partial<Pick<SlideElement, 'id' | 'uuid'>>;
type SlideDraft = Omit<Slide, 'id' | 'uuid' | 'elements'> & Partial<Pick<Slide, 'id' | 'uuid'>> & {
    elements: SlideElementDraft[];
};
type PresentationDraft = Omit<Presentation, 'id' | 'uuid' | 'slides'> & Partial<Pick<Presentation, 'id' | 'uuid'>> & {
    slides: SlideDraft[];
};

const normalizeIdentityValue = (value?: string | null): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const deriveClientEntityUuidFromId = (value: string): string => `client-entity:${value}`;

const normalizeSlideElement = (element: SlideElementDraft): SlideElement => {
    const normalizedId = normalizeIdentityValue(element.id);
    const elementKey = normalizeIdentityValue(element.uuid) || (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null) || generateUUID();

    return {
        ...element,
        id: normalizedId,
        uuid: elementKey,
    };
};

export const normalizePresentationSlide = (slide: SlideDraft): Slide => {
    const normalizedId = normalizeIdentityValue(slide.id);
    const slideKey = normalizeIdentityValue(slide.uuid) || (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null) || generateUUID();

    return {
        ...slide,
        id: normalizedId,
        uuid: slideKey,
        elements: slide.elements.map(normalizeSlideElement),
    };
};

export const createPresentationSlide = (
    layout: Slide['layout'] = 'bullet-points',
    heading: string = 'New Slide',
    options: Partial<Pick<SlideElement, 'x' | 'y' | 'width' | 'height' | 'style'>> & {
        title?: string;
    } = {}
): Slide => normalizePresentationSlide({
    title: options.title || (layout === 'title' ? 'Untitled Slide' : 'New Slide'),
    layout,
    elements: [{
        type: 'text',
        content: heading,
        x: options.x ?? 5,
        y: options.y ?? 10,
        width: options.width ?? 90,
        ...(typeof options.height !== 'undefined' ? { height: options.height } : {}),
        ...(options.style ? { style: options.style } : {}),
    }]
});

export const createPresentationDraft = (title: string): Presentation => {
    const presentationUuid = generateUUID();

    return {
        id: null,
        uuid: presentationUuid,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        theme: 'modern',
        slides: [
            createPresentationSlide('title', title, {
                title: 'Untitled Slide',
                x: 10,
                y: 40,
                width: 80,
                style: { fontSize: '3rem', fontWeight: 'bold' }
            })
        ]
    };
};

export const normalizePresentation = (presentation: PresentationDraft): Presentation => {
    const normalizedId = normalizeIdentityValue(presentation.id);
    const presentationKey = normalizeIdentityValue(presentation.uuid) || (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null) || generateUUID();

    return {
        ...presentation,
        id: normalizedId,
        uuid: presentationKey,
        slides: presentation.slides.map(normalizePresentationSlide),
    };
};
