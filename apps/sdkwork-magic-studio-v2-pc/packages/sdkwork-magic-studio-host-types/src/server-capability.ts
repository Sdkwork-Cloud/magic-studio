import type { MagicStudioApiSurface } from './server-api.ts';
import type { MagicStudioRuntimeMode } from './host.ts';

export const MAGIC_STUDIO_HOST_DELIVERY_MODES = [
  'server-deployment',
  'desktop-embedded',
] as const;

export const MAGIC_STUDIO_CAPABILITY_SURFACES = [
  'app',
  'admin',
  'package-local',
] as const;

export const MAGIC_STUDIO_APP_CAPABILITY_STATUSES = [
  'canonical',
  'planned',
  'package-local',
] as const;

export const MAGIC_STUDIO_APP_EXECUTION_STATUSES = [
  'ready',
  'mixed',
  'lifecycle-only',
  'planned',
  'not-applicable',
] as const;

export const MAGIC_STUDIO_APP_ADAPTER_STATUSES = [
  'generated-ai-sdk',
  'host-local',
  'mixed',
  'not-configured',
  'planned',
  'not-applicable',
] as const;

export type MagicStudioHostDeliveryMode =
  (typeof MAGIC_STUDIO_HOST_DELIVERY_MODES)[number];

export type MagicStudioCapabilitySurface =
  (typeof MAGIC_STUDIO_CAPABILITY_SURFACES)[number];

export type MagicStudioAppCapabilityStatus =
  (typeof MAGIC_STUDIO_APP_CAPABILITY_STATUSES)[number];

export type MagicStudioAppExecutionStatus =
  (typeof MAGIC_STUDIO_APP_EXECUTION_STATUSES)[number];

export type MagicStudioAppCapabilityAdapterStatus =
  (typeof MAGIC_STUDIO_APP_ADAPTER_STATUSES)[number];

export interface MagicStudioAppCapabilityFamilyCount {
  family: string;
  routeCount: number;
}

export interface MagicStudioAppCapabilityRouteCounts {
  core: number;
  app: number;
  admin: number;
  total: number;
  appFamilies: readonly MagicStudioAppCapabilityFamilyCount[];
}

export interface MagicStudioAppCapabilitySummary {
  product: string;
  standardVersion: string;
  businessKernel: string;
  hostDeliveryModes: readonly MagicStudioHostDeliveryMode[];
  runtimeKinds: readonly MagicStudioRuntimeMode[];
  apiSurfaces: readonly MagicStudioApiSurface[];
  routeCounts: MagicStudioAppCapabilityRouteCounts;
  extractedDomainCount: number;
  plannedDomainCount: number;
  packageLocalDomainCount: number;
}

export interface MagicStudioAppCapabilityDomain {
  key: string;
  name: string;
  surface: MagicStudioCapabilitySurface;
  ownerPackage: string;
  pathPrefix?: string | null;
  routeCount: number;
  status: MagicStudioAppCapabilityStatus;
  executionStatus: MagicStudioAppExecutionStatus;
  description: string;
}

export interface MagicStudioAppExecutionCapability {
  key: string;
  name: string;
  domain: string;
  pathPrefix: string;
  routeIds: readonly string[];
  operations: readonly string[];
  operationDetails: readonly MagicStudioAppExecutionOperation[];
  executionStatus: MagicStudioAppExecutionStatus;
  adapterStatus: MagicStudioAppCapabilityAdapterStatus;
  description: string;
}

export interface MagicStudioAppExecutionOperation {
  key: string;
  executionStatus: MagicStudioAppExecutionStatus;
  adapterStatus: MagicStudioAppCapabilityAdapterStatus;
  description: string;
}
