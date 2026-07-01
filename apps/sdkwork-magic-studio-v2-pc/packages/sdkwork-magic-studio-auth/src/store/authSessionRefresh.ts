export interface AuthSessionRefreshController {
  bootstrap(): Promise<unknown>;
}

export interface RefreshAuthStoreSessionInput {
  clearSession: () => Promise<void> | void;
  controller: AuthSessionRefreshController;
  refreshSession: (refreshToken?: string) => Promise<unknown>;
  refreshToken?: string | null;
}

function readText(value: string | null | undefined): string {
  return (value || '').trim();
}

export async function refreshAuthStoreSession(
  input: RefreshAuthStoreSessionInput,
): Promise<void> {
  const refreshToken = readText(input.refreshToken) || undefined;

  try {
    await input.refreshSession(refreshToken);
  } catch (error) {
    await input.clearSession();
    await input.controller.bootstrap();
    throw error;
  }

  await input.controller.bootstrap();
}
