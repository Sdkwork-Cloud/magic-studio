import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import { isMagicStudioServerResourceNotFoundError } from '@sdkwork/magic-studio-server';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type {
  FilmCharacter,
  FilmLocation,
  FilmPreProduction,
  FilmProject,
  FilmShootingPlanDay,
  FilmShootingPlanScene,
  FilmShotVariantPlan,
  FilmShotVariantShot,
  FilmShotVariantStrategy,
  FilmProp,
  FilmScene,
  FilmSceneBreakdownEntityRef,
  FilmSceneBreakdownFlag,
  FilmSceneBreakdownItem,
  FilmScriptAnalysisResult,
  FilmShot,
} from '@sdkwork/magic-studio-types/film';

export type FilmServerClient = ReturnType<typeof createRuntimeMagicStudioServerClient>;
const FILM_NOT_FOUND_CODES = ['FILM_ENTITY_NOT_FOUND'] as const;

export function getFilmServerClient(): FilmServerClient {
  const runtime = readDefaultPlatformRuntime('FilmServerSupport');
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

export function readTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const asNumber = Number.parseInt(value, 10);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }

    const asDate = Date.parse(value);
    if (Number.isFinite(asDate)) {
      return asDate;
    }
  }

  return 0;
}

export function isNotFoundError(error: unknown): boolean {
  return isMagicStudioServerResourceNotFoundError(error, FILM_NOT_FOUND_CODES);
}

function resolveFilmEntityKey(value: Record<string, unknown>): string | undefined {
  try {
    return resolveEntityKey(value as { id?: string | null; uuid?: string | null });
  } catch {
    return normalizeText(value.uuid) || normalizeText(value.id);
  }
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeFilmSceneBreakdownEntityRef(
  value: unknown,
): FilmSceneBreakdownEntityRef | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = normalizeText(value.name);
  const uuid = normalizeText(value.uuid) || normalizeText(value.id);
  if (!name || !uuid) {
    return null;
  }

  return {
    id: normalizeText(value.id),
    uuid,
    name,
  };
}

function normalizeFilmSceneBreakdownFlags(value: unknown): FilmSceneBreakdownFlag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is FilmSceneBreakdownFlag =>
      item === 'missing-location' ||
      item === 'missing-characters' ||
      item === 'missing-props' ||
      item === 'missing-storyboard',
  );
}

function normalizeFilmShotVariantStrategy(value: unknown): FilmShotVariantStrategy | null {
  switch (value) {
    case 'cinematic':
    case 'coverage':
    case 'performance':
      return value;
    default:
      return null;
  }
}

function normalizeFilmShotVariantShotRecord(
  value: unknown,
): FilmShotVariantShot | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeText(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    order:
      typeof value.order === 'number' && Number.isFinite(value.order)
        ? value.order
        : 1,
    title: normalizeText(value.title) || 'Variant Shot',
    description: typeof value.description === 'string' ? value.description : '',
    prompt: typeof value.prompt === 'string' ? value.prompt : '',
    duration:
      typeof value.duration === 'number' && Number.isFinite(value.duration)
        ? value.duration
        : 0,
    framing: normalizeText(value.framing),
    focusSubjects: readStringArray(value.focusSubjects),
    basedOnShotUuid: normalizeText(value.basedOnShotUuid),
  };
}

function normalizeFilmShotVariantPlanRecord(
  value: unknown,
): FilmShotVariantPlan | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeText(value.id);
  const sceneUuid = normalizeText(value.sceneUuid) || normalizeText(value.sceneId);
  const strategy = normalizeFilmShotVariantStrategy(value.strategy);
  if (!id || !sceneUuid || !strategy) {
    return null;
  }

  return {
    id,
    sceneId: normalizeText(value.sceneId),
    sceneUuid,
    sceneNumber:
      typeof value.sceneNumber === 'number' && Number.isFinite(value.sceneNumber)
        ? value.sceneNumber
        : 1,
    title: normalizeText(value.title) || `Scene ${sceneUuid}`,
    strategy,
    label: normalizeText(value.label) || strategy,
    rationale: typeof value.rationale === 'string' ? value.rationale : '',
    sourceShotUuids: readStringArray(value.sourceShotUuids),
    shots: Array.isArray(value.shots)
      ? value.shots
          .map(normalizeFilmShotVariantShotRecord)
          .filter((item): item is FilmShotVariantShot => item !== null)
      : [],
    createdAt: readTimestamp(value.createdAt),
    updatedAt: readTimestamp(value.updatedAt),
  };
}

