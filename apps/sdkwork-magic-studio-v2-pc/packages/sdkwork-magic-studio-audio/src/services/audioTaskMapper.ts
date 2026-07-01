import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';
import { createGenerationOutcome } from '@sdkwork/magic-studio-core/services';
import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import type { AudioGenerationParams } from '../entities';
import {
  resolveAudioInputResourcePath,
  resolveAudioInputResourceUrl,
} from '../entities';
import {
  DEFAULT_AUDIO_TTS_MODEL,
  normalizeAudioTextModel,
  normalizeAudioTtsModel,
} from '../utils/audioModel';

function safeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function safeIdString(value: unknown): string {
  return safeString(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function readRecordString(
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const resolved = safeString(record?.[key]);
  return resolved || undefined;
}

function resolveAudioTaskStatus(
  status: MagicStudioGenerationTask['status'],
): GenerationOutcome['execution']['status'] {
  switch (status) {
    case 'processing':
    case 'succeeded':
    case 'failed':
    case 'cancelled':
      return status;
    case 'draft':
    case 'queued':
    default:
      return 'queued';
  }
}

function resolvePrimaryArtifact(
  task: MagicStudioGenerationTask,
): MagicStudioGenerationArtifact | null {
  const candidates = [
    task.primaryArtifact || null,
    ...(Array.isArray(task.artifacts) ? task.artifacts : []),
  ];
  const seen = new Set<string>();

  for (const artifact of candidates) {
    if (!artifact) {
      continue;
    }

    const url = safeString(artifact.url);
    const type = safeString(artifact.type);
    if (!url) {
      continue;
    }
    if (type !== 'audio' && type !== 'text' && type !== 'voice') {
      continue;
    }

    const key =
      safeIdString(artifact.uuid) ||
      safeIdString(artifact.id) ||
      url;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    return artifact;
  }

  return null;
}

function resolveSourceAudioUrl(params: AudioGenerationParams): string | null {
  const candidate = resolveAudioInputResourceUrl(params.sourceAudio);
  return typeof candidate === 'string' && isRenderableInputResourceUrl(candidate)
    ? candidate
    : null;
}

function resolveTextPayload(
  artifact: MagicStudioGenerationArtifact,
  task: MagicStudioGenerationTask,
): {
  text: string;
  language?: string;
  duration?: number;
  segments?: unknown[] | null;
  words?: unknown[] | null;
} {
  const metadata = {
    ...(asRecord(task.providerPayload) || {}),
    ...(asRecord(artifact.metadata) || {}),
  };
  const text =
    safeString(metadata.text) ||
    safeString(metadata.transcript) ||
    safeString(metadata.transcription) ||
    safeString(metadata.translatedText);

  return {
    text,
    language: safeString(metadata.language) || undefined,
    duration: artifact.duration ?? safeNumber(metadata.duration),
    segments: Array.isArray(metadata.segments) ? [...metadata.segments] : null,
    words: Array.isArray(metadata.words) ? [...metadata.words] : null,
  };
}

function buildTextDataUrl(text: string): string {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
}

export const isAudioGenerationTaskTerminalStatus = (
  task?: Pick<MagicStudioGenerationTask, 'status'> | null,
): boolean =>
  task?.status === 'succeeded' ||
  task?.status === 'failed' ||
  task?.status === 'cancelled';

export function mapCanonicalAudioTaskToGenerationOutcome(
  task: MagicStudioGenerationTask,
  params: AudioGenerationParams,
): GenerationOutcome {
  const artifact = resolvePrimaryArtifact(task);
  if (!artifact) {
    throw new Error(
      task.errorMessage || 'Audio generation did not return a primary artifact',
    );
  }

  const taskParameters = asRecord(task.parameters) || {};
  const providerPayload = asRecord(task.providerPayload) || {};
  const status = resolveAudioTaskStatus(task.status);
  const remoteJobId = safeIdString(task.remoteJobId) || safeIdString(task.taskId) || null;

  if (artifact.type === 'text' || task.mode === 'speech-to-text') {
    const textPayload = resolveTextPayload(artifact, task);
    if (!textPayload.text) {
      throw new Error(
        task.errorMessage || 'Audio text generation did not return text content',
      );
    }

    const sourceAudioUrl =
      readRecordString(providerPayload, 'sourceAudioUrl') ||
      resolveSourceAudioUrl(params) ||
      null;
    const sourceAudioPath =
      readRecordString(providerPayload, 'sourceAudioPath') ||
      resolveAudioInputResourcePath(params.sourceAudio) ||
      null;
    const fileNameRoot =
      safeString(params.sourceAudio?.name).replace(/\.[^.]+$/, '') ||
      (params.mode === 'translation'
        ? 'audio-translation'
        : 'audio-transcription');
    const requestedModel = normalizeAudioTextModel(task.providerModel || params.model);

    return createGenerationOutcome({
      product: 'text',
      mode: 'speech-to-text',
      provider: safeString(task.provider, 'magic-studio-server'),
      providerModel: requestedModel,
      prompt:
        safeString(task.prompt) ||
        safeString(params.prompt) ||
        safeString(params.sourceAudio?.name),
      inputRefs: task.inputRefs,
      parameters: {
        sourceAudioUrl,
        sourceAudioPath,
        requestedLanguage:
          params.language ||
          readRecordString(taskParameters, 'language') ||
          readRecordString(providerPayload, 'language') ||
          null,
        requestedFormat:
          params.format ||
          readRecordString(taskParameters, 'format') ||
          null,
        sourceLanguage:
          params.sourceLanguage ||
          readRecordString(taskParameters, 'sourceLanguage') ||
          null,
        targetLanguage:
          params.targetLanguage ||
          readRecordString(taskParameters, 'targetLanguage') ||
          null,
        task:
          readRecordString(providerPayload, 'task') ||
          (params.mode === 'translation' ? 'translate' : 'transcribe'),
      },
      providerPayload: {
        ...providerPayload,
        sourceAudioUrl,
        sourceAudioPath,
        text: textPayload.text,
        language: textPayload.language || null,
        duration: textPayload.duration ?? null,
        segments: textPayload.segments,
        words: textPayload.words,
      },
      remoteJobId,
      status,
      progress: task.progress,
      artifact: {
        type: 'text',
        url: safeString(artifact.url, buildTextDataUrl(textPayload.text)),
        mimeType: safeString(artifact.mimeType, 'text/plain'),
        name: safeString(artifact.name, `${fileNameRoot}.txt`),
        duration: textPayload.duration,
        metadata: {
          ...(asRecord(artifact.metadata) || {}),
          text: textPayload.text,
          language: textPayload.language || null,
          duration: textPayload.duration ?? null,
          segments: textPayload.segments,
          words: textPayload.words,
          sourceAudioUrl,
          sourceAudioPath,
          sourceAudioName: safeString(params.sourceAudio?.name) || null,
          targetLanguage:
            params.targetLanguage ||
            readRecordString(taskParameters, 'targetLanguage') ||
            null,
          sourceLanguage:
            params.sourceLanguage ||
            readRecordString(taskParameters, 'sourceLanguage') ||
            null,
        },
      },
    });
  }

  const requestedModel = normalizeAudioTtsModel(task.providerModel || params.model);
  return createGenerationOutcome({
    product: 'speech',
    mode: 'text-to-speech',
    provider: safeString(task.provider, 'magic-studio-server'),
    providerModel: requestedModel || DEFAULT_AUDIO_TTS_MODEL,
    prompt: safeString(task.prompt, params.prompt),
    negativePrompt: safeString(params.negativePrompt) || undefined,
    inputRefs: task.inputRefs,
    parameters: {
      ...taskParameters,
      voice:
        params.voice ||
        readRecordString(taskParameters, 'voice') ||
        readRecordString(providerPayload, 'voice') ||
        null,
      requestedModel: requestedModel || DEFAULT_AUDIO_TTS_MODEL,
      requestedDuration:
        params.duration ??
        safeNumber(taskParameters['duration']) ??
        artifact.duration ??
        null,
      seed:
        typeof params.seed === 'number' && Number.isFinite(params.seed)
          ? params.seed
          : null,
    },
    providerPayload: {
      ...providerPayload,
      requestedModel: requestedModel || DEFAULT_AUDIO_TTS_MODEL,
      voice:
        params.voice ||
        readRecordString(taskParameters, 'voice') ||
        readRecordString(providerPayload, 'voice') ||
        null,
    },
    remoteJobId,
    status,
    progress: task.progress,
    artifact: {
      type: 'audio',
      url: safeString(artifact.url),
      mimeType: safeString(artifact.mimeType, 'audio/wav'),
      name: safeString(
        artifact.name,
        `generated-audio-${safeString(params.voice, 'default')}.wav`,
      ),
      duration: artifact.duration ?? params.duration,
      metadata: {
        ...(asRecord(artifact.metadata) || {}),
        requestedModel: requestedModel || DEFAULT_AUDIO_TTS_MODEL,
        requestedDuration:
          params.duration ??
          safeNumber(taskParameters['duration']) ??
          artifact.duration ??
          null,
        seed:
          typeof params.seed === 'number' && Number.isFinite(params.seed)
            ? params.seed
            : null,
        negativePrompt: safeString(params.negativePrompt) || null,
        voice:
          params.voice ||
          readRecordString(taskParameters, 'voice') ||
          readRecordString(providerPayload, 'voice') ||
          null,
      },
    },
  });
}
