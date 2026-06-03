export type {
  FileAttachmentAttrs,
  ImageAttrs,
  MediaAttrs,
  NoteAssetReferenceAttrs,
} from './mediaAssetAttrs';

export interface MiniProgramAttrs {
  image?: string;
  imageAssetId?: string | null;
  imageAssetUuid?: string | null;
  imagePrimaryResourceId?: string | null;
  imagePrimaryResourceUuid?: string | null;
  imageResourceViewId?: string | null;
  imageResourceViewUuid?: string | null;
  text?: string;
  title?: string;
  type?: string;
}

export type ParserNodeInput = Node | string;

export const getNodeAttrs = <T>(node: unknown): T => {
  const attrs = (node as { attrs?: T } | null)?.attrs;
  return (attrs ?? {}) as T;
};

export const getNodeTypeName = (node: unknown): string | undefined => {
  return (node as { type?: { name?: string } } | null)?.type?.name;
};

export const toHtmlElement = (value: ParserNodeInput): HTMLElement | null => {
  if (typeof value === 'string' || !(value instanceof HTMLElement)) {
    return null;
  }

  return value;
};
