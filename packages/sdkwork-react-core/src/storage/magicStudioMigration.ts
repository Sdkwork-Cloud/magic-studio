import { pathUtils } from '@sdkwork/react-commons';

export type MagicStudioMigrationReason =
  | 'legacy-root'
  | 'already-current'
  | 'already-migrated'
  | 'target-not-empty'
  | 'no-legacy-root';

export interface PlanMagicStudioMigrationInput {
  currentRoot?: string | null;
  targetRoot: string;
  targetEmpty: boolean;
  markerExists: boolean;
}

export interface MagicStudioMigrationPlan {
  required: boolean;
  reason: MagicStudioMigrationReason;
  sourceRoot: string | null;
  targetRoot: string;
  markerPath: string;
}

const normalizeRoot = (value: string): string => pathUtils.normalize(value.trim());

const LEGACY_ROOT_NAMES = new Set(['open-studio', 'OpenStudio']);

export const isLegacyMagicStudioRoot = (rootDir: string): boolean => {
  const normalizedRoot = normalizeRoot(rootDir);
  const lastSegment = pathUtils.basename(normalizedRoot);
  return LEGACY_ROOT_NAMES.has(lastSegment);
};

export const getMagicStudioMigrationMarkerPath = (targetRoot: string): string =>
  pathUtils.join(normalizeRoot(targetRoot), 'system', 'migration', 'magicstudio-root-migrated.json');

export const planMagicStudioMigration = (
  input: PlanMagicStudioMigrationInput
): MagicStudioMigrationPlan => {
  const normalizedTargetRoot = normalizeRoot(input.targetRoot);
  const markerPath = getMagicStudioMigrationMarkerPath(normalizedTargetRoot);
  const normalizedCurrentRoot = input.currentRoot ? normalizeRoot(input.currentRoot) : null;

  if (input.markerExists) {
    return {
      required: false,
      reason: 'already-migrated',
      sourceRoot: normalizedCurrentRoot,
      targetRoot: normalizedTargetRoot,
      markerPath,
    };
  }

  if (!normalizedCurrentRoot || normalizedCurrentRoot === normalizedTargetRoot) {
    return {
      required: false,
      reason: 'already-current',
      sourceRoot: normalizedCurrentRoot,
      targetRoot: normalizedTargetRoot,
      markerPath,
    };
  }

  if (!isLegacyMagicStudioRoot(normalizedCurrentRoot)) {
    return {
      required: false,
      reason: 'no-legacy-root',
      sourceRoot: normalizedCurrentRoot,
      targetRoot: normalizedTargetRoot,
      markerPath,
    };
  }

  if (!input.targetEmpty) {
    return {
      required: false,
      reason: 'target-not-empty',
      sourceRoot: normalizedCurrentRoot,
      targetRoot: normalizedTargetRoot,
      markerPath,
    };
  }

  return {
    required: true,
    reason: 'legacy-root',
    sourceRoot: normalizedCurrentRoot,
    targetRoot: normalizedTargetRoot,
    markerPath,
  };
};
