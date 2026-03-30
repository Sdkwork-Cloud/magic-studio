import {
    importAssetBySdk,
    importAssetFromUrlBySdk,
    queryAssetsBySdk,
    resolveAssetPrimaryUrlBySdk,
    resolveAssetUrlByAssetIdFirst,
    type Asset
} from '@sdkwork/react-assets';
import { hasSdkworkClient, OFFLINE_DEMO_AUDIO_URL, sdk } from '@sdkwork/react-core';
import type { GeneratedVoiceResult, VoiceProfile } from '../entities';
import type { IVoice } from '../components/voicespeaker/types';
import { voiceService } from './voiceService';

const DEFAULT_PREVIEW = OFFLINE_DEMO_AUDIO_URL;
const DEFAULT_CUSTOM_VOICE_STORAGE_KEY = 'sdkwork_voice_lab_custom_v1';

export interface UploadedVoiceReferenceInput {
    data: Uint8Array | File;
    name: string;
    path?: string;
}

interface ApiEnvelope<T> {
    data?: T;
    code?: string | number;
    msg?: string;
    message?: string;
}

interface SdkVoiceItemLike {
    voiceId?: string;
    name?: string;
    description?: string;
    language?: string;
    gender?: string;
    style?: string;
    previewAudioUrl?: string;
}

interface SdkVoiceListLike {
    voices?: SdkVoiceItemLike[];
}

interface SdkVoiceSpeakerVO {
    code?: string;
    name?: string;
    localName?: string;
    description?: string;
    gender?: string;
    tags?: string[];
    channelName?: string;
    faceImageUrl?: string;
    createdAt?: string;
}

interface SdkVoiceSpeakerPage {
    content?: SdkVoiceSpeakerVO[];
}

interface SdkVoiceSpeakerItem {
    speakerId?: string;
    speakerName?: string;
    description?: string;
    previewAudioUrl?: string;
    gender?: string;
    language?: string;
    style?: string;
    createdAt?: string;
}

interface SdkVoiceSpeakerListVO {
    speakers?: SdkVoiceSpeakerItem[];
}

interface SdkVoiceSpeakerListPage {
    content?: SdkVoiceSpeakerListVO[];
}

interface SdkGenerationTaskLike {
    taskId?: string | number;
}

const safeString = (value: unknown, fallback = ''): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    return fallback;
};

const safeIdString = (value: unknown, fallback = ''): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return fallback;
};

const safeGender = (value: unknown): 'male' | 'female' | 'neutral' => {
    const normalized = safeString(value, 'neutral').toLowerCase();
    if (normalized === 'male' || normalized === 'female') {
        return normalized;
    }
    return 'neutral';
};

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

const unwrapApiData = <T>(payload: T | ApiEnvelope<T> | undefined): T | undefined => {
    if (!payload) {
        return undefined;
    }
    if (typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
        const envelope = payload as ApiEnvelope<T>;
        if (envelope.data !== undefined) {
            return envelope.data;
        }
    }
    return payload as T;
};

const mapSdkVoiceItemToVoice = (item: SdkVoiceItemLike): IVoice =>
    ({
        id: safeIdString(item.voiceId, `sdk-voice-${Date.now()}`),
        name: safeString(item.name, 'SDK Voice'),
        gender: safeGender(item.gender),
        style: safeString(item.style, 'neutral'),
        language: safeString(item.language, 'en-US'),
        previewUrl: safeString(item.previewAudioUrl, DEFAULT_PREVIEW),
        provider: 'SDK Audio',
        source: 'market',
        description: safeString(item.description, ''),
        createdAt: Date.now()
    } as IVoice);

const mapSdkVoiceSpeakerVoToVoice = (item: SdkVoiceSpeakerVO): IVoice =>
    ({
        id: safeIdString(item.code, `sdk-speaker-${Date.now()}`),
        name: safeString(item.name, safeString(item.localName, 'SDK Speaker')),
        gender: safeGender(item.gender),
        style: 'neutral',
        language: 'en-US',
        previewUrl: DEFAULT_PREVIEW,
        provider: safeString(item.channelName, 'SDK Voice Speaker'),
        source: 'market',
        description: safeString(item.description, ''),
        avatarUrl: safeString(item.faceImageUrl, ''),
        tags: Array.isArray(item.tags) ? item.tags : ['sdk'],
        createdAt: parseTimestamp(item.createdAt) || Date.now()
    } as IVoice);

