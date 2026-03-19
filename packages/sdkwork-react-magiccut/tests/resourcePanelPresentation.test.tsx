import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';

vi.mock('@sdkwork/react-assets', () => ({
  useAssetUrl: () => ({ url: null, loading: false, error: null }),
}));

import { getResourcePanelLayoutClass } from '../src/domain/assets/resourcePanelPresentation';
import { AudioResourcePanel } from '../src/components/Resources/panels/AudioResourcePanel';
import { EffectResourcePanel } from '../src/components/Resources/panels/EffectResourcePanel';
import { MusicResourcePanel } from '../src/components/Resources/panels/MusicResourcePanel';
import { TextResourcePanel } from '../src/components/Resources/panels/TextResourcePanel';
import { TransitionResourcePanel } from '../src/components/Resources/panels/TransitionResourcePanel';

const createAsset = (id: string, type: MediaResourceType, extra: Record<string, unknown> = {}) => ({
  id,
  uuid: `${id}-uuid`,
  name: `${id}-name`,
  type,
  origin: 'upload',
  metadata: {},
  createdAt: 0,
  updatedAt: 0,
  ...extra,
});

describe('getResourcePanelLayoutClass', () => {
  it('switches to a single-column browser layout in list mode', () => {
    expect(getResourcePanelLayoutClass('grid')).toContain('grid-cols-4');
    expect(getResourcePanelLayoutClass('list')).toContain('grid-cols-1');
  });
});

describe('resource panel presentation', () => {
  it('renders a favorite action for text assets and honors list mode layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextResourcePanel as any, {
        assets: [
          createAsset('text-1', MediaResourceType.TEXT, {
            name: 'Headline',
            metadata: { text: 'Lead title' },
          }),
        ],
        onDragStart: vi.fn(),
        onToggleFavorite: vi.fn(),
        viewMode: 'list',
      })
    );

    expect(html).toContain('grid-cols-1');
    expect(html).toContain('Add to favorites');
  });

  it('renders favorite controls for effect and transition resources', () => {
    const effectHtml = renderToStaticMarkup(
      React.createElement(EffectResourcePanel as any, {
        assets: [createAsset('effect-1', MediaResourceType.EFFECT)],
        onDragStart: vi.fn(),
        onToggleFavorite: vi.fn(),
        previewEffect: null,
        setPreviewEffect: vi.fn(),
        viewMode: 'grid',
      })
    );

    const transitionHtml = renderToStaticMarkup(
      React.createElement(TransitionResourcePanel as any, {
        assets: [createAsset('transition-1', MediaResourceType.TRANSITION)],
        onDragStart: vi.fn(),
        onToggleFavorite: vi.fn(),
        viewMode: 'grid',
      })
    );

    expect(effectHtml).toContain('Add to favorites');
    expect(transitionHtml).toContain('Add to favorites');
  });

  it('switches music and audio panels to dedicated list layouts in list mode', () => {
    const audioHtml = renderToStaticMarkup(
      React.createElement(AudioResourcePanel as any, {
        assets: [createAsset('audio-1', MediaResourceType.AUDIO, { duration: 12 })],
        onDragStart: vi.fn(),
        onToggleFavorite: vi.fn(),
        onPreview: vi.fn(),
        viewMode: 'list',
      })
    );

    const musicHtml = renderToStaticMarkup(
      React.createElement(MusicResourcePanel as any, {
        assets: [createAsset('music-1', MediaResourceType.MUSIC, { duration: 95 })],
        onDragStart: vi.fn(),
        onToggleFavorite: vi.fn(),
        onPreview: vi.fn(),
        viewMode: 'list',
      })
    );

    expect(audioHtml).toContain('flex flex-col');
    expect(audioHtml).not.toContain('grid-cols-1');
    expect(musicHtml).toContain('flex flex-col');
    expect(musicHtml).toContain('Unknown');
  });
});
