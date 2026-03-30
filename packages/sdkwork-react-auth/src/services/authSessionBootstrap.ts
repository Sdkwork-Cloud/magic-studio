import type { AuthSessionSnapshot } from './authSessionService';

export function shouldHydrateStoredSession(
    session: Pick<AuthSessionSnapshot, 'authToken'> | null | undefined
): boolean {
    return Boolean((session?.authToken || '').trim());
}
