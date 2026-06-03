export const MAGIC_STUDIO_RUNTIME_MODES = [
  'web',
  'desktop',
  'server',
  'container',
  'kubernetes',
] as const;

export type MagicStudioRuntimeMode = (typeof MAGIC_STUDIO_RUNTIME_MODES)[number];

export type MagicStudioHostMode = 'desktop' | 'server';

export interface MagicStudioHostDescriptor {
  kind: MagicStudioHostMode;
  host: string;
  port: number;
  apiBaseUrl: string;
  healthPath: string;
  docsPath: string;
  openApiPath: string;
  routeCatalogPath: string;
  runtimeSummaryPath: string;
}