function normalizeFilmShootingPlanSceneRecord(
  value: unknown,
): FilmShootingPlanScene | null {
  if (!isRecord(value)) {
    return null;
  }

  const sceneUuid = normalizeText(value.sceneUuid) || normalizeText(value.sceneId);
  if (!sceneUuid) {
    return null;
  }

  const preferredStrategy = normalizeFilmShotVariantStrategy(value.preferredStrategy);
  return {
    sceneId: normalizeText(value.sceneId),
    sceneUuid,
    sceneNumber:
      typeof value.sceneNumber === 'number' && Number.isFinite(value.sceneNumber)
        ? value.sceneNumber
        : 1,
    title: normalizeText(value.title) || `Scene ${sceneUuid}`,
    location: normalizeFilmSceneBreakdownEntityRef(value.location) ?? null,
    timeOfDay: normalizeText(value.timeOfDay),
    characters: Array.isArray(value.characters)
      ? value.characters
          .map(normalizeFilmSceneBreakdownEntityRef)
          .filter((item): item is FilmSceneBreakdownEntityRef => item !== null)
      : [],
    props: Array.isArray(value.props)
      ? value.props
          .map(normalizeFilmSceneBreakdownEntityRef)
          .filter((item): item is FilmSceneBreakdownEntityRef => item !== null)
      : [],
    shotCount:
      typeof value.shotCount === 'number' && Number.isFinite(value.shotCount)
        ? value.shotCount
        : 0,
    estimatedMinutes:
      typeof value.estimatedMinutes === 'number' && Number.isFinite(value.estimatedMinutes)
        ? value.estimatedMinutes
        : 0,
    variantPlanIds: readStringArray(value.variantPlanIds),
    availableStrategies: Array.isArray(value.availableStrategies)
      ? value.availableStrategies
          .map(normalizeFilmShotVariantStrategy)
          .filter((item): item is FilmShotVariantStrategy => item !== null)
      : [],
    preferredStrategy: preferredStrategy ?? undefined,
    productionFlags: normalizeFilmSceneBreakdownFlags(value.productionFlags),
  };
}

function normalizeFilmShootingPlanDayRecord(
  value: unknown,
): FilmShootingPlanDay | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeText(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    dayNumber:
      typeof value.dayNumber === 'number' && Number.isFinite(value.dayNumber)
        ? value.dayNumber
        : 1,
    title: normalizeText(value.title) || 'Shooting Day',
    location: normalizeFilmSceneBreakdownEntityRef(value.location) ?? null,
    timeOfDay: normalizeText(value.timeOfDay),
    sceneCount:
      typeof value.sceneCount === 'number' && Number.isFinite(value.sceneCount)
        ? value.sceneCount
        : 0,
    shotCount:
      typeof value.shotCount === 'number' && Number.isFinite(value.shotCount)
        ? value.shotCount
        : 0,
    estimatedMinutes:
      typeof value.estimatedMinutes === 'number' && Number.isFinite(value.estimatedMinutes)
        ? value.estimatedMinutes
        : 0,
    strategies: Array.isArray(value.strategies)
      ? value.strategies
          .map(normalizeFilmShotVariantStrategy)
          .filter((item): item is FilmShotVariantStrategy => item !== null)
      : [],
    characters: Array.isArray(value.characters)
      ? value.characters
          .map(normalizeFilmSceneBreakdownEntityRef)
          .filter((item): item is FilmSceneBreakdownEntityRef => item !== null)
      : [],
    props: Array.isArray(value.props)
      ? value.props
          .map(normalizeFilmSceneBreakdownEntityRef)
          .filter((item): item is FilmSceneBreakdownEntityRef => item !== null)
      : [],
    scenes: Array.isArray(value.scenes)
      ? value.scenes
          .map(normalizeFilmShootingPlanSceneRecord)
          .filter((item): item is FilmShootingPlanScene => item !== null)
      : [],
    rationale: typeof value.rationale === 'string' ? value.rationale : '',
  };
}

