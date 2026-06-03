import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sessionState: { current: any | null } = {
  current: null,
};

vi.mock('../src/services/creationServerClient', () => ({
  getCreationServerClient: () => ({
    createCreationSession: async (payload: any) => {
      sessionState.current = {
        sessionId: 'portal-session-1',
        source: 'portal-video',
        target: payload.target,
        prompt: payload.prompt || '',
        genMode: payload.genMode,
        model: payload.model,
        styleId: payload.styleId,
        aspectRatio: payload.aspectRatio,
        resolution: payload.resolution,
        duration: payload.duration,
        attachments: payload.attachments || [],
        workspaceId: payload.workspaceId,
        projectId: payload.projectId,
        createdAt: 1713744000000,
        expiresAt: 1713745800000,
      };
      return {
        data: sessionState.current,
      };
    },
    readCurrentCreationSession: async () => ({
      data: {
        session: sessionState.current,
      },
    }),
    consumeCurrentCreationSession: async () => {
      const session = sessionState.current;
      sessionState.current = null;
      return {
        data: {
          session,
        },
      };
    },
    clearCurrentCreationSession: async () => {
      sessionState.current = null;
      return {
        data: { ok: true },
      };
    },
  }),
}));

import {
  consumePortalLaunchSession,
  savePortalLaunchSession,
} from '../src/asset-center/application/portalLaunchSession';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('portalLaunchSession', () => {
  beforeEach(() => {
    sessionState.current = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves attachment uuid across portal handoff while keeping asset linkage separate', async () => {
    const storage = new MemoryStorage();
    storage.setItem('sdkwork_workspace_id', 'workspace-1');
    storage.setItem('sdkwork_project_id', 'project-1');
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage } as any);

    const session = await savePortalLaunchSession({
      target: 'video',
      prompt: 'A neon city at night',
      attachments: [
        {
          id: null,
          uuid: 'attachment-local-uuid-1',
          assetId: 'asset-db-1',
          assetUuid: 'asset-uuid-1',
          name: 'Start Frame',
          type: 'image',
          locator: 'https://cdn.example.com/start-frame.png',
        } as any,
      ],
    });

    expect(session.attachments).toEqual([
      {
        id: null,
        uuid: 'attachment-local-uuid-1',
        assetId: 'asset-db-1',
        assetUuid: 'asset-uuid-1',
        name: 'Start Frame',
        type: 'image',
        locator: 'https://cdn.example.com/start-frame.png',
        content: undefined,
      },
    ]);

    await expect(consumePortalLaunchSession('video')).resolves.toMatchObject({
      attachments: [
        {
          id: null,
          uuid: 'attachment-local-uuid-1',
          assetId: 'asset-db-1',
          assetUuid: 'asset-uuid-1',
          name: 'Start Frame',
          type: 'image',
          locator: 'https://cdn.example.com/start-frame.png',
          content: undefined,
        },
      ],
    });
  });
});
