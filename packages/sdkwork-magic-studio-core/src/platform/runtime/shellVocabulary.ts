export const PLATFORM_SHELL_COMMAND_NAMES = [
  'create_pty',
  'kill_pty',
  'resize_pty',
  'start_pty',
  'sync_pty_sessions',
  'system_command_exists',
  'write_pty',
] as const;

export const PLATFORM_SHELL_COMMAND = {
  createPty: 'create_pty',
  killPty: 'kill_pty',
  resizePty: 'resize_pty',
  startPty: 'start_pty',
  syncPtySessions: 'sync_pty_sessions',
  systemCommandExists: 'system_command_exists',
  writePty: 'write_pty',
} as const;

export type PlatformShellCommandName =
  typeof PLATFORM_SHELL_COMMAND_NAMES[number];

export const isPlatformShellCommandName = (
  value: string,
): value is PlatformShellCommandName =>
  (PLATFORM_SHELL_COMMAND_NAMES as readonly string[]).includes(value);

export const PTY_OUTPUT_SHELL_EVENT_PREFIX = 'pty-output:' as const;

export type PlatformShellEventName =
  `${typeof PTY_OUTPUT_SHELL_EVENT_PREFIX}${string}`;

export const createPtyOutputShellEventName = (
  sessionId: string,
): PlatformShellEventName =>
  `${PTY_OUTPUT_SHELL_EVENT_PREFIX}${sessionId}`;

export const isPlatformShellEventName = (
  value: string,
): value is PlatformShellEventName =>
  value.startsWith(PTY_OUTPUT_SHELL_EVENT_PREFIX);
