import type { PlatformShellCommandName, PlatformShellEventName } from './runtime/types';
import {
  isPlatformShellCommandName,
  isPlatformShellEventName,
} from './runtime/shellVocabulary';
import type { DesktopShellModules } from './desktopShellModules';

const normalizeShellBridgeCommand = (
  command: string,
): PlatformShellCommandName => {
  if (isPlatformShellCommandName(command)) {
    return command;
  }

  throw new Error(
    `[Platform] Unsupported bridge command "${command}". Desktop bridge is reserved for shell-only commands.`,
  );
};

const normalizeShellBridgeEvent = (event: string): PlatformShellEventName => {
  if (isPlatformShellEventName(event)) {
    return event;
  }

  throw new Error(
    `[Platform] Unsupported bridge event "${event}". Desktop bridge is reserved for shell-only events.`,
  );
};

export interface DesktopShellBridge {
  invoke<T = unknown>(
    command: PlatformShellCommandName,
    payload?: Record<string, unknown>,
  ): Promise<T>;
  listen<T = unknown>(
    event: PlatformShellEventName,
    callback: (payload: T) => void,
  ): Promise<() => void>;
}

type DesktopBridgeModuleLoader = () => Promise<
  Pick<DesktopShellModules, 'shellInvoke' | 'shellListen'>
>;

export const createDesktopShellBridge = (
  loadModules: DesktopBridgeModuleLoader,
): DesktopShellBridge => ({
  invoke: async <T = unknown>(
    command: PlatformShellCommandName,
    payload?: Record<string, unknown>,
  ): Promise<T> => {
    const { shellInvoke } = await loadModules();
    return shellInvoke<T>(normalizeShellBridgeCommand(command), payload);
  },
  listen: async <T = unknown>(
    event: PlatformShellEventName,
    callback: (payload: T) => void,
  ): Promise<() => void> => {
    const { shellListen } = await loadModules();
    const unlisten = await shellListen<T>(
      normalizeShellBridgeEvent(event),
      (runtimeEvent) => {
        callback(runtimeEvent.payload);
      },
    );

    return (): void => {
      unlisten();
    };
  },
});
