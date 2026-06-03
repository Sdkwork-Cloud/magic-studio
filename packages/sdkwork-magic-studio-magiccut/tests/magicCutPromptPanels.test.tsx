/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  enhanceMagicCutPrompt: vi.fn(async (text: string) => `enhanced:${text}`),
  legacyEnhancePrompt: vi.fn(async (text: string) => `legacy:${text}`),
  onContentChange: vi.fn(),
  magicCutT: vi.fn((key: string) => key),
  voiceGenerateSpeech: vi.fn(),
  toGeneratedVoiceResult: vi.fn(),
  persistGenerationOutcomeAsset: vi.fn(),
  buildVoiceGenerationConfig: vi.fn(),
  resolveGeneratedVoiceUpdates: vi.fn(),
}));

vi.mock('../src/services', () => ({
  enhanceMagicCutPrompt: mocks.enhanceMagicCutPrompt,
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  genAIService: {
    enhancePrompt: mocks.legacyEnhancePrompt,
  },
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  PromptTextInput: ({
    value,
    onEnhance,
  }: {
    value?: string;
    onEnhance?: (text: string) => Promise<string>;
  }) => (
    <button
      data-testid="enhance-trigger"
      onClick={() => {
        void onEnhance?.(value || '');
      }}
    >
      Enhance
    </button>
  ),
  createPromptTextInputCapabilityProps: () => ({}),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('../src/components/Properties/widgets/PropertyWidgets', () => ({
  PropertySection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ScrubbableInput: () => null,
  Dropdown: () => null,
  ActionButton: ({
    label,
    onClick,
    disabled,
  }: {
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  ),
  ColorPicker: () => null,
  SegmentedControl: () => null,
}));

vi.mock('../src/hooks/useMagicCutTranslation', () => ({
  useMagicCutTranslation: () => ({
    t: mocks.magicCutT,
    tpr: (key: string) => key,
    tc: (key: string) => key,
  }),
}));

vi.mock('../src/engine/text/TextRenderer', () => ({
  DEFAULT_TEXT_STYLE: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 32,
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 1,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#ffffff',
    strokeWidth: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  },
}));

vi.mock('@sdkwork/magic-studio-voicespeaker/constants', () => ({
  PRESET_VOICES: [{ id: 'Kore', name: 'Kore' }],
}));

vi.mock('@sdkwork/magic-studio-voicespeaker/services', () => ({
  toGeneratedVoiceResult: mocks.toGeneratedVoiceResult,
  voiceBusinessService: {
    voiceService: {
      generateSpeech: mocks.voiceGenerateSpeech,
    },
  },
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  MediaResourceType: {
    SUBTITLE: 'subtitle',
  },
  generateUUID: () => 'generated-uuid',
}));

vi.mock('../src/store/magicCutStore', () => ({
  useMagicCutStore: () => ({
    project: { settings: { resolution: '1920x1080' } },
    state: { tracks: {}, clips: {}, resources: {} },
    activeTimeline: null,
    setClipSpeed: vi.fn(),
    addTrack: vi.fn(),
    addClip: vi.fn(),
    updateClip: vi.fn(),
    updateClipTransform: vi.fn(),
    applyTimelineEditResult: vi.fn(),
    beginTransaction: vi.fn(),
    commitTransaction: vi.fn(),
  }),
}));

vi.mock('../src/services/subtitle/SubtitleService', () => ({
  subtitleService: {
    downloadSRT: vi.fn(),
  },
}));

vi.mock('../src/domain/subtitle/voiceCaptioning', () => ({
  buildVoiceCaptionCues: vi.fn(() => []),
  resolveVoiceCaptionTrackPlacement: vi.fn(() => ({ trackId: null, insertIndex: 0 })),
}));

vi.mock('../src/domain/voice/voiceGeneration', () => ({
  buildVoiceGenerationConfig: mocks.buildVoiceGenerationConfig,
  resolveGeneratedVoiceUpdates: mocks.resolveGeneratedVoiceUpdates,
}));

vi.mock('@sdkwork/magic-studio-types', () => ({
  resolveEntityKey: (entity: { uuid?: string; id?: string }) => entity.uuid || entity.id || 'entity-key',
}));

import { TextSettingsPanel } from '../src/components/Properties/panels/TextSettingsPanel';
import { VoiceSettingsPanel } from '../src/components/Properties/panels/VoiceSettingsPanel';

describe('magiccut prompt panels', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.enhanceMagicCutPrompt.mockReset();
    mocks.enhanceMagicCutPrompt.mockResolvedValue('enhanced:Opening title');
    mocks.legacyEnhancePrompt.mockReset();
    mocks.legacyEnhancePrompt.mockResolvedValue('legacy:Opening title');
    mocks.onContentChange.mockReset();
    mocks.magicCutT.mockReset();
    mocks.magicCutT.mockImplementation((key: string) => key);
    mocks.voiceGenerateSpeech.mockReset();
    mocks.voiceGenerateSpeech.mockResolvedValue([{ id: 'outcome-1' }]);
    mocks.toGeneratedVoiceResult.mockReset();
    mocks.toGeneratedVoiceResult.mockReturnValue({
      duration: 2.5,
      speakerId: 'speaker-kore',
      resource: {
        url: 'https://cdn.example.com/generated-kore.wav',
      },
    });
    mocks.persistGenerationOutcomeAsset.mockReset();
    mocks.persistGenerationOutcomeAsset.mockResolvedValue({
      url: 'https://cdn.example.com/generated-kore.wav',
      duration: 2.5,
      artifactUuid: 'artifact-uuid-1',
    });
    mocks.buildVoiceGenerationConfig.mockReset();
    mocks.buildVoiceGenerationConfig.mockReturnValue({
      text: 'Voice over script',
      voiceId: 'Kore',
      name: 'Kore',
      pitch: 1,
      speed: 1,
      model: 'gemini-tts',
      mediaType: 'voice',
    });
    mocks.resolveGeneratedVoiceUpdates.mockReset();
    mocks.resolveGeneratedVoiceUpdates.mockReturnValue({
      clipUpdates: { duration: 2.5 },
      resourceUpdates: {
        metadata: {
          speakerId: 'speaker-kore',
        },
      },
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    root = null;
    container?.remove();
    container = null;
    document.body.innerHTML = '';
  });

  it('routes text enhancement through enhanceMagicCutPrompt instead of genAIService', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <TextSettingsPanel
          content="Opening title"
          onContentChange={mocks.onContentChange}
          style={{}}
          onStyleChange={vi.fn()}
        />
      );
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhanceMagicCutPrompt).toHaveBeenCalledWith('Opening title');
    expect(mocks.legacyEnhancePrompt).not.toHaveBeenCalled();
  });

  it('routes voice script enhancement through enhanceMagicCutPrompt instead of genAIService', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VoiceSettingsPanel
          clip={{
            id: 'clip-1',
            uuid: 'clip-1',
            content: 'Voice over script',
            duration: 3,
            start: 0,
            speed: 1,
            track: { id: 'track-1', uuid: 'track-1' },
          } as never}
          resource={{
            id: 'resource-1',
            uuid: 'resource-1',
            metadata: {},
            name: 'voice.wav',
          } as never}
          onUpdate={vi.fn()}
          onUpdateResource={vi.fn()}
        />
      );
      await Promise.resolve();
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhanceMagicCutPrompt).toHaveBeenCalledWith('Voice over script');
    expect(mocks.legacyEnhancePrompt).not.toHaveBeenCalled();
  });

  it('uses speakerLabel only for summary display while keeping speakerId in resource updates', async () => {
    const onUpdate = vi.fn();
    const onUpdateResource = vi.fn();

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VoiceSettingsPanel
          clip={{
            id: 'clip-1',
            uuid: 'clip-1',
            content: 'Voice over script',
            duration: 3,
            start: 0,
            speed: 1,
            track: { id: 'track-1', uuid: 'track-1' },
          } as never}
          resource={{
            id: 'resource-1',
            uuid: 'resource-1',
            metadata: {},
            name: 'voice.wav',
          } as never}
          onUpdate={onUpdate}
          onUpdateResource={onUpdateResource}
        />
      );
      await Promise.resolve();
    });

    const generateButton = Array.from(container?.querySelectorAll('button') || []).find((button) =>
      button.textContent?.includes('voiceSettings.actions.generateAudio')
    ) as HTMLButtonElement | undefined;

    expect(generateButton).toBeTruthy();

    await act(async () => {
      generateButton?.click();
      await Promise.resolve();
    });

    expect(mocks.magicCutT).toHaveBeenCalledWith(
      'voiceSettings.summary',
      expect.objectContaining({
        speakerLabel: 'Kore',
        duration: '2.5',
      })
    );
    expect(mocks.magicCutT).not.toHaveBeenCalledWith(
      'voiceSettings.summary',
      expect.objectContaining({
        speakerName: 'Kore',
      })
    );
    expect(onUpdate).toHaveBeenCalledWith({ duration: 2.5 });
    expect(onUpdateResource).toHaveBeenCalledWith({
      metadata: {
        speakerId: 'speaker-kore',
      },
    });
  });
});
