import {
  resolveCanvasMediaResourceKey,
  type CanvasMediaResource,
} from '@sdkwork/magic-studio-types/canvas';

export const resolveCanvasReferenceImageAttachmentId = (
  resource: CanvasMediaResource,
  index: number
): string => resolveCanvasMediaResourceKey(resource) || `ref-${index}`;

export const removeCanvasReferenceImageByAttachmentId = (
  referenceImages: CanvasMediaResource[] | undefined,
  attachmentId: string
): CanvasMediaResource[] => {
  const current = referenceImages || [];
  return current.filter(
    (resource, index) =>
      resolveCanvasReferenceImageAttachmentId(resource, index) !== attachmentId
  );
};