const mapSdkVoiceSpeakerItemToVoice = (item: SdkVoiceSpeakerItem): IVoice =>
    ({
        id: safeIdString(item.speakerId, `sdk-speaker-item-${Date.now()}`),
        name: safeString(item.speakerName, 'SDK Speaker'),
        gender: safeGender(item.gender),
        style: safeString(item.style, 'neutral'),
        language: safeString(item.language, 'en-US'),
        previewUrl: safeString(item.previewAudioUrl, DEFAULT_PREVIEW),
        provider: 'SDK Voice Speaker',
        source: 'market',
        description: safeString(item.description, ''),
        createdAt: parseTimestamp(item.createdAt) || Date.now()
    } as IVoice);

const normalizeVoice = (voice: IVoice, source: IVoice['source']): IVoice => {
    const providerBySource: Record<string, string> = {
        market: 'Voice Market',
        workspace: 'Workspace',
        custom: 'Voice Lab'
    };

    return {
        id: safeString(voice.id, `voice-${Date.now()}`),
        name: safeString(voice.name, 'Unnamed Voice'),
        gender: safeGender(voice.gender),
        style: safeString(voice.style, 'neutral'),
        language: safeString(voice.language, 'en-US'),
        previewUrl: safeString(voice.previewUrl, DEFAULT_PREVIEW),
        previewText: safeString(voice.previewText, ''),
        tags: Array.isArray(voice.tags) ? voice.tags : [],
        provider: safeString(voice.provider, providerBySource[source || 'market'] || 'Voice'),
        source,
        description: safeString(voice.description, ''),
        avatarUrl: safeString(voice.avatarUrl, ''),
        createdAt: typeof voice.createdAt === 'number' ? voice.createdAt : Date.now()
    };
};

const dedupeVoices = (voices: IVoice[]): IVoice[] => {
    const map = new Map<string, IVoice>();
    voices.forEach((voice) => {
        map.set(voice.id, voice);
    });
    return Array.from(map.values());
};

