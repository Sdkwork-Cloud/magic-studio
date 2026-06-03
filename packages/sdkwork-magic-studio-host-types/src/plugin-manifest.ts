export const MAGIC_STUDIO_PLUGIN_PERMISSION_SCOPES = [
  'filesystem.read',
  'filesystem.write',
  'media.inspect',
  'media.execute',
  'jobs.submit',
  'jobs.cancel',
  'pty.attach',
  'browser.embed',
  'policy.read',
  'plugin.catalog.read',
  'app.settings.read',
  'app.notifications.write',
] as const;

export type MagicStudioPluginPermissionScope =
  (typeof MAGIC_STUDIO_PLUGIN_PERMISSION_SCOPES)[number];

export interface MagicStudioPluginManifest {
  id: string;
  name: string;
  version: string;
  kind: 'builtin' | 'local';
  routePrefix: string;
  capabilitySet: MagicStudioPluginPermissionScope[];
  permissions: {
    paths: Array<'workspace' | 'cache' | 'plugin-sandbox' | 'logs'>;
    commands: 'none' | 'governed';
  };
}
