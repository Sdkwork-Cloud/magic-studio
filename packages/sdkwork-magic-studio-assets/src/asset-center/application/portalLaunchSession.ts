import { readWorkspaceScope } from './assetCenterAdapters';
import { resolvePortalLaunchAttachmentIdentity } from './portalLaunchAttachment';
import { getCreationServerClient } from '../../services/creationServerClient';
import type {
  PortalLaunchAttachmentRef,
  PortalLaunchAttachmentType,
  PortalLaunchSession,
  PortalLaunchTarget,
  SavePortalLaunchSessionInput,
} from '@sdkwork/magic-studio-types/asset-center';

export type {
  PortalLaunchTarget,
  PortalLaunchAttachmentType,
  PortalLaunchAttachmentRef,
  PortalLaunchSession,
  SavePortalLaunchSessionInput,
} from '@sdkwork/magic-studio-types/asset-center';

const PORTAL_SOURCE = 'portal-video';
const PORTAL_TARGET_VALUES: readonly PortalLaunchTarget[] = [
  'short_drama',
  'video',
  'image',
  'one_click',
  'human',
  'music',
  'speech',
  'sfx',
];
const PORTAL_ATTACHMENT_TYPE_VALUES: readonly PortalLaunchAttachmentType[] = [
  'image',
  'video',
  'audio',
  'script',
  'file',
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
  value: unknown,
): value is PortalLaunchAttachmentType => {
  return (
    typeof value === 'string' &&
    PORTAL_ATTACHMENT_TYPE_VALUES.includes(value as PortalLaunchAttachmentType)
  );
};

const normalizeAttachments = (
  attachments: PortalLaunchAttachmentRef[] | undefined,
): PortalLaunchAttachmentRef[] => {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  const unique = new Set<string>();
  const normalized: PortalLaunchAttachmentRef[] = [];

  for (const attachment of attachments) {
    if (!attachment) {
      continue;
    }
    if (!isPortalLaunchAttachmentType(attachment.type)) {
      continue;
    }
    let identity;
    try {
      identity = resolvePortalLaunchAttachmentIdentity(attachment);
    } catch {
      continue;
    }
    const locator = normalizeOptionalString(attachment.locator);
    const content =
      attachment.type === 'script' && isNonEmptyString(attachment.content)
        ? attachment.content
        : undefined;
    const key = [
      identity.assetUuid || '',
      identity.assetId || '',
      identity.uuid,
      attachment.type,
      locator || '',
      content || '',
    ].join('|');
    if (unique.has(key)) {
      continue;
    }
    unique.add(key);
    normalized.push({
      id: identity.id,
      uuid: identity.uuid,
      name: attachment.name || identity.uuid,
      type: attachment.type,
      assetId: identity.assetId || undefined,
      assetUuid: identity.assetUuid || undefined,
      locator,
      content,
    });
  }

  return normalized;
};

type PortalLaunchSessionCandidate = {
  sessionId?: unknown;
  source?: unknown;
  target?: unknown;
  prompt?: unknown;
  genMode?: unknown;
  model?: unknown;
  styleId?: unknown;
  aspectRatio?: unknown;
  resolution?: unknown;
  duration?: unknown;
  attachments?: PortalLaunchAttachmentRef[] | undefined;
  workspaceId?: unknown;
  projectId?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
};

const normalizeSession = (
  candidate: PortalLaunchSessionCandidate | null | undefined,
): PortalLaunchSession | null => {
  if (!candidate) {
    return null;
  }
  if (!isPortalLaunchTarget(candidate.target)) {
    return null;
  }
  if (candidate.source !== PORTAL_SOURCE || !isNonEmptyString(candidate.sessionId)) {
    return null;
  }
  if (!isNonEmptyString(candidate.workspaceId)) {
    return null;
  }
  if (
    typeof candidate.createdAt !== 'number' ||
    typeof candidate.expiresAt !== 'number'
  ) {
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
    expiresAt: candidate.expiresAt,
  };
};

const createSessionQuery = (target?: PortalLaunchTarget) => {
  const scope = readWorkspaceScope();
  return {
    target,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
  };
};

export const clearPortalLaunchSession = async (): Promise<void> => {
  await getCreationServerClient().clearCurrentCreationSession(createSessionQuery());
};

export const savePortalLaunchSession = async (
  input: SavePortalLaunchSessionInput,
): Promise<PortalLaunchSession> => {
  const scope = readWorkspaceScope();
  const response = await getCreationServerClient().createCreationSession({
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
  });
  const session = normalizeSession(response.data);
  if (!session) {
    throw new Error('Failed to create portal launch session.');
  }
  return session;
};

export const readPortalLaunchSession = async (): Promise<PortalLaunchSession | null> => {
  const response = await getCreationServerClient().readCurrentCreationSession(createSessionQuery());
  return normalizeSession(response.data?.session || null);
};

export const consumePortalLaunchSession = async (
  expectedTarget?: PortalLaunchTarget,
): Promise<PortalLaunchSession | null> => {
  const response = await getCreationServerClient().consumeCurrentCreationSession(
    createSessionQuery(expectedTarget),
  );
  return normalizeSession(response.data?.session || null);
};
