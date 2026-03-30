import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerControls } from '../src/components/Player/PlayerControls';
import { MagicCutTimelineToolbar } from '../src/components/Timeline/MagicCutTimelineToolbar';

const mockUseMagicCutStore = vi.fn();
const mockUseMagicCutBus = vi.fn();
const mockUseMagicCutTranslation = vi.fn();

vi.mock('../src/store/magicCutStore', () => ({
  useMagicCutStore: () => mockUseMagicCutStore(),
}));

vi.mock('../src/providers/MagicCutEventProvider', () => ({
  useMagicCutBus: () => mockUseMagicCutBus(),
}));

vi.mock('../src/hooks/useMagicCutTranslation', () => ({
  useMagicCutTranslation: () => mockUseMagicCutTranslation(),
}));

vi.mock('../src/engine/AudioEngine', () => ({
  audioEngine: {
    getAudioLevels: () => 0.4,
  },
}));

vi.mock('@sdkwork/react-assets', () => ({
  importAssetBySdk: vi.fn(),
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

vi.mock('@sdkwork/react-core', () => ({
  inlineDataService: {
    tryExtractInlineData: vi.fn(),
  },
}));

vi.mock('@sdkwork/react-commons', () => ({
  MediaResourceType: {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    MUSIC: 'music',
    VOICE: 'voice',
    TEXT: 'text',
    SUBTITLE: 'subtitle',
    CHARACTER: 'character',
    EFFECT: 'effect',
    TRANSITION: 'transition',
    LOTTIE: 'lottie',
    MODEL_3D: 'model3d',
    FILE: 'file',
  },
}));

vi.mock('@sdkwork/react-image', () => ({
  ImageGeneratorModal: () => null,
}));

vi.mock('@sdkwork/react-video', () => ({
  VideoGeneratorModal: () => null,
}));

vi.mock('@sdkwork/react-audio', () => ({
  AudioGeneratorModal: () => null,
}));

vi.mock('@sdkwork/react-sfx', () => ({
  SfxGeneratorModal: () => null,
}));

vi.mock('@sdkwork/react-music', () => ({
  MusicGeneratorModal: () => null,
}));

describe('magiccut theme chrome alignment', () => {
  beforeEach(() => {
    mockUseMagicCutBus.mockReturnValue({
      emit: vi.fn(),
    });

    mockUseMagicCutTranslation.mockReturnValue({
      t: (key: string) => key,
      tc: (key: string) => key,
      tp: (key: string) => key,
      tl: (key: string) => key,
    });
  });

  it('renders player controls with shared toolbar shell primitives', () => {
    mockUseMagicCutStore.mockReturnValue({
      isLooping: false,
      toggleLoop: vi.fn(),
      useTransientState: (selector: (state: { isPlaying: boolean }) => unknown) =>
        selector({ isPlaying: false }),
    });

    const html = renderToStaticMarkup(
      <PlayerControls
        aspectRatio="16:9"
        viewScale={1}
        onSeek={vi.fn()}
        onTogglePlay={vi.fn()}
        onRatioChange={vi.fn()}
        onViewScaleChange={vi.fn()}
        onFullscreen={vi.fn()}
        duration={120}
        onTimecodeRef={vi.fn()}
        inPoint={null}
        outPoint={null}
        onStepBackward={vi.fn()}
        onStepForward={vi.fn()}
        onSetInPoint={vi.fn()}
        onSetOutPoint={vi.fn()}
        onJumpToInPoint={vi.fn()}
        onJumpToOutPoint={vi.fn()}
        onClearRange={vi.fn()}
      />
    );

    expect(html).toContain('app-toolbar-strip');
    expect(html).toContain('app-toolbar-group');
    expect(html).toContain('app-toolbar-button');
  });

  it('renders the timeline toolbar with aligned toolbar and status primitives', () => {
    const storeState = {
      setEditTool: vi.fn(),
      toggleLinkedSelection: vi.fn(),
      currentTime: 12,
    };

    mockUseMagicCutStore.mockReturnValue({
      isSnappingEnabled: true,
      isSkimmingEnabled: false,
      canUndo: true,
      canRedo: true,
      selectedClipId: 'clip-1',
      selectedTrackId: 'track-1',
      state: {
        tracks: {
          'track-1': {
            trackType: 'video',
          },
        },
      },
      store: {
        getState: () => storeState,
      },
      useTransientState: (
        selector: (state: {
          zoomLevel: number;
          editMode: { currentTool: string; linkedSelection: boolean };
        }) => unknown
      ) =>
        selector({
          zoomLevel: 1,
          editMode: {
            currentTool: 'select',
            linkedSelection: true,
          },
        }),
    });

    const html = renderToStaticMarkup(<MagicCutTimelineToolbar />);

    expect(html).toContain('app-toolbar-strip');
    expect(html).toContain('app-toolbar-group');
    expect(html).toContain('app-status-pill');
  });
});