function normalizeFilmSceneBreakdownRecord(
  value: unknown,
): FilmSceneBreakdownItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const sceneUuid = normalizeText(value.sceneUuid) || normalizeText(value.sceneId);
  if (!sceneUuid) {
    return null;
  }

  const status =
    value.status === 'READY' || value.status === 'NEEDS_REVIEW'
      ? value.status
      : 'NEEDS_REVIEW';

  return {
    sceneId: normalizeText(value.sceneId),
    sceneUuid,
    sceneNumber:
      typeof value.sceneNumber === 'number' && Number.isFinite(value.sceneNumber)
        ? value.sceneNumber
        : 1,
    title: normalizeText(value.title) || `Scene ${sceneUuid}`,
    summary: typeof value.summary === 'string' ? value.summary : '',
    timeOfDay: normalizeText(value.timeOfDay),
    location: normalizeFilmSceneBreakdownEntityRef(value.location) ?? null,
    characters: Array.isArray(value.characters)
      ? value.characters
          .map(normalizeFilmSceneBreakdownEntityRef)
          .filter((item): item is FilmSceneBreakdownEntityRef => item !== null)
      : [],
    props: Array.isArray(value.props)
      ? value.props
          .map(normalizeFilmSceneBreakdownEntityRef)
          .filter((item): item is FilmSceneBreakdownEntityRef => item !== null)
      : [],
    shotCount:
      typeof value.shotCount === 'number' && Number.isFinite(value.shotCount)
        ? value.shotCount
        : 0,
    shotNumbers: Array.isArray(value.shotNumbers)
      ? value.shotNumbers.filter(
          (item): item is number => typeof item === 'number' && Number.isFinite(item),
        )
      : [],
    shotUuids: readStringArray(value.shotUuids),
    moodTags: readStringArray(value.moodTags),
    visualPrompt: normalizeText(value.visualPrompt),
    continuityNotes: readStringArray(value.continuityNotes),
    productionFlags: normalizeFilmSceneBreakdownFlags(value.productionFlags),
    status,
  };
}

function normalizeFilmPreProductionRecord(
  value: unknown,
): FilmPreProduction | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const summaryRecord = isRecord(value.summary) ? value.summary : {};
  return {
    updatedAt: readTimestamp(value.updatedAt),
    summary: {
      sceneCount:
        typeof summaryRecord.sceneCount === 'number' && Number.isFinite(summaryRecord.sceneCount)
          ? summaryRecord.sceneCount
          : 0,
      readyCount:
        typeof summaryRecord.readyCount === 'number' && Number.isFinite(summaryRecord.readyCount)
          ? summaryRecord.readyCount
          : 0,
      needsReviewCount:
        typeof summaryRecord.needsReviewCount === 'number' &&
        Number.isFinite(summaryRecord.needsReviewCount)
          ? summaryRecord.needsReviewCount
          : 0,
      totalShotCount:
        typeof summaryRecord.totalShotCount === 'number' &&
        Number.isFinite(summaryRecord.totalShotCount)
          ? summaryRecord.totalShotCount
          : 0,
      scenesWithoutLocationCount:
        typeof summaryRecord.scenesWithoutLocationCount === 'number' &&
        Number.isFinite(summaryRecord.scenesWithoutLocationCount)
          ? summaryRecord.scenesWithoutLocationCount
          : 0,
      scenesWithoutCharactersCount:
        typeof summaryRecord.scenesWithoutCharactersCount === 'number' &&
        Number.isFinite(summaryRecord.scenesWithoutCharactersCount)
          ? summaryRecord.scenesWithoutCharactersCount
          : 0,
      scenesWithoutPropsCount:
        typeof summaryRecord.scenesWithoutPropsCount === 'number' &&
        Number.isFinite(summaryRecord.scenesWithoutPropsCount)
          ? summaryRecord.scenesWithoutPropsCount
          : 0,
      scenesWithoutShotsCount:
        typeof summaryRecord.scenesWithoutShotsCount === 'number' &&
        Number.isFinite(summaryRecord.scenesWithoutShotsCount)
          ? summaryRecord.scenesWithoutShotsCount
          : 0,
    },
    sceneBreakdown: Array.isArray(value.sceneBreakdown)
      ? value.sceneBreakdown
          .map(normalizeFilmSceneBreakdownRecord)
          .filter((item): item is FilmSceneBreakdownItem => item !== null)
      : [],
    shotVariants: Array.isArray(value.shotVariants)
      ? value.shotVariants
          .map(normalizeFilmShotVariantPlanRecord)
          .filter((item): item is FilmShotVariantPlan => item !== null)
      : [],
    shotVariantsSummary: isRecord(value.shotVariantsSummary)
      ? {
          sceneCount:
            typeof value.shotVariantsSummary.sceneCount === 'number' &&
            Number.isFinite(value.shotVariantsSummary.sceneCount)
              ? value.shotVariantsSummary.sceneCount
              : 0,
          variantPlanCount:
            typeof value.shotVariantsSummary.variantPlanCount === 'number' &&
            Number.isFinite(value.shotVariantsSummary.variantPlanCount)
              ? value.shotVariantsSummary.variantPlanCount
              : 0,
          totalShotCount:
            typeof value.shotVariantsSummary.totalShotCount === 'number' &&
            Number.isFinite(value.shotVariantsSummary.totalShotCount)
              ? value.shotVariantsSummary.totalShotCount
              : 0,
          strategies: Array.isArray(value.shotVariantsSummary.strategies)
            ? value.shotVariantsSummary.strategies
                .map(normalizeFilmShotVariantStrategy)
                .filter((item): item is FilmShotVariantStrategy => item !== null)
            : [],
        }
      : undefined,
    shootingPlan: Array.isArray(value.shootingPlan)
      ? value.shootingPlan
          .map(normalizeFilmShootingPlanDayRecord)
          .filter((item): item is FilmShootingPlanDay => item !== null)
      : [],
    shootingPlanSummary: isRecord(value.shootingPlanSummary)
      ? {
          dayCount:
            typeof value.shootingPlanSummary.dayCount === 'number' &&
            Number.isFinite(value.shootingPlanSummary.dayCount)
              ? value.shootingPlanSummary.dayCount
              : 0,
          scheduledSceneCount:
            typeof value.shootingPlanSummary.scheduledSceneCount === 'number' &&
            Number.isFinite(value.shootingPlanSummary.scheduledSceneCount)
              ? value.shootingPlanSummary.scheduledSceneCount
              : 0,
          scheduledShotCount:
            typeof value.shootingPlanSummary.scheduledShotCount === 'number' &&
            Number.isFinite(value.shootingPlanSummary.scheduledShotCount)
              ? value.shootingPlanSummary.scheduledShotCount
              : 0,
          estimatedMinutes:
            typeof value.shootingPlanSummary.estimatedMinutes === 'number' &&
            Number.isFinite(value.shootingPlanSummary.estimatedMinutes)
              ? value.shootingPlanSummary.estimatedMinutes
              : 0,
          locationCount:
            typeof value.shootingPlanSummary.locationCount === 'number' &&
            Number.isFinite(value.shootingPlanSummary.locationCount)
              ? value.shootingPlanSummary.locationCount
              : 0,
          companyMoveCount:
            typeof value.shootingPlanSummary.companyMoveCount === 'number' &&
            Number.isFinite(value.shootingPlanSummary.companyMoveCount)
              ? value.shootingPlanSummary.companyMoveCount
              : 0,
          variantBackedSceneCount:
            typeof value.shootingPlanSummary.variantBackedSceneCount === 'number' &&
            Number.isFinite(value.shootingPlanSummary.variantBackedSceneCount)
              ? value.shootingPlanSummary.variantBackedSceneCount
              : 0,
        }
      : undefined,
  };
}

