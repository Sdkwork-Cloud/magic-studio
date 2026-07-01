import type {
  MagicStudioMagicCutRenderCapabilities,
  MagicStudioMagicCutRenderJob,
} from '@sdkwork/magic-studio-host-types';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { CutProject } from '@sdkwork/magic-studio-types/magiccut';

import type { NormalizedState } from '../store/types';
import { buildMagicCutPersistedProject } from '../store/projectGraph';
import { normalizeStateAssetReferences } from '../utils/assetReferenceNormalization';
import { exportRegistry } from './export/ExportRegistry';
import { getMagicCutServerClient } from './magicCutServerSupport';
import { magicCutProjectService } from './magicCutProjectService';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function decodeBase64Bytes(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function isTerminalRenderStatus(status: MagicStudioMagicCutRenderJob['status']): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled';
}

export interface MagicCutAudioMixdownRequest {
  project: CutProject;
  state: NormalizedState;
  timelineId: string;
  fileName: string;
  destinationPath?: string;
  startTimeSeconds?: number | null;
  endTimeSeconds?: number | null;
  signal?: AbortSignal;
}

class MagicCutRenderService {
  async readCapabilities(): Promise<MagicStudioMagicCutRenderCapabilities> {
    const client = getMagicCutServerClient();
    return (await client.readMagicCutRenderCapabilities()).data;
  }

  private async persistProjectSnapshot(
    project: CutProject,
    state: NormalizedState,
  ): Promise<CutProject> {
    const persistedProject = buildMagicCutPersistedProject(
      project,
      normalizeStateAssetReferences(state),
    );
    const result = await magicCutProjectService.save(persistedProject);

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to persist MagicCut project snapshot');
    }

    return result.data;
  }

  async exportAudioMixdown(
    input: MagicCutAudioMixdownRequest,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    if (input.signal?.aborted) {
      throw new Error('Export cancelled');
    }

    const persistedProject = await this.persistProjectSnapshot(input.project, input.state);
    const projectId = resolveEntityKey(persistedProject);
    const client = getMagicCutServerClient();
    const createResponse = await client.createMagicCutRender(projectId, {
      timelineId: input.timelineId,
      target: 'audio',
      format: 'wav',
      fileName: input.fileName,
      startTimeSeconds: input.startTimeSeconds ?? undefined,
      endTimeSeconds: input.endTimeSeconds ?? undefined,
    });

    let render = createResponse.data;
    let aborted = false;
    onProgress?.(Math.max(1, render.progress || 0));

    const abortHandler = () => {
      aborted = true;
      void client.cancelMagicCutRender(render.id).catch(() => undefined);
    };

    input.signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      while (!isTerminalRenderStatus(render.status)) {
        if (aborted || input.signal?.aborted) {
          throw new Error('Export cancelled');
        }

        await delay(500);
        render = (await client.readMagicCutRender(render.id)).data;
        onProgress?.(render.progress);
      }

      if (render.status === 'failed') {
        throw new Error(render.error?.message || 'MagicCut server render failed');
      }

      if (render.status === 'cancelled') {
        throw new Error('Export cancelled');
      }

      const artifact =
        render.artifacts[0] ??
        (await client.listMagicCutRenderArtifacts(render.id)).items[0];

      if (!artifact) {
        throw new Error('MagicCut render completed without an export artifact');
      }

      const content = (
        await client.readMagicCutRenderArtifactContent(render.id, artifact.id)
      ).data;
      const bytes = decodeBase64Bytes(content.bytesBase64);
      const blobBytes = Uint8Array.from(bytes);
      const blob = new Blob([blobBytes], {
        type: content.mimeType || artifact.mimeType || 'audio/wav',
      });
      const saver = exportRegistry.getSaver(exportRegistry.getDefaultSaverId());

      onProgress?.(99);
      await saver.save(blob, content.fileName || artifact.fileName, input.destinationPath);
      onProgress?.(100);
    } finally {
      input.signal?.removeEventListener('abort', abortHandler);
    }
  }
}

export const magicCutRenderService = new MagicCutRenderService();
