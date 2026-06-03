import type { MagicStudioRuntimeMode } from './host.ts';

export const MAGIC_STUDIO_SERVER_DEPLOYMENT_FAMILIES = [
  'server',
  'desktop',
  'container',
  'kubernetes',
] as const;

export const MAGIC_STUDIO_SERVER_DEPLOYMENT_CHANNELS = [
  'local',
  'release',
  'container',
  'kubernetes',
] as const;

export const MAGIC_STUDIO_SERVER_DEPLOYMENT_STATUSES = [
  'active',
  'inactive',
  'building',
  'failed',
] as const;

export type MagicStudioServerDeploymentFamily =
  (typeof MAGIC_STUDIO_SERVER_DEPLOYMENT_FAMILIES)[number];

export type MagicStudioServerDeploymentChannel =
  (typeof MAGIC_STUDIO_SERVER_DEPLOYMENT_CHANNELS)[number];

export type MagicStudioServerDeploymentStatus =
  (typeof MAGIC_STUDIO_SERVER_DEPLOYMENT_STATUSES)[number];

export interface MagicStudioRuntimeSystemPaths {
  home: string;
  appData: string;
  desktop: string;
  documents: string;
  downloads: string;
  temp: string;
}

export interface MagicStudioRuntimeSummary {
  mode: MagicStudioRuntimeMode;
  host: string;
  port: number;
  apiBaseUrl: string;
  apiVersion: string;
  runtimeOs: string;
  runtimeArch: string;
  docsPath: string;
  openApiPath: string;
  routeCatalogPath: string;
  systemPaths: MagicStudioRuntimeSystemPaths;
}

export interface MagicStudioServerDeploymentRecord {
  family: MagicStudioServerDeploymentFamily;
  platform: string;
  arch: string;
  channel: MagicStudioServerDeploymentChannel;
  status: MagicStudioServerDeploymentStatus;
  openApiVersion: string;
  checksum: string | null;
}
