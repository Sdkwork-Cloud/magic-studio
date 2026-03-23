import type { UserCenterProfile } from '../services/userCenterService';

export interface ProfileSnapshot {
    nickname: string;
    region: string;
    bio: string;
    avatar: string;
}

export interface ProfileDraftValues {
    nickname: string;
    region: string;
    bio: string;
}

function normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export function buildProfileSnapshot(
    profile: Pick<UserCenterProfile, 'nickname' | 'region' | 'bio' | 'avatar'>,
): ProfileSnapshot {
    return {
        nickname: normalizeText(profile.nickname),
        region: normalizeText(profile.region),
        bio: normalizeText(profile.bio),
        avatar: normalizeText(profile.avatar),
    };
}

export function hasProfileDraftChanges(
    snapshot: ProfileSnapshot,
    draft: ProfileDraftValues,
    hasPendingAvatarUpload: boolean,
): boolean {
    if (hasPendingAvatarUpload) {
        return true;
    }

    return normalizeText(draft.nickname) !== snapshot.nickname
        || normalizeText(draft.region) !== snapshot.region
        || normalizeText(draft.bio) !== snapshot.bio;
}