export function normalizeFilmProjectRecord(value: unknown): FilmProject | null {
  if (!isRecord(value)) {
    return null;
  }

  const projectKey = resolveFilmEntityKey(value);
  if (!projectKey) {
    return null;
  }

  const project = value as unknown as FilmProject;
  return {
    ...project,
    type: 'FILM_PROJECT',
    id: normalizeText(project.id) || projectKey,
    uuid: normalizeText(project.uuid) || projectKey,
    name: normalizeText(project.name) || 'Untitled Film Project',
    description: typeof project.description === 'string' ? project.description : '',
    status: normalizeText(project.status) || 'DRAFT',
    preProduction: normalizeFilmPreProductionRecord(project.preProduction),
  } as FilmProject;
}

export function normalizeFilmCharacterRecord(value: unknown): FilmCharacter | null {
  if (!isRecord(value)) {
    return null;
  }

  const characterKey = resolveFilmEntityKey(value);
  if (!characterKey) {
    return null;
  }

  const character = value as unknown as FilmCharacter;
  return {
    ...character,
    type: 'FILM_CHARACTER',
    id: normalizeText(character.id) || characterKey,
    uuid: normalizeText(character.uuid) || characterKey,
    name: normalizeText(character.name) || 'Unknown Character',
    characterType: character.characterType || 'HUMAN',
    status: character.status || 'ACTIVE',
    refAssets: Array.isArray(character.refAssets) ? character.refAssets : [],
  } as FilmCharacter;
}

