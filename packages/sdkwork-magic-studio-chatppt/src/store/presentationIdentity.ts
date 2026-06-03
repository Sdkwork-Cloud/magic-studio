import { matchesEntityKey, resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

import type { Presentation } from '../entities';

export const resolvePresentationKey = (
    presentation: Pick<Presentation, 'id' | 'uuid'>
): string => resolveEntityKey(presentation);

export const findPresentationByKey = (
    presentations: Presentation[],
    presentationKey: string
): Presentation | null => presentations.find((presentation) => matchesEntityKey(presentation, presentationKey)) || null;

export const replacePresentationByKey = (
    presentations: Presentation[],
    presentationKey: string,
    nextPresentation: Presentation
): Presentation[] => presentations.map((presentation) => (
    matchesEntityKey(presentation, presentationKey) ? nextPresentation : presentation
));

export const removePresentationByKey = (
    presentations: Presentation[],
    presentationKey: string
): Presentation[] => presentations.filter((presentation) => !matchesEntityKey(presentation, presentationKey));
