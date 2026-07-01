type OptionalString = string | null | undefined;

const normalizeOptionalString = (value: OptionalString): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOptionalNumber = (value: number | null | undefined): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
};

export interface NoteAssetReferenceAttrs {
  src?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
}

export interface ImageAttrs extends NoteAssetReferenceAttrs {
  alt?: string;
  title?: string;
}

export interface MediaAttrs extends NoteAssetReferenceAttrs {
  controls?: boolean;
}

export interface FileAttachmentAttrs extends NoteAssetReferenceAttrs {
  name?: string;
  size?: number;
  mime?: string;
}

type NoteAssetAttrKey = Exclude<keyof NoteAssetReferenceAttrs, 'src'>;

const NOTE_ASSET_DATA_ATTRIBUTES: Record<NoteAssetAttrKey, string> = {
  assetId: 'data-asset-id',
  assetUuid: 'data-asset-uuid',
  primaryResourceId: 'data-primary-resource-id',
  primaryResourceUuid: 'data-primary-resource-uuid',
  resourceViewId: 'data-resource-view-id',
  resourceViewUuid: 'data-resource-view-uuid',
};

const createDataStringAttribute = (attributeName: NoteAssetAttrKey) => {
  const dataAttribute = NOTE_ASSET_DATA_ATTRIBUTES[attributeName];

  return {
    default: null,
    parseHTML: (element: HTMLElement) =>
      normalizeOptionalString(element.getAttribute(dataAttribute)),
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = normalizeOptionalString(attributes[attributeName] as OptionalString);
      return value ? { [dataAttribute]: value } : {};
    },
  };
};

export const createNoteAssetReferenceAttributeDefinitions = () => ({
  assetId: createDataStringAttribute('assetId'),
  assetUuid: createDataStringAttribute('assetUuid'),
  primaryResourceId: createDataStringAttribute('primaryResourceId'),
  primaryResourceUuid: createDataStringAttribute('primaryResourceUuid'),
  resourceViewId: createDataStringAttribute('resourceViewId'),
  resourceViewUuid: createDataStringAttribute('resourceViewUuid'),
});

export const createNoteAssetReferenceAttrs = (
  input: Partial<NoteAssetReferenceAttrs> = {}
): NoteAssetReferenceAttrs => ({
  ...(normalizeOptionalString(input.src) ? { src: normalizeOptionalString(input.src)! } : {}),
  ...(input.assetId !== undefined ? { assetId: normalizeOptionalString(input.assetId) } : {}),
  ...(input.assetUuid !== undefined ? { assetUuid: normalizeOptionalString(input.assetUuid) } : {}),
  ...(input.primaryResourceId !== undefined
    ? { primaryResourceId: normalizeOptionalString(input.primaryResourceId) }
    : {}),
  ...(input.primaryResourceUuid !== undefined
    ? { primaryResourceUuid: normalizeOptionalString(input.primaryResourceUuid) }
    : {}),
  ...(input.resourceViewId !== undefined
    ? { resourceViewId: normalizeOptionalString(input.resourceViewId) }
    : {}),
  ...(input.resourceViewUuid !== undefined
    ? { resourceViewUuid: normalizeOptionalString(input.resourceViewUuid) }
    : {}),
});

export const createNoteImageAttrs = (
  input: Partial<ImageAttrs> = {}
): ImageAttrs => ({
  ...createNoteAssetReferenceAttrs(input),
  ...(normalizeOptionalString(input.alt) ? { alt: normalizeOptionalString(input.alt)! } : {}),
  ...(normalizeOptionalString(input.title) ? { title: normalizeOptionalString(input.title)! } : {}),
});

export const createNoteMediaAttrs = (
  input: Partial<MediaAttrs> = {}
): MediaAttrs => ({
  ...createNoteAssetReferenceAttrs(input),
  controls: input.controls ?? true,
});

export const createNoteFileAttachmentAttrs = (
  input: Partial<FileAttachmentAttrs> = {}
): FileAttachmentAttrs => ({
  ...createNoteAssetReferenceAttrs(input),
  ...(normalizeOptionalString(input.name) ? { name: normalizeOptionalString(input.name)! } : {}),
  ...(normalizeOptionalNumber(input.size) !== undefined
    ? { size: normalizeOptionalNumber(input.size) }
    : {}),
  ...(normalizeOptionalString(input.mime) ? { mime: normalizeOptionalString(input.mime)! } : {}),
});

export const toNoteAssetUrlSource = (
  input: Partial<NoteAssetReferenceAttrs> | null | undefined
): { id: string; path: string; url?: string; assetId?: string } | null => {
  if (!input) {
    return null;
  }

  const assetId = normalizeOptionalString(input.assetId);
  const src = normalizeOptionalString(input.src);

  if (!assetId && !src) {
    return null;
  }

  return {
    id: assetId || src || 'note-asset-runtime',
    path: src || '',
    ...(assetId ? { assetId } : {}),
    ...(src ? { url: src } : {}),
  };
};
