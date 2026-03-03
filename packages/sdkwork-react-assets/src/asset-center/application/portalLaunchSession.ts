import { readWorkspaceScope } from './assetCenterAdapters';
import { assetUiStateService } from '../../services/assetUiStateService';
import type {
  PortalLaunchAttachmentRef,
  PortalLaunchAttachmentType,
  PortalLaunchSession,
  PortalLaunchTarget,
  SavePortalLaunchSessionInput
} from '@sdkwork/react-types';
export type {
  PortalLaunchTarget,
  PortalLaunchAttachmentType,
  PortalLaunchAttachmentRef,
  PortalLaunchSession,
  SavePortalLaunchSessionInput
} from '@sdkwork/react-types';

const STORAGE_KEY = 'sdkwork.portal.launch.session.v1';
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const PORTAL_SOURCE = 'portal-video';
const PORTAL_TARGET_VALUES: readonly PortalLaunchTarget[] = [
  'short_drama',
  'video',
  'image',
  'one_click',
  'human',
  'music',
  'speech'
];
const PORTAL_ATTACHMENT_TYPE_VALUES: readonly PortalLaunchAttachmentType[] = [
  'image',
  'video',
  'audio',
  'script',
  'file'
];

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  return isNonEmptyString(value) ? value : undefined;
};

const isPortalLaunchTarget = (value: unknown): value is PortalLaunchTarget => {
  return (
    typeof value === 'string' &&
    PORTAL_TARGET_VALUES.includes(value as PortalLaunchTarget)
  );
};

const isPortalLaunchAttachmentType = (
  value: unknown
): value is PortalLaunchAttachmentType => {
  return (
    typeof value === 'string' &&
    PORTAL_ATTACHMENT_TYPE_VALUES.includes(value as PortalLaunchAttachmentType)
  );
};

const normalizeAttachments = (
  attachments: PortalLaunchAttachmentRef[] | undefined
): PortalLaunchAttachmentRef[] => {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  const unique = new Set<string>();
  const normalized: PortalLaunchAttachmentRef[] = [];

  for (const attachment of attachments) {
    if (!attachment || !isNonEmptyString(attachment.id)) {
      continue;
    }
    if (!isPortalLaunchAttachmentType(attachment.type)) {
      continue;
    }
    const key = [
      attachment.assetId || '',
      attachment.id,
      attachment.type,
      attachment.locator || ''
    ].join('|');
    if (unique.has(key)) {
      continue;
    }
    unique.add(key);
    normalized.push({
      id: attachment.id,
      name: attachment.name || attachment.id,
      type: attachment.type,
      assetId: isNonEmptyString(attachment.assetId) ? attachment.assetId : undefined,
      locator: isNonEmptyString(attachment.locator) ? attachment.locator : undefined,
      content:
        attachment.type === 'script' && isNonEmptyString(attachment.content)
          ? attachment.content
          : undefined
    });
  }

  return normalized;
};

export const clearPortalLaunchSession = (): void => {
  assetUiStateService.removeStorageValue(STORAGE_KEY);
};

export const savePortalLaunchSession = (
  input: SavePortalLaunchSessionInput
): PortalLaunchSession => {
  const scope = readWorkspaceScope();
  const now = Date.now();
  const session: PortalLaunchSession = {
    sessionId: `portal-${now}-${Math.random().toString(36).slice(2, 10)}`,
    source: PORTAL_SOURCE,
    target: input.target,
    prompt: typeof input.prompt === 'string' ? input.prompt : '',
    genMode: normalizeOptionalString(input.genMode),
    model: normalizeOptionalString(input.model),
    styleId: normalizeOptionalString(input.styleId),
    aspectRatio: normalizeOptionalString(input.aspectRatio),
    resolution: normalizeOptionalString(input.resolution),
    duration: normalizeOptionalString(input.duration),
    attachments: normalizeAttachments(input.attachments),
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS
  };

  assetUiStateService.writeStorageValue(STORAGE_KEY, JSON.stringify(session));

  return session;
};

export const readPortalLaunchSession = (): PortalLaunchSession | null => {
  try {
    const raw = assetUiStateService.readStorageValue(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const candidate = parsed as Partial<PortalLaunchSession>;
    if (!isPortalLaunchTarget(candidate.target)) {
      clearPortalLaunchSession();
      return null;
    }
    if (candidate.source !== PORTAL_SOURCE || !isNonEmptyString(candidate.sessionId)) {
      clearPortalLaunchSession();
      return null;
    }
    if (!isNonEmptyString(candidate.workspaceId)) {
      clearPortalLaunchSession();
      return null;
    }
    if (
      typeof candidate.createdAt !== 'number' ||
      typeof candidate.expiresAt !== 'number' ||
      candidate.expiresAt <= Date.now()
    ) {
      clearPortalLaunchSession();
      return null;
    }
    return {
      sessionId: candidate.sessionId,
      source: PORTAL_SOURCE,
      target: candidate.target,
      prompt: typeof candidate.prompt === 'string' ? candidate.prompt : '',
      genMode: normalizeOptionalString(candidate.genMode),
      model: normalizeOptionalString(candidate.model),
      styleId: normalizeOptionalString(candidate.styleId),
      aspectRatio: normalizeOptionalString(candidate.aspectRatio),
      resolution: normalizeOptionalString(candidate.resolution),
      duration: normalizeOptionalString(candidate.duration),
      attachments: normalizeAttachments(candidate.attachments || []),
      workspaceId: candidate.workspaceId,
      projectId: normalizeOptionalString(candidate.projectId),
      createdAt: candidate.createdAt,
      expiresAt: candidate.expiresAt
    };
  } catch {
    return null;
  }
};

export const consumePortalLaunchSession = (
  expectedTarget?: PortalLaunchTarget
): PortalLaunchSession | null => {
  const session = readPortalLaunchSession();
  if (!session) {
    return null;
  }
  if (expectedTarget && session.target !== expectedTarget) {
    return null;
  }
  clearPortalLaunchSession();
  return session;
};
