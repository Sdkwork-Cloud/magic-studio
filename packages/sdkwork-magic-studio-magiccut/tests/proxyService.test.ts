import { describe, expect, it } from 'vitest';

import { ProxyService } from '../src/services/proxy/ProxyService';

describe('ProxyService', () => {
  it('reports proxy generation as unsupported when no real transcoder is configured', async () => {
    const service = new ProxyService();
    const progressEvents: number[] = [];

    const result = await service.generateProxy(
      'video-1',
      'https://example.com/video.mp4',
      (progress) => progressEvents.push(progress),
    );

    expect(result).toBeNull();
    expect(progressEvents).toEqual([]);
    expect(service.getProxyStatus('video-1')).toMatchObject({
      resourceId: 'video-1',
      proxyUrl: null,
      progress: 0,
      status: 'unsupported',
    });
  });

  it('uses an injected transcoder to produce real proxy status updates', async () => {
    const service = new ProxyService();
    const setTranscoder = (service as any).setTranscoder;

    expect(typeof setTranscoder).toBe('function');
    if (typeof setTranscoder !== 'function') return;

    const progressEvents: number[] = [];
    setTranscoder.call(service, {
      async transcodeToProxy({ onProgress }: { onProgress?: (progress: number) => void }) {
        onProgress?.(25);
        onProgress?.(75);
        return {
          proxyUrl: 'assets://proxy/video-1-720p.mp4',
          proxySize: 512000,
          originalSize: 2048000,
        };
      },
    });

    const result = await service.generateProxy(
      'video-1',
      'https://example.com/video.mp4',
      (progress) => progressEvents.push(progress),
    );

    expect(result).toBe('assets://proxy/video-1-720p.mp4');
    expect(progressEvents).toEqual([25, 75]);
    expect(service.getProxyStatus('video-1')).toMatchObject({
      resourceId: 'video-1',
      proxyUrl: 'assets://proxy/video-1-720p.mp4',
      progress: 100,
      status: 'ready',
      proxySize: 512000,
      originalSize: 2048000,
    });
  });
});