const toUploadBytes = async (input: Uint8Array | Blob | File): Promise<Uint8Array> => {
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
    const resolvedUrl =
        (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
        uploaded.path ||
        fallbackUrl;
    return {
        ...uploaded,
        name: safeString(uploaded.name, fallbackName),
        path: resolvedUrl
    };
};

const mapAssetToWorkspaceVoice = async (asset: Asset): Promise<IVoice | null> => {
    if (!asset.id) {
        return null;
    }

    const metadata = (asset.metadata || {}) as Record<string, unknown>;
    const sourceLocator = safeString(asset.path, asset.id);

    const previewUrl =
        (await resolveAssetUrlByAssetIdFirst({
            id: asset.id,
            assetId: asset.id,
            path: sourceLocator,
            url: sourceLocator
        } as any)) || sourceLocator;

    const voice: IVoice = {
        id: asset.id,
        name: safeString(asset.name, `Voice ${asset.id.slice(0, 8)}`),
        gender: safeGender(metadata.gender ?? metadata.voiceGender ?? metadata.speakerGender),
        style: safeString(metadata.style ?? metadata.voiceStyle, 'neutral'),
        language: safeString(metadata.language ?? metadata.locale ?? metadata.voiceLocale, 'en-US'),
        previewUrl: safeString(previewUrl, DEFAULT_PREVIEW),
        previewText: safeString(metadata.previewText ?? metadata.previewScript ?? metadata.script, ''),
        provider: safeString(metadata.provider ?? metadata.source, 'Workspace Voice'),
        source: 'workspace',
        description: safeString(metadata.description ?? metadata.text, ''),
        tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : ['workspace'],
        createdAt: parseTimestamp(asset.createdAt) || Date.now()
    };

    return normalizeVoice(voice, 'workspace');
};

const resolveImportedVoiceUrl = (asset: Asset): string => asset.path || asset.id;

const loadMarketVoicesFromSdk = async (): Promise<IVoice[]> => {
    if (!hasSdkworkClient()) {
        return [];
    }

    const result: IVoice[] = [];
    const sdkClient = sdk.client as unknown as {
        audio?: {
            getVoiceList?: (params?: Record<string, unknown>) => Promise<unknown>;
        };
        voiceSpeakers?: {
            listSpeakers?: (params?: Record<string, unknown>) => Promise<unknown>;
        };
        voiceSpeaker?: {
            listSpeakers?: (params?: Record<string, unknown>) => Promise<unknown>;
            cloneSpeaker?: (body: Record<string, unknown>) => Promise<unknown>;
        };
    };

    try {
        const audioApi = sdkClient.audio;
        if (audioApi && typeof audioApi.getVoiceList === 'function') {
            const payload = await audioApi.getVoiceList({ page: 0, size: 100 });
            const data = unwrapApiData<SdkVoiceListLike>(payload as ApiEnvelope<SdkVoiceListLike> | SdkVoiceListLike);
            const voices = Array.isArray(data?.voices) ? data.voices : [];
            result.push(...voices.map((item) => normalizeVoice(mapSdkVoiceItemToVoice(item), 'market')));
        }
    } catch (error) {
        console.warn('Failed to load market voices from sdk.audio.getVoiceList', error);
    }

    try {
        const voiceSpeakersApi = sdkClient.voiceSpeakers;
        if (voiceSpeakersApi && typeof voiceSpeakersApi.listSpeakers === 'function') {
            const payload = await voiceSpeakersApi.listSpeakers({ page: 0, size: 100 });
            const data = unwrapApiData<SdkVoiceSpeakerPage>(payload as ApiEnvelope<SdkVoiceSpeakerPage> | SdkVoiceSpeakerPage);
            const voices = Array.isArray(data?.content) ? data.content : [];
            result.push(...voices.map((item) => normalizeVoice(mapSdkVoiceSpeakerVoToVoice(item), 'market')));
        }
    } catch (error) {
        console.warn('Failed to load market voices from sdk.voiceSpeakers.listSpeakers', error);
    }

    try {
        const generationSpeakerApi = sdkClient.voiceSpeaker;
        if (generationSpeakerApi && typeof generationSpeakerApi.listSpeakers === 'function') {
            const payload = await generationSpeakerApi.listSpeakers({ page: 0, size: 50 });
            const data = unwrapApiData<SdkVoiceSpeakerListPage>(
                payload as ApiEnvelope<SdkVoiceSpeakerListPage> | SdkVoiceSpeakerListPage
            );
            const pageList = Array.isArray(data?.content) ? data.content : [];
            pageList.forEach((pageItem) => {
                const speakers = Array.isArray(pageItem?.speakers) ? pageItem.speakers : [];
                result.push(...speakers.map((item) => normalizeVoice(mapSdkVoiceSpeakerItemToVoice(item), 'market')));
            });
        }
    } catch (error) {
        console.warn('Failed to load market voices from sdk.voiceSpeaker.listSpeakers', error);
    }

    return dedupeVoices(result);
};

export const voiceSpeakerService = {
    DEFAULT_PREVIEW,
    DEFAULT_CUSTOM_VOICE_STORAGE_KEY,

    safeString,
    safeGender,
    normalizeVoice,
    dedupeVoices,

    loadCustomVoices(storageKey = DEFAULT_CUSTOM_VOICE_STORAGE_KEY): IVoice[] {
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw) as IVoice[];
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.map((voice) => normalizeVoice(voice, 'custom'));
        } catch (error) {
            console.warn('Failed to load custom voices from storage', error);
            return [];
        }
    },

    saveCustomVoices(voices: IVoice[], storageKey = DEFAULT_CUSTOM_VOICE_STORAGE_KEY): void {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(voices));
        } catch (error) {
            console.warn('Failed to persist custom voices', error);
        }
    },

    async getMarketVoices(voicesFromProps?: IVoice[]): Promise<IVoice[]> {
        if (voicesFromProps && voicesFromProps.length > 0) {
            return dedupeVoices(voicesFromProps.map((voice) => normalizeVoice(voice, 'market')));
        }

        const sdkMappedVoices = await loadMarketVoicesFromSdk();
        if (sdkMappedVoices.length > 0) {
            return sdkMappedVoices;
        }

        const sdkVoices = await voiceService.getVoices();
        const mapped = (sdkVoices as VoiceProfile[]).map((voice) =>
            normalizeVoice(
                {
                    ...voice,
                    previewUrl: safeString(voice.previewUrl, DEFAULT_PREVIEW)
                } as IVoice,
                'market'
            )
        );

        return dedupeVoices(mapped);
    },

    async submitCloneTask(input: {
        sampleAudioUrl: string;
        speakerName: string;
        language?: string;
        model?: string;
    }): Promise<string | null> {
        if (!hasSdkworkClient()) {
            return null;
        }

        const sdkClient = sdk.client as unknown as {
            voiceSpeaker?: {
                cloneSpeaker?: (body: Record<string, unknown>) => Promise<unknown>;
            };
        };
        const cloneApi = sdkClient.voiceSpeaker;
        if (!cloneApi || typeof cloneApi.cloneSpeaker !== 'function') {
            return null;
        }

        const payload = await cloneApi.cloneSpeaker({
            sampleAudioUrl: input.sampleAudioUrl,
            speakerName: input.speakerName,
            language: input.language,
            model: input.model
        });
        const task = unwrapApiData<SdkGenerationTaskLike>(payload as ApiEnvelope<SdkGenerationTaskLike> | SdkGenerationTaskLike);
        return safeIdString(task?.taskId, '') || null;
    },

    async getWorkspaceVoices(): Promise<IVoice[]> {
        const page = await queryAssetsBySdk({
            category: 'voice',
            pageRequest: {
                page: 0,
                size: 100,
                sort: ['createdAt,DESC']
            },
            allowedTypes: ['voice']
        });

        const mapped = await Promise.all(page.content.map((asset) => mapAssetToWorkspaceVoice(asset)));
        const normalized = mapped.filter((voice): voice is IVoice => !!voice);
        return dedupeVoices(normalized);
    },

    async resolveVoiceAssetUrl(reference?: Asset | string | null): Promise<string> {
        if (!reference) {
            return '';
        }

        if (typeof reference === 'string') {
            const resolved = await resolveAssetUrlByAssetIdFirst({ path: reference, id: reference, url: reference } as any);
            return resolved || reference;
        }

        const source = reference.path || reference.id;
        const resolved = await resolveAssetUrlByAssetIdFirst({
            assetId: reference.id,
            id: reference.id,
            path: source,
            url: source
        } as any);
        return resolved || source || '';
    },

    async playPreviewAudio(
        url: string,
        callbacks?: {
            onPlaying?: () => void;
            onEnded?: () => void;
            onError?: (error: unknown) => void;
        }
    ): Promise<HTMLAudioElement | null> {
        const source = safeString(url, '');
        if (!source) {
            return null;
        }

        const audio = new Audio(source);
        audio.onended = () => {
            callbacks?.onEnded?.();
        };
        audio.onerror = () => {
            callbacks?.onError?.(new Error(`Failed to play preview audio: ${source}`));
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
                data: uploadBytes
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
                data: uploadBytes
            },
            'voice',
            { domain: 'voice-speaker' }
        );
        return resolveUploadedVoiceAsset(uploaded, fileName, source);
    },

    async persistGeneratedVoiceResult(input: {
        taskId: string;
        index: number;
        result: GeneratedVoiceResult;
        inlineData?: Uint8Array | Blob;
    }): Promise<GeneratedVoiceResult> {
        const { taskId, index, result, inlineData } = input;
        const fileName = `voice_gen_${taskId}_${index + 1}.wav`;
        const uploaded = inlineData
            ? await importAssetBySdk(
                {
                    name: fileName,
                    data: await toUploadBytes(inlineData)
                },
                'voice',
                { domain: 'voice-speaker' }
            )
            : await importAssetFromUrlBySdk(
                result.url,
                'voice',
                {
                    name: fileName,
                    domain: 'voice-speaker'
                }
            );

        const mappedAsset = await resolveUploadedVoiceAsset(
            uploaded,
            result.speakerName || `voice-${index + 1}`,
            result.url
        );
        return {
            ...result,
            url: resolveImportedVoiceUrl(mappedAsset)
        };
    }
};

export type VoiceSpeakerService = typeof voiceSpeakerService;
