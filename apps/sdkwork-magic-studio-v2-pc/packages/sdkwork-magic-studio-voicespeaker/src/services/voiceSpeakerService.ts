import {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import { assertRuntimeMagicStudioExecutionOperationReady } from '@sdkwork/magic-studio-core/sdk';
import { isCanonicalMagicStudioAssetReference as isStableVoiceAssetReference } from '@sdkwork/magic-studio-core/storage';
import type { Asset } from '@sdkwork/magic-studio-assets/entities';
import type {
  MagicStudioCustomVoiceCreateRequest,
  MagicStudioCustomVoiceUpdateRequest,
  MagicStudioVoiceCloneTask,
  MagicStudioVoiceCloneTaskListQuery,
  MagicStudioVoiceSpeaker,
} from '@sdkwork/magic-studio-host-types';

import type { IVoice } from '../components/voicespeaker/types';
import type { VoiceInputResourceRef, VoiceProfile } from '../entities';
import { PRESET_VOICES } from '../constants';
import {
  buildVoiceCloneTaskCreateRequest,
  toMediaInputRef,
} from './voiceRequestBuilder';
import { createVoiceServerClient } from './voiceServerClient';
import {
  normalizeVoiceGender,
  safeIdString,
  safeString,
} from './voiceService.shared';

const DEFAULT_PREVIEW = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
const DEFAULT_CUSTOM_VOICE_STORAGE_KEY = 'sdkwork_voice_lab_custom_v1';
const CLONE_TASK_WAIT_MS = 1200;
const CLONE_TASK_MAX_ATTEMPTS = 15;

let customVoiceMemoryCache: IVoice[] = [];

export interface UploadedVoiceReferenceInput {
  data: Uint8Array | File;
  name: string;
  path?: string;
}

export interface VoiceSpeakerCloneTaskResultData {
  status?: string;
  speakerId?: string | number;
  speakerName?: string;
  previewAudioUrl?: string;
  errorMessage?: string;
}

export interface VoiceSpeakerPreviewUpdateRequest {
  previewText?: string;
  previewAudioUrl?: string;
}

export interface VoiceSpeakerPreviewUpdateData {
  previewText?: string;
  previewAudioUrl?: string;
}

export interface CreateCustomVoiceInput {
  name: string;
  gender: IVoice['gender'];
  style?: string;
  language: string;
  provider?: string;
  previewUrl?: string;
  previewText?: string;
  avatarUrl?: string;
  description?: string;
  tags?: string[];
  referenceAudio?: VoiceInputResourceRef;
  isFavorite?: boolean;
}

const createServerClient = () => createVoiceServerClient('VoiceSpeakerService');

const parseTimestamp = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const safeGender = (value: unknown): 'male' | 'female' | 'neutral' =>
  normalizeVoiceGender(value);

const normalizeVoice = (voice: IVoice, source: IVoice['source']): IVoice => {
  const providerBySource: Record<string, string> = {
    market: 'Voice Market',
    workspace: 'Workspace Voice',
    custom: 'Voice Lab',
  };
  const voiceId = safeString(voice.id, `voice-${Date.now()}`);
  const voiceUuid = safeString(voice.uuid, voiceId);

  return {
    id: voiceId,
    uuid: voiceUuid,
    name: safeString(voice.name, 'Unnamed Voice'),
    gender: safeGender(voice.gender),
    style: safeString(voice.style, 'neutral'),
    language: safeString(voice.language, 'en-US'),
    previewUrl: safeString(voice.previewUrl, DEFAULT_PREVIEW),
    previewText: safeString(voice.previewText) || undefined,
    tags: Array.isArray(voice.tags) ? voice.tags.filter(Boolean) : [],
    provider: safeString(
      voice.provider,
      providerBySource[source || 'market'] || 'Voice'
    ),
    source,
    description: safeString(voice.description) || undefined,
    avatarUrl: safeString(voice.avatarUrl) || undefined,
    createdAt:
      typeof voice.createdAt === 'number' ? voice.createdAt : Date.now(),
  };
};

const dedupeVoices = (voices: IVoice[]): IVoice[] => {
  const map = new Map<string, IVoice>();
  voices.forEach((voice) => {
    const normalized = normalizeVoice(
      voice,
      (voice.source as IVoice['source']) || 'market'
    );
    map.set(safeString(normalized.uuid, normalized.id), normalized);
  });
  return Array.from(map.values());
};

const toUploadBytes = async (
  input: Uint8Array | Blob | File
): Promise<Uint8Array> => {
  if (input instanceof Uint8Array) {
    const copied = new Uint8Array(input.byteLength);
    copied.set(input);
    return copied;
  }

  const buffer = await input.arrayBuffer();
  return new Uint8Array(buffer);
};

const resolveUploadedVoiceAsset = async (
  uploaded: Asset,
  fallbackName: string,
  fallbackUrl = ''
): Promise<Asset> => {
  const uploadedPath = safeString(uploaded.path, '');
  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploadedPath ||
    fallbackUrl;
  const canonicalPath =
    (isStableVoiceAssetReference(uploadedPath) ? uploadedPath : '') ||
    resolvedUrl ||
    uploadedPath ||
    fallbackUrl;

  return {
    ...uploaded,
    name: safeString(uploaded.name, fallbackName),
    path: canonicalPath,
    metadata: {
      ...(uploaded.metadata || {}),
      ...(safeString(resolvedUrl) ? { deliveryUrl: resolvedUrl } : {}),
    },
  };
};

const resolveVoiceAssetUrlInternal = async (
  reference?: Asset | VoiceInputResourceRef | string | null
): Promise<string> => {
  if (!reference) {
    return '';
  }

  const resolved = await resolveAssetUrlByAssetIdFirst(reference as any);
  if (resolved) {
    return resolved;
  }

  if (typeof reference === 'string') {
    return reference;
  }

  const metadata =
    'metadata' in reference &&
    reference.metadata &&
    typeof reference.metadata === 'object'
      ? (reference.metadata as Record<string, unknown>)
      : undefined;
  const fallbackPath =
    (metadata && typeof metadata.deliveryUrl === 'string'
      ? metadata.deliveryUrl
      : '') ||
    (metadata && typeof metadata.previewUrl === 'string'
      ? metadata.previewUrl
      : '') ||
    (metadata && typeof metadata.previewAudioUrl === 'string'
      ? metadata.previewAudioUrl
      : '') ||
    ('path' in reference && typeof reference.path === 'string'
      ? reference.path
      : '') ||
    ('url' in reference && typeof reference.url === 'string'
      ? reference.url
      : '') ||
    ('id' in reference && typeof reference.id === 'string' ? reference.id : '');

  return fallbackPath;
};

const mapServerVoiceToVoice = (voice: MagicStudioVoiceSpeaker): IVoice =>
  normalizeVoice(
    {
      id: safeString(voice.id),
      uuid: safeString(voice.uuid, safeString(voice.id)),
      name: safeString(voice.name, 'Unnamed Voice'),
      gender: safeGender(voice.gender),
      style: safeString(voice.style, 'neutral'),
      language: safeString(voice.language, 'en-US'),
      previewUrl: safeString(voice.previewUrl, DEFAULT_PREVIEW),
      previewText: safeString(voice.previewText) || undefined,
      provider: safeString(voice.provider, 'Voice'),
      source: (voice.source as IVoice['source']) || 'market',
      description: safeString(voice.description) || undefined,
      avatarUrl: safeString(voice.avatarUrl) || undefined,
      tags: Array.isArray(voice.tags) ? voice.tags : [],
      createdAt: parseTimestamp(voice.createdAt) || Date.now(),
    },
    (voice.source as IVoice['source']) || 'market'
  );

const mapCloneTaskResult = (
  task: MagicStudioVoiceCloneTask | null | undefined
): VoiceSpeakerCloneTaskResultData | null => {
  if (!task) {
    return null;
  }

  return {
    status: safeString(task.status).toUpperCase() || undefined,
    speakerId: safeString(task.speakerId) || undefined,
    speakerName: safeString(task.speakerName) || undefined,
    previewAudioUrl: safeString(task.previewAudioUrl) || undefined,
    errorMessage: safeString(task.errorMessage) || undefined,
  };
};

const isCloneTaskTerminalStatus = (
  status: VoiceSpeakerCloneTaskResultData['status'] | undefined
): boolean => {
  const normalizedStatus = safeString(status).toUpperCase();
  return (
    normalizedStatus === 'SUCCEEDED' ||
    normalizedStatus === 'SUCCESS' ||
    normalizedStatus === 'FAILED' ||
    normalizedStatus === 'CANCELLED'
  );
};

const waitForMs = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const syncCustomVoiceMemory = (voices: IVoice[]): IVoice[] => {
  customVoiceMemoryCache = dedupeVoices(voices.map((voice) => normalizeVoice(voice, 'custom')));
  return [...customVoiceMemoryCache];
};

const buildCustomVoiceCreateRequest = (
  input: CreateCustomVoiceInput
): MagicStudioCustomVoiceCreateRequest => ({
  name: safeString(input.name, 'Custom Voice'),
  gender: normalizeVoiceGender(input.gender),
  style: safeString(input.style, 'neutral'),
  language: safeString(input.language, 'en-US'),
  provider: safeString(input.provider, 'magic-studio-voice-lab'),
  previewUrl: safeString(input.previewUrl) || undefined,
  previewText: safeString(input.previewText) || undefined,
  avatarUrl: safeString(input.avatarUrl) || undefined,
  description: safeString(input.description) || undefined,
  tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : undefined,
  referenceAudio: toMediaInputRef(input.referenceAudio),
  isFavorite: input.isFavorite,
});

const buildCustomVoiceUpdateRequest = (
  input: Partial<CreateCustomVoiceInput>
): MagicStudioCustomVoiceUpdateRequest => ({
  name: safeString(input.name) || undefined,
  gender: input.gender ? normalizeVoiceGender(input.gender) : undefined,
  style: safeString(input.style) || undefined,
  language: safeString(input.language) || undefined,
  provider: safeString(input.provider) || undefined,
  previewUrl: safeString(input.previewUrl) || undefined,
  previewText: safeString(input.previewText) || undefined,
  avatarUrl: safeString(input.avatarUrl) || undefined,
  description: safeString(input.description) || undefined,
  tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : undefined,
  referenceAudio: toMediaInputRef(input.referenceAudio),
  isFavorite: input.isFavorite,
});

export const voiceSpeakerService = {
  DEFAULT_PREVIEW,
  DEFAULT_CUSTOM_VOICE_STORAGE_KEY,

  safeString,
  safeGender,
  normalizeVoice,
  dedupeVoices,

  loadCustomVoices(_storageKey = DEFAULT_CUSTOM_VOICE_STORAGE_KEY): IVoice[] {
    return [...customVoiceMemoryCache];
  },

  saveCustomVoices(
    voices: IVoice[],
    _storageKey = DEFAULT_CUSTOM_VOICE_STORAGE_KEY
  ): void {
    syncCustomVoiceMemory(voices);
  },

  async getMarketVoices(voicesFromProps?: IVoice[]): Promise<IVoice[]> {
    if (voicesFromProps && voicesFromProps.length > 0) {
      return dedupeVoices(
        voicesFromProps.map((voice) => normalizeVoice(voice, 'market'))
      );
    }

    try {
      const response = await createServerClient().listMarketVoices({
        page: 1,
        size: 100,
      });
      return dedupeVoices(
        (response.items || []).map((voice) => mapServerVoiceToVoice(voice))
      );
    } catch (error) {
      console.warn('Failed to load market voices from canonical server', error);
      return dedupeVoices(
        (PRESET_VOICES as VoiceProfile[]).map((voice) =>
          normalizeVoice(
            {
              ...voice,
              previewUrl: safeString(voice.previewUrl, DEFAULT_PREVIEW),
              source: 'market',
            } as IVoice,
            'market'
          )
        )
      );
    }
  },

  async getWorkspaceVoices(): Promise<IVoice[]> {
    const response = await createServerClient().listWorkspaceVoices({
      page: 1,
      size: 100,
    });
    return dedupeVoices(
      (response.items || []).map((voice) => mapServerVoiceToVoice(voice))
    );
  },

  async getCustomVoices(): Promise<IVoice[]> {
    const response = await createServerClient().listCustomVoices({
      page: 1,
      size: 100,
    });
    return syncCustomVoiceMemory(
      (response.items || []).map((voice) => mapServerVoiceToVoice(voice))
    );
  },

  async createCustomVoice(input: CreateCustomVoiceInput): Promise<IVoice> {
    const response = await createServerClient().createCustomVoice(
      buildCustomVoiceCreateRequest(input)
    );
    const created = response.data;
    if (!created) {
      throw new Error('Custom voice creation did not return a voice payload');
    }

    const mapped = mapServerVoiceToVoice(created);
    syncCustomVoiceMemory([mapped, ...customVoiceMemoryCache]);
    return mapped;
  },

  async readVoiceSpeaker(speakerId: string): Promise<IVoice | null> {
    const response = await createServerClient().readVoiceSpeaker(speakerId);
    return response.data ? mapServerVoiceToVoice(response.data) : null;
  },

  async updateCustomVoice(
    speakerId: string,
    input: Partial<CreateCustomVoiceInput>
  ): Promise<IVoice> {
    const response = await createServerClient().updateCustomVoice(
      speakerId,
      buildCustomVoiceUpdateRequest(input)
    );
    const updated = response.data;
    if (!updated) {
      throw new Error('Custom voice update did not return a voice payload');
    }

    const mapped = mapServerVoiceToVoice(updated);
    syncCustomVoiceMemory(
      customVoiceMemoryCache.map((voice) =>
        safeString(voice.uuid, voice.id) === safeString(mapped.uuid, mapped.id)
          ? mapped
          : voice
      )
    );
    return mapped;
  },

  async deleteCustomVoice(speakerId: string): Promise<void> {
    await createServerClient().deleteCustomVoice(speakerId);
    syncCustomVoiceMemory(
      customVoiceMemoryCache.filter(
        (voice) =>
          safeString(voice.id) !== speakerId &&
          safeString(voice.uuid) !== speakerId
      )
    );
  },

  async submitCloneTask(input: {
    sampleAudioUrl?: string;
    sampleAudio?: VoiceInputResourceRef | null;
    speakerId: string;
    language: string;
    model?: string;
    idempotencyKey?: string;
    previewText?: string;
    autoUpdatePreview?: boolean;
  }): Promise<string | null> {
    await assertRuntimeMagicStudioExecutionOperationReady(
      'voice-clone-tasks',
      'create-clone-task',
      { feature: 'VoiceSpeakerService' }
    );

    const response = await createServerClient().createVoiceCloneTask(
      buildVoiceCloneTaskCreateRequest({
        speakerId: input.speakerId,
        sampleAudio: input.sampleAudio,
        sampleAudioUrl: input.sampleAudioUrl,
        language: input.language,
        model: input.model,
        idempotencyKey: input.idempotencyKey,
        previewText: input.previewText,
        autoUpdatePreview: input.autoUpdatePreview,
      })
    );
    return safeIdString(response.data?.taskId) || null;
  },

  async listCloneTasks(
    query?: MagicStudioVoiceCloneTaskListQuery
  ): Promise<VoiceSpeakerCloneTaskResultData[]> {
    const response = await createServerClient().listVoiceCloneTasks(query);
    return (response.items || [])
      .map((task) => mapCloneTaskResult(task))
      .filter(
        (task): task is VoiceSpeakerCloneTaskResultData => task !== null
      );
  },

  async getCloneTaskResult(
    taskId: string
  ): Promise<VoiceSpeakerCloneTaskResultData | null> {
    const response = await createServerClient().readVoiceCloneTask(taskId);
    return mapCloneTaskResult(response.data);
  },

  async cancelCloneTask(
    taskId: string
  ): Promise<VoiceSpeakerCloneTaskResultData | null> {
    const response = await createServerClient().cancelVoiceCloneTask(taskId);
    return mapCloneTaskResult(response.data);
  },

  async deleteCloneTask(taskId: string): Promise<void> {
    await createServerClient().deleteVoiceCloneTask(taskId);
  },

  async waitForCloneTaskResult(
    taskId: string,
    options?: {
      maxAttempts?: number;
      waitMs?: number;
    }
  ): Promise<VoiceSpeakerCloneTaskResultData | null> {
    const normalizedTaskId = safeIdString(taskId);
    if (!normalizedTaskId) {
      return null;
    }

    const maxAttempts =
      typeof options?.maxAttempts === 'number' && options.maxAttempts > 0
        ? Math.floor(options.maxAttempts)
        : CLONE_TASK_MAX_ATTEMPTS;
    const waitMs =
      typeof options?.waitMs === 'number' && options.waitMs >= 0
        ? options.waitMs
        : CLONE_TASK_WAIT_MS;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const result = await this.getCloneTaskResult(normalizedTaskId);
      if (!result) {
        if (attempt < maxAttempts - 1) {
          await waitForMs(waitMs);
        }
        continue;
      }

      if (isCloneTaskTerminalStatus(result.status)) {
        return result;
      }

      if (attempt < maxAttempts - 1) {
        await waitForMs(waitMs);
      }
    }

    return null;
  },

  async updatePreviewSettings(
    speakerId: string,
    input: VoiceSpeakerPreviewUpdateRequest
  ): Promise<VoiceSpeakerPreviewUpdateData | null> {
    const response = await createServerClient().updateVoicePreview(speakerId, input);
    const updated = response.data;
    if (!updated) {
      return null;
    }

    return {
      previewText: safeString(updated.previewText) || undefined,
      previewAudioUrl: safeString(updated.previewUrl) || undefined,
    };
  },

  async refreshCustomVoices(_voices: IVoice[] = []): Promise<IVoice[]> {
    try {
      return await this.getCustomVoices();
    } catch (error) {
      console.warn('Failed to refresh custom voices from canonical server', error);
      return [...customVoiceMemoryCache];
    }
  },

  async resolveVoiceAssetUrl(
    reference?: Asset | VoiceInputResourceRef | string | null
  ): Promise<string> {
    return resolveVoiceAssetUrlInternal(reference);
  },

  async playPreviewAudio(
    reference: Asset | VoiceInputResourceRef | string,
    callbacks?: {
      onPlaying?: () => void;
      onEnded?: () => void;
      onError?: (error: unknown) => void;
    }
  ): Promise<HTMLAudioElement | null> {
    const source = safeString(await resolveVoiceAssetUrlInternal(reference), '');
    if (!source) {
      return null;
    }

    const audio = new Audio(source);
    audio.onended = () => {
      callbacks?.onEnded?.();
    };
    audio.onerror = () => {
      callbacks?.onError?.(
        new Error(`Failed to play preview audio: ${source}`)
      );
    };

    try {
      await audio.play();
      callbacks?.onPlaying?.();
      return audio;
    } catch (error) {
      callbacks?.onError?.(error);
      return null;
    }
  },

  stopPreviewAudio(audio?: HTMLAudioElement | null): void {
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  },

  async importReferenceAudioFromUpload(
    file: UploadedVoiceReferenceInput,
    source: string
  ): Promise<Asset> {
    const uploadBytes = await toUploadBytes(file.data);
    const uploaded = await importAssetBySdk(
      {
        name: file.name,
        data: uploadBytes,
      },
      'voice',
      { domain: 'voice-speaker' }
    );
    return resolveUploadedVoiceAsset(uploaded, file.name, source);
  },

  async importReferenceAudioFromBlob(
    blob: Blob,
    fileName: string,
    source: string
  ): Promise<Asset> {
    const uploadBytes = await toUploadBytes(blob);
    const uploaded = await importAssetBySdk(
      {
        name: fileName,
        data: uploadBytes,
      },
      'voice',
      { domain: 'voice-speaker' }
    );
    return resolveUploadedVoiceAsset(uploaded, fileName, source);
  },
};

export type VoiceSpeakerService = typeof voiceSpeakerService;
