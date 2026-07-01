import {
  assertUserCenterValidationPreflightCompatibility,
  USER_CENTER_VALIDATION_SOURCE_PACKAGE_NAME,
  createUserCenterValidationInteropContract,
  createUserCenterValidationPluginDefinition,
  createUserCenterValidationPreflightReport,
  createUserCenterValidationSnapshot,
  requireUserCenterProtectedToken,
  resolveUserCenterProtectedToken,
  type UserCenterProtectedTokenRequirementOptions,
  type UserCenterProtectedTokenResolutionOptions,
  type UserCenterValidationInteropContract,
  type UserCenterValidationPluginDefinition,
  type UserCenterValidationPreflightReport,
  type UserCenterValidationSnapshot,
} from '@sdkwork/user-center-validation-pc-react';
import {
  createMagicStudioUserCenterConfig,
  createMagicStudioUserCenterPluginDefinition,
  createMagicStudioUserCenterServerValidationPluginDefinition as createStandardMagicStudioUserCenterServerValidationPluginDefinition,
  type CreateMagicStudioUserCenterConfigOptions,
  type CreateMagicStudioUserCenterPluginDefinitionOptions,
  type CreateMagicStudioUserCenterServerPluginDefinitionOptions,
  type MagicStudioUserCenterServerValidationPluginDefinition,
} from './userCenterStandard.ts';

export type MagicStudioUserCenterValidationSnapshot = UserCenterValidationSnapshot;
export type MagicStudioUserCenterValidationPluginDefinition = UserCenterValidationPluginDefinition;
export type MagicStudioUserCenterValidationInteropContract =
  UserCenterValidationInteropContract;
export type MagicStudioUserCenterValidationPreflightReport =
  UserCenterValidationPreflightReport;
export type MagicStudioProtectedTokenResolutionOptions =
  UserCenterProtectedTokenResolutionOptions;
export type MagicStudioProtectedTokenRequirementOptions =
  UserCenterProtectedTokenRequirementOptions;

export interface CreateMagicStudioUserCenterValidationPreflightOptions
  extends CreateMagicStudioUserCenterConfigOptions {
  peerContract: MagicStudioUserCenterValidationInteropContract;
}

export const MAGIC_STUDIO_USER_CENTER_VALIDATION_SOURCE_PACKAGE =
  USER_CENTER_VALIDATION_SOURCE_PACKAGE_NAME;
export const MAGIC_STUDIO_USER_CENTER_VALIDATION_PLUGIN_PACKAGES = Object.freeze([
  '@sdkwork/magic-studio-user',
]);

export function createMagicStudioUserCenterValidationSnapshot(
  options: CreateMagicStudioUserCenterConfigOptions = {},
): MagicStudioUserCenterValidationSnapshot {
  return createUserCenterValidationSnapshot(createMagicStudioUserCenterConfig(options));
}

export function createMagicStudioUserCenterValidationInteropContract(
  options: CreateMagicStudioUserCenterConfigOptions = {},
): MagicStudioUserCenterValidationInteropContract {
  return createUserCenterValidationInteropContract(
    createMagicStudioUserCenterValidationSnapshot(options),
  );
}

export function createMagicStudioUserCenterValidationPluginDefinition(
  options: CreateMagicStudioUserCenterPluginDefinitionOptions = {},
): MagicStudioUserCenterValidationPluginDefinition {
  return createUserCenterValidationPluginDefinition({
    ...options,
    packageNames:
      options.packageNames ?? [...MAGIC_STUDIO_USER_CENTER_VALIDATION_PLUGIN_PACKAGES],
    title: options.title ?? 'Magic Studio User Center',
    userCenterPlugin: createMagicStudioUserCenterPluginDefinition(options),
  });
}

export function createMagicStudioUserCenterServerValidationPluginDefinition(
  options: CreateMagicStudioUserCenterServerPluginDefinitionOptions = {},
): MagicStudioUserCenterServerValidationPluginDefinition {
  return createStandardMagicStudioUserCenterServerValidationPluginDefinition(options);
}

export function createMagicStudioUserCenterValidationPreflightReport(
  options: CreateMagicStudioUserCenterValidationPreflightOptions,
): MagicStudioUserCenterValidationPreflightReport {
  const { peerContract, ...configOptions } = options;
  return createUserCenterValidationPreflightReport({
    peerContract,
    snapshot: createMagicStudioUserCenterValidationSnapshot(configOptions),
  });
}

export function assertMagicStudioUserCenterValidationPreflight(
  options: CreateMagicStudioUserCenterValidationPreflightOptions,
): MagicStudioUserCenterValidationPreflightReport {
  const { peerContract, ...configOptions } = options;
  return assertUserCenterValidationPreflightCompatibility({
    peerContract,
    snapshot: createMagicStudioUserCenterValidationSnapshot(configOptions),
  });
}

export function resolveMagicStudioProtectedToken(
  options: MagicStudioProtectedTokenResolutionOptions,
): string | null {
  return resolveUserCenterProtectedToken(options);
}

export function requireMagicStudioProtectedToken(
  options: MagicStudioProtectedTokenRequirementOptions,
): string {
  return requireUserCenterProtectedToken(options);
}
