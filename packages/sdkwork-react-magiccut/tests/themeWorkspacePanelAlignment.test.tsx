import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MagicCutTrackHeader } from '../src/components/Timeline/MagicCutTrackHeader';
import { MagicCutResourcePanel } from '../src/components/Resources/MagicCutResourcePanel';

const mockUseMagicCutStore = vi.fn();
const mockUseMagicCutTranslation = vi.fn();
const mockUseMagicCutBus = vi.fn();

vi.mock('../src/store/magicCutStore', () => ({
  useMagicCutStore: () => mockUseMagicCutStore(),
}));

vi.mock('../src/hooks/useMagicCutTranslation', () => ({
  useMagicCutTranslation: () => mockUseMagicCutTranslation(),
}));

vi.mock('../src/providers/MagicCutEventProvider', () => ({
  useMagicCutBus: () => mockUseMagicCutBus(),
  useMagicCutEvent: vi.fn(),
}));

vi.mock('@sdkwork/react-core', () => ({
  uploadHelper: {
    pickFiles: vi.fn(),
  },
  thumbnailGenerator: {
    extractVideoFrame: vi.fn(),
  },
  downloadService: {
    hydrateState: vi.fn(),
  },
  platform: {
    notify: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock('@sdkwork/react-commons', () => ({
  Confirm: () => null,
  useConfirm: () => ({
    isOpen: false,
    options: null,
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
    confirm: vi.fn(),
  }),
  DEFAULT_PAGE_SIZE: 20,
  AssetType: {
    VIDEO: 'video',
  },
  MediaResourceType: {
    VIDEO: 'video',
    AUDIO: 'audio',
    IMAGE: 'image',
    TEXT: 'text',
    SUBTITLE: 'subtitle',
    EFFECT: 'effect',
    TRANSITION: 'transition',
    MUSIC: 'music',
    VOICE: 'voice',
    SPEECH: 'speech',
  },
}));

vi.mock('@sdkwork/react-assets', () => ({
  assetCenterService: {
    query: vi.fn(),
    findById: vi.fn(),
    setFavorite: vi.fn(),
    registerExistingAsset: vi.fn(),
  },
  AnyAsset: {},
  mapUnifiedAssetToAnyAsset: vi.fn(),
  mapUnifiedPageToAnyAssetPage: vi.fn(),
  mapContentKeyToMediaType: vi.fn((value: string) => value),
  queryAssetsBySdk: vi.fn(),
  readWorkspaceScope: vi.fn(() => ({})),
  assetService: {
    deleteById: vi.fn(),
  },
}));

vi.mock('@sdkwork/react-settings', () => ({
  settingsBusinessService: {
    getSettings: vi.fn(),
  },
}));

vi.mock('../src/services', () => ({
  magicCutBusinessService: {
    templateService: {
      listTemplates: vi.fn(),
    },
  },
  playerPreviewService: {
    clearPreview: vi.fn(),
    clearPreviewForResource: vi.fn(),
    isPreviewingResource: vi.fn(),
    previewResource: vi.fn(),
  },
}));

vi.mock('../src/utils/assetUrlResolver', () => ({
  resolveAssetUrlByAssetIdFirst: vi.fn(),
}));

vi.mock('../src/utils/magicCutTrackCoverImport', () => ({
  importMagicCutTrackCoverFile: vi.fn(),
  importMagicCutTrackCoverFromUrl: vi.fn(),
}));

vi.mock('../src/components/LoadTemplateConfirmModal', () => ({
  LoadTemplateConfirmModal: () => null,
}));

vi.mock('../src/components/SaveTemplateModal', () => ({
  SaveTemplateModal: () => null,
}));

vi.mock('../src/components/Resources/grid/TemplateResourceGrid', () => ({
  TemplateResourceGrid: () => React.createElement('div', null, 'TemplateResourceGrid'),
}));

vi.mock('../src/components/Resources/panels/TextResourcePanel', () => ({
  TextResourcePanel: () => React.createElement('div', null, 'TextResourcePanel'),
}));

vi.mock('../src/components/Resources/panels/TransitionResourcePanel', () => ({
  TransitionResourcePanel: () => React.createElement('div', null, 'TransitionResourcePanel'),
}));

vi.mock('../src/components/Resources/panels/EffectResourcePanel', () => ({
  EffectResourcePanel: () => React.createElement('div', null, 'EffectResourcePanel'),
}));

vi.mock('../src/components/Resources/panels/MusicResourcePanel', () => ({
  MusicResourcePanel: () => React.createElement('div', null, 'MusicResourcePanel'),
}));

vi.mock('../src/components/Resources/panels/AudioResourcePanel', () => ({
  AudioResourcePanel: () => React.createElement('div', null, 'AudioResourcePanel'),
}));

vi.mock('../src/components/Resources/panels/VideoResourcePanel', () => ({
  VideoResourcePanel: () => React.createElement('div', null, 'VideoResourcePanel'),
}));

vi.mock('../src/components/Resources/panels/ImageResourcePanel', () => ({
  ImageResourcePanel: () => React.createElement('div', null, 'ImageResourcePanel'),
}));

describe('magiccut workspace panel theme alignment', () => {
  beforeEach(() => {
    mockUseMagicCutTranslation.mockReturnValue({
      t: (key: string) => key,
      tr: (key: string) => key,
      tl: (key: string) => key,
    });

    mockUseMagicCutBus.mockReturnValue({
      emit: vi.fn(),
    });
  });

  it('renders track headers with shared surface and control primitives', () => {
    mockUseMagicCutStore.mockReturnValue({
      resizeTrack: vi.fn(),
      updateTrack: vi.fn(),
      removeTrack: vi.fn(),
      selectedTrackId: 'track-1',
      selectTrack: vi.fn(),
      state: {
        clips: {},
      },
      getResource: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MagicCutTrackHeader
        track={{
          id: 'track-1',
          uuid: 'track-1',
          type: 'CutTrack',
          trackType: 'video',
          name: 'Visual Track',
          order: 0,
          isMain: false,
          clips: [],
          height: 72,
          visible: true,
          locked: false,
          muted: false,
          createdAt: 0,
          updatedAt: 0,
        }}
        height={72}
      />
    );

    expect(html).toContain('app-surface-subtle');
    expect(html).toContain('app-toolbar-button');
    expect(html).toContain('app-button-danger');
  });

  it('renders the resource panel with aligned shell and segmented controls', () => {
    mockUseMagicCutStore.mockReturnValue({
      project: {
        id: 'project-1',
        name: 'Project 1',
      },
      setDragOperation: vi.fn(),
      importAssets: vi.fn(),
      setPreviewSource: vi.fn(),
      removeAssetFromProjectState: vi.fn(),
      updateResource: vi.fn(),
      isAssetInUse: vi.fn(() => false),
      state: {
        resources: {},
      },
      skimmingResource: null,
      setSkimmingResource: vi.fn(),
      previewEffect: null,
      setPreviewEffect: vi.fn(),
      setInteraction: vi.fn(),
      useTransientState: (selector: (state: { zoomLevel: number }) => unknown) =>
        selector({ zoomLevel: 1 }),
      playerController: {
        pause: vi.fn(),
      },
      saveAsTemplate: vi.fn(),
      loadTemplate: vi.fn(),
    });

    const html = renderToStaticMarkup(<MagicCutResourcePanel activeTab="video" />);

    expect(html).toContain('app-surface-subtle');
    expect(html).toContain('app-header-glass');
    expect(html).toContain('app-segmented-control');
  });
});
