import { describe, expect, it } from 'vitest';

import { buildProfileSnapshot, hasProfileDraftChanges } from './profilePageState';

describe('profilePageState', () => {
    it('captures avatar values when building the persisted profile snapshot', () => {
        expect(buildProfileSnapshot({
            nickname: ' Demo User ',
            region: ' Shanghai ',
            bio: ' Creator ',
            avatar: ' https://cdn.example.com/avatar.png ',
        })).toEqual({
            nickname: 'Demo User',
            region: 'Shanghai',
            bio: 'Creator',
            avatar: 'https://cdn.example.com/avatar.png',
        });
    });

    it('treats a pending avatar selection as an unsaved profile change', () => {
        const snapshot = buildProfileSnapshot({
            nickname: 'Demo User',
            region: 'Shanghai',
            bio: 'Creator',
            avatar: 'https://cdn.example.com/avatar.png',
        });

        expect(hasProfileDraftChanges(snapshot, {
            nickname: 'Demo User',
            region: 'Shanghai',
            bio: 'Creator',
        }, true)).toBe(true);
    });

    it('ignores whitespace-only edits when the avatar draft is clean', () => {
        const snapshot = buildProfileSnapshot({
            nickname: 'Demo User',
            region: 'Shanghai',
            bio: 'Creator',
            avatar: 'https://cdn.example.com/avatar.png',
        });

        expect(hasProfileDraftChanges(snapshot, {
            nickname: ' Demo User ',
            region: ' Shanghai ',
            bio: ' Creator ',
        }, false)).toBe(false);
    });
});
