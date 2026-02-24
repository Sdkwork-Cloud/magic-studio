
export const ENV = {
  isDev: (import.meta as any).env?.DEV ?? false,
  isTauri: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
};
