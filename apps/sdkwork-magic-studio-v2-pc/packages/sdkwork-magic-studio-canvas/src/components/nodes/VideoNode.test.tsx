/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolvedSrc: 'https://example.com/video-a.mp4',
  loading: false,
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  useAssetUrl: () => ({
    url: mocks.resolvedSrc,
    loading: mocks.loading,
  }),
}));

import { VideoNode } from './VideoNode';

const setVideoTiming = (video: HTMLVideoElement, duration: number, initialTime: number) => {
  let currentTime = initialTime;

  Object.defineProperty(video, 'duration', {
    configurable: true,
    get: () => duration,
  });

  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value;
    },
  });
};

describe('VideoNode', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    mocks.resolvedSrc = 'https://example.com/video-a.mp4';
    mocks.loading = false;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
  });

  it('rebinds media events when the resolved source changes and resets playback time for the new video element', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <VideoNode
          src="assets://video-a"
          isSelected={false}
          isGenerating={false}
          onUpload={() => undefined}
        />
      );
    });

    const initialVideo = container.querySelector('video') as HTMLVideoElement | null;
    expect(initialVideo).toBeTruthy();

    setVideoTiming(initialVideo!, 10, 5);

    await act(async () => {
      initialVideo?.dispatchEvent(new Event('loadedmetadata'));
      initialVideo?.dispatchEvent(new Event('timeupdate'));
    });

    expect(container.textContent).toContain('0:05 / 0:10');

    mocks.resolvedSrc = 'https://example.com/video-b.mp4';

    await act(async () => {
      root?.render(
        <VideoNode
          src="assets://video-b"
          isSelected={false}
          isGenerating={false}
          onUpload={() => undefined}
        />
      );
    });

    const nextVideo = container.querySelector('video') as HTMLVideoElement | null;
    expect(nextVideo).toBeTruthy();
    expect(nextVideo).not.toBe(initialVideo);

    setVideoTiming(nextVideo!, 12, 0);

    await act(async () => {
      nextVideo?.dispatchEvent(new Event('loadedmetadata'));
      nextVideo?.dispatchEvent(new Event('loadeddata'));
    });

    expect(container.textContent).toContain('0:00 / 0:12');
  });
});
