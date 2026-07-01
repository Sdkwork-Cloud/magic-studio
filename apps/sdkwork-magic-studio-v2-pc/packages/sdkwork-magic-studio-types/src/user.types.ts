import type { BaseEntity, EntityId } from './base.types.ts';
import type { ThemeMode } from './theme-mode.ts';
import type { NotificationType } from './vocabulary.types.ts';

export interface User extends BaseEntity {
    username: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    isVip?: boolean;
    role?: string;
}

export interface UserSettings {
    theme?: ThemeMode | string;
    fontSize?: number;
    fontFamily?: string;
    language?: string;
    autoPlay?: boolean;
    highQuality?: boolean;
    dataSaver?: boolean;
    general?: {
        compactModelSelector?: boolean;
        launchOnStartup?: boolean;
        startMinimized?: boolean;
    };
    notifications?: {
        newMessages?: boolean;
        securityAlerts?: boolean;
        systemUpdates?: boolean;
        taskCompletions?: boolean;
        taskFailures?: boolean;
    };
    privacy?: {
        personalizedRecommendations?: boolean;
        shareUsageData?: boolean;
    };
    security?: {
        loginAlerts?: boolean;
        twoFactorAuth?: boolean;
    };
    notificationSettings?: Record<string, unknown>;
    privacySettings?: Record<string, unknown>;
    downloadSettings?: Record<string, unknown>;
}

export interface UserProfile extends BaseEntity {
    userId: string;
    username: string;
    nickname: string;
    email?: string;
    phone?: string;
    avatar?: string;
    avatarUrl?: string;
    bio?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    region?: string;
}

export interface UserAddress extends BaseEntity {
    name: string;
    phone: string;
    countryCode?: string;
    provinceCode?: string;
    cityCode?: string;
    districtCode?: string;
    addressDetail: string;
    postalCode?: string;
    fullAddress: string;
    isDefault: boolean;
}

export interface UserBinding extends BaseEntity {
    platform: string;
    target?: string;
    displayName?: string;
    avatarUrl?: string;
    boundAt: string;
    metadata?: Record<string, unknown>;
}

export interface UserLoginHistoryEntry extends BaseEntity {
    authMethod: string;
    status: string;
    loginAt: string;
    ipAddress?: string;
    deviceName?: string;
    clientKind?: string;
}

export interface UserGenerationHistoryEntry extends BaseEntity {
    taskId: string;
    category: string;
    status: string;
    prompt?: string;
    coverAssetId?: string;
    coverUrl?: string;
    resultCount?: number;
    completedAt?: string;
}

export type UserSecuritySessionStatus = 'active' | 'expired' | 'revoked';

export interface UserSecuritySession extends BaseEntity {
    userId: string;
    deviceId: string;
    authMethod: string;
    status: UserSecuritySessionStatus;
    expiresAt: string;
    lastActiveAt: string;
    ipAddress?: string;
    deviceName?: string;
    clientKind?: string;
    current: boolean;
}

export interface UserTrustedDevice extends BaseEntity {
    userId: string;
    name: string;
    clientKind: string;
    trustedAt: string;
    lastSeenAt: string;
    lastIpAddress?: string;
    activeSessionCount: number;
    current: boolean;
}

export interface UserTwoFactorStatus {
    enabled: boolean;
    pendingSetup: boolean;
    verifiedAt?: string;
    recoveryCodesRemaining: number;
    method: 'totp';
}

export interface UserTwoFactorSetup {
    issuer: string;
    accountName: string;
    secretBase32: string;
    otpAuthUrl: string;
    recoveryCodes: string[];
    status: UserTwoFactorStatus;
}

export interface UserPasswordChangeResult {
    ok: boolean;
}

export interface AppNotification extends Omit<BaseEntity, 'id'> {
    id: EntityId;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    actionUrl?: string;
    actionLabel?: string;
}