export function normalizeFilmLocationRecord(value: unknown): FilmLocation | null {
  if (!isRecord(value)) {
    return null;
  }

  const locationKey = resolveFilmEntityKey(value);
  if (!locationKey) {
    return null;
  }

  const location = value as unknown as FilmLocation;
  return {
    ...location,
    type: 'FILM_LOCATION',
    id: normalizeText(location.id) || locationKey,
    uuid: normalizeText(location.uuid) || locationKey,
    name: normalizeText(location.name) || 'Unknown Location',
    tags: Array.isArray(location.tags) ? location.tags : [],
    atmosphereTags: Array.isArray(location.atmosphereTags) ? location.atmosphereTags : [],
    refAssets: Array.isArray(location.refAssets) ? location.refAssets : [],
  } as FilmLocation;
}

export function normalizeFilmPropRecord(value: unknown): FilmProp | null {
  if (!isRecord(value)) {
    return null;
  }

  const propKey = resolveFilmEntityKey(value);
  if (!propKey) {
    return null;
  }

  const prop = value as unknown as FilmProp;
  return {
    ...prop,
    type: 'FILM_PROP',
    id: normalizeText(prop.id) || propKey,
    uuid: normalizeText(prop.uuid) || propKey,
    name: normalizeText(prop.name) || 'Unknown Prop',
    description: typeof prop.description === 'string' ? prop.description : '',
    tags: Array.isArray(prop.tags) ? prop.tags : [],
    refAssets: Array.isArray(prop.refAssets) ? prop.refAssets : [],
  } as FilmProp;
}

export function normalizeFilmSceneRecord(value: unknown): FilmScene | null {
  if (!isRecord(value)) {
    return null;
  }

  const sceneKey = resolveFilmEntityKey(value);
  if (!sceneKey) {
    return null;
  }

  const scene = value as unknown as FilmScene;
  return {
    ...scene,
    type: 'FILM_SCENE',
    id: normalizeText(scene.id) || sceneKey,
    uuid: normalizeText(scene.uuid) || sceneKey,
    sceneNumber:
      typeof scene.sceneNumber === 'number' && Number.isFinite(scene.sceneNumber)
        ? scene.sceneNumber
        : 1,
    index:
      typeof scene.index === 'number' && Number.isFinite(scene.index)
        ? scene.index
        : scene.sceneNumber,
    summary: typeof scene.summary === 'string' ? scene.summary : '',
    characterIds: readStringArray(scene.characterIds),
    characterUuids: readStringArray(scene.characterUuids),
    propUuids: readStringArray(scene.propUuids),
    moodTags: readStringArray(scene.moodTags),
  } as FilmScene;
}

export function normalizeFilmShotRecord(value: unknown): FilmShot | null {
  if (!isRecord(value)) {
    return null;
  }

  const shotKey = resolveFilmEntityKey(value);
  if (!shotKey) {
    return null;
  }

  const shot = value as unknown as FilmShot;
  return {
    ...shot,
    type: 'FILM_SHOT',
    id: normalizeText(shot.id) || shotKey,
    uuid: normalizeText(shot.uuid) || shotKey,
    shotNumber:
      typeof shot.shotNumber === 'number' && Number.isFinite(shot.shotNumber)
        ? shot.shotNumber
        : 1,
    index:
      typeof shot.index === 'number' && Number.isFinite(shot.index)
        ? shot.index
        : shot.shotNumber,
    description: typeof shot.description === 'string' ? shot.description : '',
    duration:
      typeof shot.duration === 'number' && Number.isFinite(shot.duration)
        ? shot.duration
        : 0,
    assets: Array.isArray(shot.assets) ? shot.assets : [],
    characterIds: readStringArray(shot.characterIds),
  } as FilmShot;
}

export function normalizeFilmAnalysisResult(value: unknown): FilmScriptAnalysisResult {
  const result = isRecord(value) ? value : {};

  return {
    characters: Array.isArray(result.characters)
      ? result.characters.map(normalizeFilmCharacterRecord).filter((item): item is FilmCharacter => item !== null)
      : [],
    locations: Array.isArray(result.locations)
      ? result.locations.map(normalizeFilmLocationRecord).filter((item): item is FilmLocation => item !== null)
      : [],
    props: Array.isArray(result.props)
      ? result.props.map(normalizeFilmPropRecord).filter((item): item is FilmProp => item !== null)
      : [],
    scenes: Array.isArray(result.scenes)
      ? result.scenes.map(normalizeFilmSceneRecord).filter((item): item is FilmScene => item !== null)
      : [],
    shots: Array.isArray(result.shots)
      ? result.shots.map(normalizeFilmShotRecord).filter((item): item is FilmShot => item !== null)
      : [],
  };
}
