import type { AnyMediaResource } from '@sdkwork/react-commons';
import type { GeneratedVoiceResult, VoiceConfig } from '@sdkwork/react-voicespeaker';

import type { CutClip } from '../../entities/magicCut.entity';

export interface BuildVoiceGenerationConfigInput {
  script: string;
  voiceId: string;
  pitch: number;
  speed: number;
  metadata?: Record<string, unknown>;
}

export interface ResolveGeneratedVoiceUpdatesInput {
  resource: AnyMediaResource;
  clip: CutClip;
  script: string;
  result: GeneratedVoiceResult;
  voiceId: string;
  pitch: number;
}

const DEFAULT_VOICE_MODEL: VoiceConfig['model'] = 'gemini-tts';

export function buildVoiceGenerationConfig(
  input: BuildVoiceGenerationConfigInput
): VoiceConfig {
  const metadata = input.metadata || {};
  const normalizedScript = input.script.trim();

  return {
    text: normalizedScript,
    voiceId: input.voiceId,
    model: (metadata.model as VoiceConfig['model']) || DEFAULT_VOICE_MODEL,
    speed: input.speed,
    pitch: input.pitch,
    description: typeof metadata.description === 'string' ? metadata.description : undefined,
    mediaType: 'voice',
  };
}

export function resolveGeneratedVoiceUpdates(
  input: ResolveGeneratedVoiceUpdatesInput
) {
  const clipSpeed = Math.max(input.clip.speed || 1, 0.1);
  const nextSourceDuration = Math.max(0.1, input.result.duration);
  const nextTimelineDuration = nextSourceDuration / clipSpeed;

  return {
    clipUpdates: {
      content: input.script,
      duration: nextTimelineDuration,
      offset: 0,
    } satisfies Partial<CutClip>,
    resourceUpdates: {
      url: input.result.url,
      path: input.result.url,
      duration: nextSourceDuration,
      metadata: {
        ...(input.resource.metadata || {}),
        text: input.script,
        voiceId: input.voiceId,
        pitch: input.pitch,
        speakerName: input.result.speakerName,
        generatedVoiceUrl: input.result.url,
        generatedVoiceDuration: nextSourceDuration,
      },
    } satisfies Partial<AnyMediaResource>,
  };
}
