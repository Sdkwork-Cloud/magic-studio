import {
  createInputAttachment,
  type InputAttachment
} from '@sdkwork/magic-studio-assets/creation-chat';

import {
  resolveImportedFilmAssetUrl,
  type ImportedFilmAssetRef
} from './filmModalAssetImport';

export type FilmHomeAttachment = InputAttachment & {
  assetId?: string;
  assetUuid?: string;
  content?: string;
};

interface BuildFilmHomeAttachmentInput {
  imported: ImportedFilmAssetRef;
  fileName: string;
  attachmentType: FilmHomeAttachment['type'];
  ext: string;
  bytes: Uint8Array;
}

const PLAIN_TEXT_SCRIPT_EXTS = new Set(['txt', 'md', 'markdown', 'rtf', 'fountain']);

const extractFilmHomeScriptContent = (
  attachmentType: FilmHomeAttachment['type'],
  ext: string,
  bytes: Uint8Array
): string | undefined => {
  if (attachmentType !== 'script' || !PLAIN_TEXT_SCRIPT_EXTS.has(ext)) {
    return undefined;
  }

  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return undefined;
  }
};

export const buildFilmHomeAttachment = ({
  imported,
  fileName,
  attachmentType,
  ext,
  bytes,
}: BuildFilmHomeAttachmentInput): FilmHomeAttachment => ({
  ...createInputAttachment({
    uuid: imported.uuid,
    assetId: imported.assetId,
    assetUuid: imported.assetUuid,
    name: fileName,
    type: attachmentType,
    url: resolveImportedFilmAssetUrl(imported),
  }),
  content: extractFilmHomeScriptContent(attachmentType, ext, bytes),
});
