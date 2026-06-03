import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MediaResourceType } from '@sdkwork/magic-studio-types';

import { GenerationChatWindow } from '../src/components/generate/GenerationChatWindow';

describe('GenerationChatWindow', () => {
  it('renders canonical video results as video instead of an image preview for suffixless urls', () => {
    const html = renderToStaticMarkup(
      <GenerationChatWindow
        mode="video"
        title="Video Studio Chat"
        onNavigateBack={() => {}}
        history={[
          {
            id: 'task-db-id-1',
            uuid: 'task-uuid-1',
            status: 'completed',
            config: {
              prompt: 'Ocean waves at sunset',
              mediaType: 'video',
            },
            results: [
              {
                id: 'result-db-id-1',
                uuid: 'result-uuid-1',
                url: 'https://example.com/generated/video-delivery',
                resource: {
                  uuid: 'resource-uuid-1',
                  type: MediaResourceType.VIDEO,
                  url: 'https://example.com/generated/video-delivery',
                },
                coverResource: {
                  uuid: 'cover-uuid-1',
                  type: MediaResourceType.IMAGE,
                  url: 'https://example.com/generated/video-poster',
                },
              },
            ],
          },
        ]}
        isGenerating={false}
        onDelete={() => {}}
        onReuse={() => {}}
        config={{}}
        setConfig={() => {}}
        onGenerate={() => {}}
      />
    );

    expect(html).toContain('<video');
    expect(html).toContain('src="https://example.com/generated/video-delivery"');
  });

  it('renders canonical audio-family results as audio players', () => {
    const html = renderToStaticMarkup(
      <GenerationChatWindow
        mode="music"
        title="Music Studio Chat"
        onNavigateBack={() => {}}
        history={[
          {
            id: 'task-db-id-2',
            uuid: 'task-uuid-2',
            status: 'completed',
            config: {
              prompt: 'Lo-fi beat',
              mediaType: 'music',
            },
            results: [
              {
                id: 'result-db-id-2',
                uuid: 'result-uuid-2',
                url: 'https://example.com/generated/music-delivery',
                resource: {
                  uuid: 'resource-uuid-2',
                  type: MediaResourceType.MUSIC,
                  url: 'https://example.com/generated/music-delivery',
                },
              },
            ],
          },
        ]}
        isGenerating={false}
        onDelete={() => {}}
        onReuse={() => {}}
        config={{}}
        setConfig={() => {}}
        onGenerate={() => {}}
      />
    );

    expect(html).toContain('<audio');
    expect(html).toContain('src="https://example.com/generated/music-delivery"');
  });
});
