import {
  assetBusinessFacade,
  assetCenterService,
  resolveAssetUrlByAssetIdFirst,
  mapUnifiedAssetToAnyAsset,
  readWorkspaceScope,
  type InputAttachment,
  type PortalTab
} from '@sdkwork/react-assets';
import type { Asset } from 'sdkwork-react-commons';

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

const resolvePortalScope = (): { workspaceId: string; projectId?: string } => {
  const scope = readWorkspaceScope();
  return {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId
  };
};

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

export const importPortalAttachmentFromLocalFile = async (
  file: PortalPickedFile,
  tab: PortalTab
): Promise<PortalAttachment> => {
  const fileName = file.name || `portal-attachment-${Date.now()}`;
  const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
  const classified = classifyAttachment(fileName);
  const imported = await assetBusinessFacade.importPortalVideoAsset({
    scope: resolvePortalScope(),
    type: classified.assetType,
    name: fileName,
    data: bytes,
    metadata: {
      origin: 'upload',
      source: 'portal-video-local-upload',
      tab,
      attachmentType: classified.attachmentType
    }
  });
  const mapped = mapUnifiedAssetToAnyAsset(imported.asset);
  const url =
    mapped?.url ||
    mapped?.path ||
    (await assetCenterService.resolvePrimaryUrl(imported.asset.assetId));

  return {
    id: imported.asset.assetId,
    assetId: imported.asset.assetId,
    name: fileName,
    type: classified.attachmentType,
    url,
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
    id: asset.id,
    assetId: asset.id,
    name: asset.name,
    type: mapAssetTypeToAttachmentType(asset),
    url
  };
};
