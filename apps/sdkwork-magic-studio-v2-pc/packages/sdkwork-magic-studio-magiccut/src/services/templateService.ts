import type {
  CutProject,
  CutTemplate,
  TemplateMetadata,
} from '@sdkwork/magic-studio-types/magiccut';
import type { MagicStudioMagicCutTemplateListQuery } from '@sdkwork/magic-studio-host-types';
import type { NormalizedState } from '../store/types';
import { buildMagicCutPersistedProject } from '../store/projectGraph';
import {
  getMagicCutServerClient,
  isNotFoundError,
  normalizeMagicCutProject,
  normalizeMagicCutTemplate,
  readTimestamp,
} from './magicCutServerSupport';
import {
  normalizeStateAssetReferences,
} from '../utils/assetReferenceNormalization';

class TemplateService {
  async saveTemplate(
    metadata: TemplateMetadata,
    project: CutProject,
    state: NormalizedState,
  ): Promise<CutTemplate> {
    const client = getMagicCutServerClient();
    const normalizedState = normalizeStateAssetReferences(state);
    const persistedProject = buildMagicCutPersistedProject(project, normalizedState);
    const response = await client.createMagicCutTemplate({
      metadata,
      project: persistedProject,
    });
    const template = normalizeMagicCutTemplate(response.data);

    if (!template) {
      throw new Error('MagicCut template save returned an invalid template payload');
    }

    return template;
  }

  async listTemplates(
    query?: MagicStudioMagicCutTemplateListQuery,
  ): Promise<CutTemplate[]> {
    const client = getMagicCutServerClient();
    const response = await client.listMagicCutTemplates(query);

    return response.items
      .map((item) => normalizeMagicCutTemplate(item))
      .filter((item): item is CutTemplate => item !== null)
      .sort((left, right) => readTimestamp(right.updatedAt) - readTimestamp(left.updatedAt));
  }

  async findById(templateId: string): Promise<CutTemplate | null> {
    try {
      const client = getMagicCutServerClient();
      const response = await client.readMagicCutTemplate(templateId);
      return normalizeMagicCutTemplate(response.data);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async updateTemplate(
    templateId: string,
    metadata: TemplateMetadata,
    project: CutProject,
    state: NormalizedState,
  ): Promise<CutTemplate> {
    const client = getMagicCutServerClient();
    const normalizedState = normalizeStateAssetReferences(state);
    const persistedProject = buildMagicCutPersistedProject(project, normalizedState);
    const response = await client.updateMagicCutTemplate(templateId, {
      metadata,
      project: persistedProject,
    });
    const template = normalizeMagicCutTemplate(response.data);

    if (!template) {
      throw new Error('MagicCut template update returned an invalid template payload');
    }

    return template;
  }

  async deleteById(templateId: string): Promise<boolean> {
    const client = getMagicCutServerClient();
    await client.deleteMagicCutTemplate(templateId);
    return true;
  }

  async instantiateById(templateId: string, name?: string): Promise<CutProject> {
    const client = getMagicCutServerClient();
    const response = await client.instantiateMagicCutTemplate(templateId, { name });
    const project = normalizeMagicCutProject(response.data);

    if (!project) {
      throw new Error('MagicCut template instantiation returned an invalid project payload');
    }

    return project;
  }
}

export const templateService = new TemplateService();

