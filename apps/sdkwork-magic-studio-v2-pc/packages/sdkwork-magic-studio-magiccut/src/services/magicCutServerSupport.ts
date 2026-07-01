import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import { isMagicStudioServerResourceNotFoundError } from '@sdkwork/magic-studio-server';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { CutProject, CutTemplate } from '@sdkwork/magic-studio-types/magiccut';

export type MagicCutServerClient = ReturnType<typeof createRuntimeMagicStudioServerClient>;
const MAGICCUT_NOT_FOUND_CODES = ['MAGICCUT_ENTITY_NOT_FOUND'] as const;

export function getMagicCutServerClient(): MagicCutServerClient {
  const runtime = readDefaultPlatformRuntime('MagicCutServerSupport');
  return createRuntimeMagicStudioServerClient(runtime);
}

export function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveMagicCutEntityKey(value: Record<string, unknown>): string | undefined {
  try {
    return resolveEntityKey(value as { id?: string | null; uuid?: string | null });
  } catch {
    return normalizeText(value.uuid) || normalizeText(value.id);
  }
}

export function normalizeMagicCutProject(value: unknown): CutProject | null {
  if (!isRecord(value)) {
    return null;
  }

  const projectKey = resolveMagicCutEntityKey(value);
  if (!projectKey) {
    return null;
  }

  const project = value as unknown as CutProject;

  return {
    ...project,
    type: 'CUT_PROJECT',
    id: project.id ?? null,
    uuid: normalizeText(project.uuid) || projectKey,
    name: normalizeText(project.name) || 'Untitled MagicCut Project',
    description: typeof project.description === 'string' ? project.description : '',
    version:
      typeof project.version === 'number' && Number.isFinite(project.version)
        ? project.version
        : 1,
  } as CutProject;
}

export function normalizeMagicCutTemplate(value: unknown): CutTemplate | null {
  if (!isRecord(value)) {
    return null;
  }

  const templateKey = resolveMagicCutEntityKey(value);
  if (!templateKey) {
    return null;
  }

  const template = value as unknown as CutTemplate;
  const projectData = normalizeMagicCutProject(template.projectData);
  if (!projectData) {
    return null;
  }

  return {
    ...template,
    type: 'CUT_TEMPLATE',
    id: template.id ?? null,
    uuid: normalizeText(template.uuid) || templateKey,
    name: normalizeText(template.name) || 'Untitled MagicCut Template',
    description: typeof template.description === 'string' ? template.description : '',
    projectData,
  } as CutTemplate;
}

export function isNotFoundError(error: unknown): boolean {
  return isMagicStudioServerResourceNotFoundError(error, MAGICCUT_NOT_FOUND_CODES);
}

export function readTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }

    const asDate = Date.parse(trimmed);
    if (Number.isFinite(asDate)) {
      return asDate;
    }
  }

  return 0;
}
