import {
  createInputAttachment,
  type InputAttachment,
  type PortalTab
} from '@sdkwork/magic-studio-assets/creation-chat';
import {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk
} from '@sdkwork/magic-studio-assets/services';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { Asset } from '@sdkwork/magic-studio-types/assets';

export type PortalAttachment = InputAttachment & {
  assetId?: string;
  content?: string;
};

interface PortalPickedFile {
  name: string;
  data: Uint8Array | number[];
}

interface AttachmentClassification {
  attachmentType: PortalAttachment['type'];
  assetType: 'image' | 'video' | 'audio' | 'text' | 'file';
  ext: string;
}

const PLAIN_TEXT_SCRIPT_EXTS = new Set(['txt', 'md', 'markdown', 'fountain', 'rtf']);
const SCRIPT_EXTS = new Set(['txt', 'md', 'markdown', 'fountain', 'rtf', 'doc', 'docx', 'pdf', 'odt', 'wps', 'pages']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'gif']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma']);

const readExt = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

const classifyAttachment = (fileName: string): AttachmentClassification => {
  const ext = readExt(fileName);
  if (IMAGE_EXTS.has(ext)) {
    return { attachmentType: 'image', assetType: 'image', ext };
  }
  if (VIDEO_EXTS.has(ext)) {
    return { attachmentType: 'video', assetType: 'video', ext };
  }
  if (AUDIO_EXTS.has(ext)) {
    return { attachmentType: 'audio', assetType: 'audio', ext };
  }
  if (SCRIPT_EXTS.has(ext)) {
    return {
      attachmentType: 'script',
      assetType: PLAIN_TEXT_SCRIPT_EXTS.has(ext) ? 'text' : 'file',
      ext
    };
  }
  return { attachmentType: 'file', assetType: 'file', ext };
};

const extractScriptContent = (bytes: Uint8Array, ext: string): string | undefined => {
  if (!PLAIN_TEXT_SCRIPT_EXTS.has(ext)) {
    return undefined;
  }
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return undefined;
  }
};

const mapAssetTypeToAttachmentType = (asset: Asset): PortalAttachment['type'] => {
  if (asset.type === 'image') return 'image';
  if (asset.type === 'video') return 'video';
  if (asset.type === 'audio' || asset.type === 'music' || asset.type === 'voice' || asset.type === 'sfx') return 'audio';
  if (asset.type === 'text') return 'script';
  return 'file';
};

const readOptionalStringProperty = (
  source: unknown,
  key: 'url' | 'remoteUrl'
): string | undefined => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const readExplicitAssetUuid = (asset: Asset): string | undefined => {
  if (typeof asset?.uuid !== 'string') {
    return undefined;
  }

  const explicitUuid = asset.uuid.trim();
  if (!explicitUuid || explicitUuid === asset.id) {
    return undefined;
  }

  return explicitUuid;
};

export const importPortalAttachmentFromLocalFile = async (
  file: PortalPickedFile,
  _tab: PortalTab
): Promise<PortalAttachment> => {
  const fileName = file.name || `portal-attachment-${Date.now()}`;
  const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
  const classified = classifyAttachment(fileName);
  const imported = await importAssetBySdk(
    {
      name: fileName,
      data: bytes
    },
    classified.assetType,
    { domain: 'portal-video' }
  );
  const url =
    (await resolveAssetPrimaryUrlBySdk(imported.id)) ||
    imported.path ||
    '';
  const runtimeUuid = resolveAssetRecordClientUuid(imported);
  const assetUuid = readAssetRecordMetadataValue(imported, 'assetUuid');

  return {
    ...createInputAttachment({
      uuid: runtimeUuid,
      assetId: imported.id,
      assetUuid,
      name: fileName,
      type: classified.attachmentType,
      url,
    }),
    content: classified.attachmentType === 'script' ? extractScriptContent(bytes, classified.ext) : undefined
  };
};

export const resolvePortalAttachmentFromAsset = async (asset: Asset): Promise<PortalAttachment | null> => {
  const directUrl =
    readOptionalStringProperty(asset, 'remoteUrl') ||
    readOptionalStringProperty(asset, 'url');
  const url = await resolveAssetUrlByAssetIdFirst({
    id: asset?.id,
    path: asset?.path,
    url: directUrl
  });
  if (!asset?.id || !url) {
    return null;
  }
  return {
    ...createInputAttachment({
      id: resolveAssetRecordId(asset),
      uuid: resolveAssetRecordClientUuid(asset),
      assetId: resolveAssetRecordId(asset),
      assetUuid:
        resolveAssetRecordAssetUuid(asset) ??
        readAssetRecordMetadataValue(asset, 'assetUuid') ??
        readExplicitAssetUuid(asset),
      name: asset.name,
      type: mapAssetTypeToAttachmentType(asset),
      url
    })
  };
};
