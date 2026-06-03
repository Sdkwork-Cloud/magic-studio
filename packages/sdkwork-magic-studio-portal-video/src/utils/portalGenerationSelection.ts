import type { PortalTab } from '@sdkwork/magic-studio-assets/creation-chat';

import { GEN_MODES } from '../constants';

type PortalAttachmentLike = {
  type: string;
};

interface ResolvePortalGenModeInput {
  activeTab: PortalTab;
  requestedMode: string;
  attachments: PortalAttachmentLike[];
}

export function resolvePortalGenMode({
  activeTab,
  requestedMode,
  attachments,
}: ResolvePortalGenModeInput): string {
  const validModes = GEN_MODES.filter((mode) => mode.validTabs.includes(activeTab));
  const hasVideoReference = attachments.some((attachment) => attachment.type === 'video');
  const hasImageReference = attachments.some((attachment) => attachment.type === 'image');

  if (
    activeTab === 'video' &&
    (hasVideoReference || hasImageReference) &&
    validModes.some((mode) => mode.id === 'start_end')
  ) {
    return 'start_end';
  }

  if (validModes.some((mode) => mode.id === requestedMode)) {
    return requestedMode;
  }

  return validModes[0]?.id ?? 'text';
}
