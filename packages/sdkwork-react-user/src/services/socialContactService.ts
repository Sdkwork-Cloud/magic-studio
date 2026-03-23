import type {
    ContactFriendVO,
    ContactStatsVO,
    FriendRequestCreateForm,
    FriendRequestVO,
    PlusApiResultContactStatsVO,
    PlusApiResultFriendRequestVO,
    PlusApiResultListContactFriendVO,
    PlusApiResultListFriendRequestVO,
    PlusApiResultVoid,
    QueryParams,
} from '@sdkwork/app-sdk';
import { getAppSdkClientWithSession } from '@sdkwork/react-core';

export interface SocialContact extends ContactFriendVO {}
export interface SocialFriendRequest extends FriendRequestVO {}
export interface SocialContactStats extends ContactStatsVO {}
export interface SocialContactQuery extends QueryParams {}

function unwrapResult<T>(result: { code?: string | number; msg?: string; data?: T }, fallback: string): T {
    const code = String(result?.code ?? '').trim();
    if (code && code !== '2000') {
        throw new Error((result?.msg || '').trim() || fallback);
    }
    return (result?.data as T) || ({} as T);
}

function ensureSuccess(result: { code?: string | number; msg?: string }, fallback: string): void {
    const code = String(result?.code ?? '').trim();
    if (code && code !== '2000') {
        throw new Error((result?.msg || '').trim() || fallback);
    }
}

function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

export interface ISocialContactService {
    getContactStats(): Promise<SocialContactStats | null>;
    listContacts(params?: SocialContactQuery): Promise<SocialContact[]>;
    deleteContact(contactId: string | number): Promise<void>;
    updateFriendRemark(contactId: string | number, remark: string): Promise<void>;
    listFriendRequests(): Promise<SocialFriendRequest[]>;
    sendFriendRequest(input: FriendRequestCreateForm): Promise<SocialFriendRequest>;
    processFriendRequest(requestId: string | number, action: 'accept' | 'reject'): Promise<SocialFriendRequest>;
}

class SocialContactServiceImpl implements ISocialContactService {
    async getContactStats(): Promise<SocialContactStats | null> {
        const client = getAppSdkClientWithSession();
        const response = await client.social.getContactStats();
        const data = unwrapResult<SocialContactStats>(
            response as PlusApiResultContactStatsVO,
            'Failed to load contact stats',
        );
        if (!data || Object.keys(data).length === 0) {
            return null;
        }
        return data;
    }

    async listContacts(params?: SocialContactQuery): Promise<SocialContact[]> {
        const client = getAppSdkClientWithSession();
        const response = await client.social.listContacts(params);
        const data = unwrapResult<SocialContact[]>(
            response as PlusApiResultListContactFriendVO,
            'Failed to load contacts',
        );
        return ensureArray<SocialContact>(data);
    }

    async deleteContact(contactId: string | number): Promise<void> {
        const client = getAppSdkClientWithSession();
        const response = await client.social.deleteContact(contactId);
        ensureSuccess(response as PlusApiResultVoid, 'Failed to delete contact');
    }

    async updateFriendRemark(contactId: string | number, remark: string): Promise<void> {
        const client = getAppSdkClientWithSession();
        const response = await client.social.updateFriendRemark(contactId, { remark: remark.trim() || undefined });
        ensureSuccess(response as PlusApiResultVoid, 'Failed to update friend remark');
    }

    async listFriendRequests(): Promise<SocialFriendRequest[]> {
        const client = getAppSdkClientWithSession();
        const response = await client.social.listFriendRequests();
        const data = unwrapResult<SocialFriendRequest[]>(
            response as PlusApiResultListFriendRequestVO,
            'Failed to load friend requests',
        );
        return ensureArray<SocialFriendRequest>(data);
    }

    async sendFriendRequest(input: FriendRequestCreateForm): Promise<SocialFriendRequest> {
        if (!String(input?.toUserId || '').trim()) {
            throw new Error('Target user id is required');
        }
        const client = getAppSdkClientWithSession();
        const response = await client.social.sendFriendRequest({
            toUserId: String(input.toUserId).trim(),
            message: (input.message || '').trim() || undefined,
        });
        return unwrapResult<SocialFriendRequest>(
            response as PlusApiResultFriendRequestVO,
            'Failed to send friend request',
        );
    }

    async processFriendRequest(requestId: string | number, action: 'accept' | 'reject'): Promise<SocialFriendRequest> {
        const client = getAppSdkClientWithSession();
        const response = await client.social.processFriendRequest(requestId, { action });
        return unwrapResult<SocialFriendRequest>(
            response as PlusApiResultFriendRequestVO,
            `Failed to ${action} friend request`,
        );
    }
}

export const socialContactService: ISocialContactService = new SocialContactServiceImpl();
