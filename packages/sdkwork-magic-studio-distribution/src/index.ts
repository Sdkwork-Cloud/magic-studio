export const MAGIC_STUDIO_RELEASE_FAMILIES = [
  'web',
  'desktop',
  'server',
  'container',
  'kubernetes',
] as const;

export type MagicStudioReleaseFamily = (typeof MAGIC_STUDIO_RELEASE_FAMILIES)[number];

export interface MagicStudioReleaseArtifactRecord {
  family: MagicStudioReleaseFamily;
  platform: string;
  arch: string;
  relativePath: string;
  sha256?: string;
  size?: number;
}
