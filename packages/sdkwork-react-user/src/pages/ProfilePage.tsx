import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@sdkwork/react-auth';
import { ROUTES, useRouter } from '@sdkwork/react-core';
import {
    ArrowLeft,
    History,
    LayoutGrid,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Settings2,
    ShieldCheck,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import {
    type UserCenterAddress,
    type UserCenterProfile,
    type UserCenterSettings,
    type UserCenterUpdateSettingsInput,
} from '../services/userCenterService';
import { userBusinessService } from '../services/userBusinessService';
import {
    type SocialContact,
    type SocialContactStats,
    type SocialFriendRequest,
} from '../services/socialContactService';

interface AddressFormState {
    name: string;
    phone: string;
    provinceCode: string;
    cityCode: string;
    districtCode: string;
    addressDetail: string;
    isDefault: boolean;
}

interface HistoryRow {
    id: string;
    title: string;
    timeText: string;
    detail: string;
}

interface UserSettingsDraft {
    theme: string;
    language: string;
    autoPlay: boolean;
    highQuality: boolean;
    dataSaver: boolean;
    notificationSettings: {
        system: boolean;
        message: boolean;
        activity: boolean;
        promotion: boolean;
        sound: boolean;
        vibration: boolean;
    };
    privacySettings: {
        publicProfile: boolean;
        allowSearch: boolean;
        allowFriendRequest: boolean;
    };
}

interface ProfileSnapshot {
    nickname: string;
    region: string;
    bio: string;
}

interface AccountBindingDraft {
    email: string;
    emailCode: string;
    phone: string;
    phoneCode: string;
    wechatCode: string;
    wechatUserId: string;
    qqCode: string;
    qqUserId: string;
}

type FeedbackType = 'success' | 'error';
type ProfileSectionKey = 'overview' | 'security' | 'addresses' | 'contacts' | 'preferences' | 'activity';

interface FeedbackState {
    type: FeedbackType;
    text: string;
}

interface ProfileSectionItem {
    key: ProfileSectionKey;
    title: string;
    description: string;
    icon: LucideIcon;
}

const HISTORY_PAGE_SIZE = 8;

const PROFILE_SECTION_ITEMS: ProfileSectionItem[] = [
    { key: 'overview', title: 'Profile', description: 'Basic identity information', icon: User },
    { key: 'security', title: 'Security', description: 'Password and login records', icon: ShieldCheck },
    { key: 'addresses', title: 'Address Book', description: 'Shipping and contact addresses', icon: MapPin },
    { key: 'contacts', title: 'Contacts', description: 'Friends and contact requests', icon: Users },
    { key: 'preferences', title: 'Preferences', description: 'Personalized experience settings', icon: Settings2 },
    { key: 'activity', title: 'Activity', description: 'Recent operation timeline', icon: History },
];

function safeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function safeText(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
}

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function readRecordText(record: Record<string, unknown>, key: string): string {
    return safeText(record[key]);
}

function readBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
    }
    return undefined;
}

function readRecordBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
    return readBoolean(record[key]);
}

function getAddressRecord(address: UserCenterAddress): Record<string, unknown> {
    return asRecord(address);
}

function getAddressText(address: UserCenterAddress, key: string): string {
    return readRecordText(getAddressRecord(address), key);
}

function getAddressBoolean(address: UserCenterAddress, key: string): boolean {
    return readRecordBoolean(getAddressRecord(address), key) ?? false;
}

function getAddressId(address: UserCenterAddress): string {
    return getAddressText(address, 'id')
        || getAddressText(address, 'uuid')
        || getAddressText(address, 'addressId');
}

function isDefaultAddress(address: UserCenterAddress): boolean {
    return getAddressBoolean(address, 'isDefault');
}

function formatDateTime(value: unknown): string {
    const text = safeString(value);
    if (!text) {
        return '--';
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
        return text;
    }
    return parsed.toLocaleString();
}

function pickHistoryTime(item: Record<string, unknown>): string {
    return safeString(item.createdAt) || safeString(item.updatedAt) || safeString(item.timestamp) || safeString(item.time);
}

function toHistoryRows(content: Record<string, unknown>[] | undefined, fallbackLabel: string): HistoryRow[] {
    if (!Array.isArray(content)) {
        return [];
    }
    return content.slice(0, HISTORY_PAGE_SIZE).map((item, index) => {
        const title = safeString(item.title)
            || safeString(item.event)
            || safeString(item.type)
            || safeString(item.action)
            || fallbackLabel;
        const location = safeString(item.location) || safeString(item.ip) || safeString(item.device) || safeString(item.platform);
        const detail = location || safeString(item.status) || safeString(item.result) || '--';
        const identifier = safeString(item.id) || safeString(item.recordId) || `${fallbackLabel}-${index + 1}`;
        return {
            id: identifier,
            title,
            timeText: formatDateTime(pickHistoryTime(item)),
            detail,
        };
    });
}

function emptyAddressForm(): AddressFormState {
    return {
        name: '',
        phone: '',
        provinceCode: '',
        cityCode: '',
        districtCode: '',
        addressDetail: '',
        isDefault: false,
    };
}

function emptyAccountBindingDraft(): AccountBindingDraft {
    return {
        email: '',
        emailCode: '',
        phone: '',
        phoneCode: '',
        wechatCode: '',
        wechatUserId: '',
        qqCode: '',
        qqUserId: '',
    };
}

function formatAddress(address: UserCenterAddress): string {
    const prefix = [
        getAddressText(address, 'provinceCode'),
        getAddressText(address, 'cityCode'),
        getAddressText(address, 'districtCode'),
    ]
        .map((item) => item.trim())
        .filter(Boolean)
        .join(' ');
    const detail = (getAddressText(address, 'addressDetail') || getAddressText(address, 'fullAddress')).trim();
    return [prefix, detail].filter(Boolean).join(' ').trim() || '--';
}

function defaultUserSettingsDraft(): UserSettingsDraft {
    return {
        theme: 'system',
        language: 'zh-CN',
        autoPlay: true,
        highQuality: true,
        dataSaver: false,
        notificationSettings: {
            system: true,
            message: true,
            activity: true,
            promotion: false,
            sound: true,
            vibration: true,
        },
        privacySettings: {
            publicProfile: true,
            allowSearch: true,
            allowFriendRequest: true,
        },
    };
}

function toUserSettingsDraft(value: UserCenterSettings | null): UserSettingsDraft {
    const defaults = defaultUserSettingsDraft();
    if (!value) {
        return defaults;
    }
    const record = asRecord(value);
    const notificationRecord = asRecord(record.notificationSettings);
    const privacyRecord = asRecord(record.privacySettings);
    return {
        theme: readRecordText(record, 'theme') || defaults.theme,
        language: readRecordText(record, 'language') || defaults.language,
        autoPlay: readRecordBoolean(record, 'autoPlay') ?? defaults.autoPlay,
        highQuality: readRecordBoolean(record, 'highQuality') ?? defaults.highQuality,
        dataSaver: readRecordBoolean(record, 'dataSaver') ?? defaults.dataSaver,
        notificationSettings: {
            system: readRecordBoolean(notificationRecord, 'system') ?? defaults.notificationSettings.system,
            message: readRecordBoolean(notificationRecord, 'message') ?? defaults.notificationSettings.message,
            activity: readRecordBoolean(notificationRecord, 'activity') ?? defaults.notificationSettings.activity,
            promotion: readRecordBoolean(notificationRecord, 'promotion') ?? defaults.notificationSettings.promotion,
            sound: readRecordBoolean(notificationRecord, 'sound') ?? defaults.notificationSettings.sound,
            vibration: readRecordBoolean(notificationRecord, 'vibration') ?? defaults.notificationSettings.vibration,
        },
        privacySettings: {
            publicProfile: readRecordBoolean(privacyRecord, 'publicProfile') ?? defaults.privacySettings.publicProfile,
            allowSearch: readRecordBoolean(privacyRecord, 'allowSearch') ?? defaults.privacySettings.allowSearch,
            allowFriendRequest: readRecordBoolean(privacyRecord, 'allowFriendRequest') ?? defaults.privacySettings.allowFriendRequest,
        },
    };
}

function toUserSettingsPayload(draft: UserSettingsDraft): UserCenterUpdateSettingsInput {
    return {
        theme: draft.theme,
        language: draft.language,
        autoPlay: draft.autoPlay,
        highQuality: draft.highQuality,
        dataSaver: draft.dataSaver,
        notificationSettings: { ...draft.notificationSettings },
        privacySettings: { ...draft.privacySettings },
    };
}

function resolveErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function buildProfileSnapshot(profile: UserCenterProfile): ProfileSnapshot {
    return {
        nickname: (profile.nickname || '').trim(),
        region: (profile.region || '').trim(),
        bio: (profile.bio || '').trim(),
    };
}

function isAddressPhoneValid(phone: string): boolean {
    return /^[0-9+\-()\s]{6,24}$/.test(phone);
}

function areSettingsDraftEqual(left: UserSettingsDraft, right: UserSettingsDraft): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function isAddressFormDirty(form: AddressFormState): boolean {
    return form.name.trim().length > 0
        || form.phone.trim().length > 0
        || form.provinceCode.trim().length > 0
        || form.cityCode.trim().length > 0
        || form.districtCode.trim().length > 0
        || form.addressDetail.trim().length > 0
        || form.isDefault;
}

interface PasswordStrength {
    score: number;
    label: string;
    hint: string;
}

function getPasswordStrength(password: string): PasswordStrength {
    const text = password.trim();
    if (!text) {
        return { score: 0, label: 'Not set', hint: 'Use 8+ chars with mixed character types.' };
    }

    let score = 0;
    if (text.length >= 8) score += 1;
    if (/[A-Z]/.test(text) && /[a-z]/.test(text)) score += 1;
    if (/\d/.test(text)) score += 1;
    if (/[^A-Za-z0-9]/.test(text) || text.length >= 12) score += 1;

    if (score <= 1) {
        return { score, label: 'Weak', hint: 'Add uppercase, numbers, and symbols.' };
    }
    if (score === 2) {
        return { score, label: 'Fair', hint: 'Add one more character type for better security.' };
    }
    if (score === 3) {
        return { score, label: 'Strong', hint: 'Good. Consider using 12+ characters.' };
    }
    return { score, label: 'Very strong', hint: 'Excellent password strength.' };
}

interface StatCardProps {
    title: string;
    value: string;
    hint: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, hint }) => (
    <div className="rounded-xl border border-[#27272a] bg-[#1e1e20] px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-[#6b7280]">{title}</div>
        <div className="mt-1 text-xl font-semibold text-[#ffffff]">{value}</div>
        <div className="mt-1 text-xs text-[#9ca3af]">{hint}</div>
    </div>
);

interface ToggleCardProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ label, description, checked, onChange }) => (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2.5">
        <div>
            <div className="text-sm text-[#e5e7eb]">{label}</div>
            <div className="text-xs text-[#9ca3af]">{description}</div>
        </div>
        <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-[#2563eb]"
        />
    </label>
);

interface HistoryPanelProps {
    title: string;
    rows: HistoryRow[];
    emptyText: string;
    keyPrefix: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ title, rows, emptyText, keyPrefix }) => (
    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
        <h4 className="text-sm font-semibold text-[#d1d5db]">{title}</h4>
        <div className="mt-3 space-y-2.5">
            {rows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#27272a] px-3 py-4 text-xs text-[#9ca3af]">{emptyText}</div>
            ) : rows.map((item) => (
                <div key={`${keyPrefix}-${item.id}`} className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2.5">
                    <div className="text-xs font-medium text-[#e5e7eb]">{item.title}</div>
                    <div className="mt-1 text-[11px] text-[#9ca3af]">{item.timeText}</div>
                    <div className="mt-0.5 text-[11px] text-[#6b7280]">{item.detail}</div>
                </div>
            ))}
        </div>
    </div>
);

export const ProfilePage: React.FC = () => {
    const { user } = useAuthStore();
    const { goBack, navigate } = useRouter();
    const [profile, setProfile] = useState<UserCenterProfile | null>(null);
    const [nickname, setNickname] = useState('');
    const [region, setRegion] = useState('');
    const [bio, setBio] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [activeSection, setActiveSection] = useState<ProfileSectionKey>('overview');
    const [profileSnapshot, setProfileSnapshot] = useState<ProfileSnapshot>({
        nickname: '',
        region: '',
        bio: '',
    });
    const [addresses, setAddresses] = useState<UserCenterAddress[]>([]);
    const [addressLoading, setAddressLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string>('');
    const [addressForm, setAddressForm] = useState<AddressFormState>(() => emptyAddressForm());
    const [loginHistory, setLoginHistory] = useState<HistoryRow[]>([]);
    const [generationHistory, setGenerationHistory] = useState<HistoryRow[]>([]);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsDraft, setSettingsDraft] = useState<UserSettingsDraft>(() => defaultUserSettingsDraft());
    const [settingsSnapshot, setSettingsSnapshot] = useState<UserSettingsDraft>(() => defaultUserSettingsDraft());
    const [bindingDraft, setBindingDraft] = useState<AccountBindingDraft>(() => emptyAccountBindingDraft());
    const [bindingSaving, setBindingSaving] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [contacts, setContacts] = useState<SocialContact[]>([]);
    const [friendRequests, setFriendRequests] = useState<SocialFriendRequest[]>([]);
    const [contactStats, setContactStats] = useState<SocialContactStats | null>(null);
    const [contactKeyword, setContactKeyword] = useState('');
    const [socialActionKey, setSocialActionKey] = useState<string>('');

    const fallbackProfile = useMemo<UserCenterProfile>(() => ({
        userId: user?.id || 'current-user',
        nickname: user?.name || 'User',
        email: user?.email,
        phone: user?.phone,
        avatar: user?.avatar,
    }), [user]);

    const displayProfile = profile || fallbackProfile;

    const loadAddressAndHistory = useCallback(async () => {
        setAddressLoading(true);
        setHistoryLoading(true);
        setSettingsLoading(true);
        try {
            const [addressResult, loginResult, generationResult, settingsResult] = await Promise.allSettled([
                userBusinessService.listUserAddresses(),
                userBusinessService.getLoginHistory({ page: 0, size: HISTORY_PAGE_SIZE }),
                userBusinessService.getGenerationHistory({ page: 0, size: HISTORY_PAGE_SIZE }),
                userBusinessService.getUserSettings(),
            ]);

            const errors: string[] = [];

            if (addressResult.status === 'fulfilled') {
                setAddresses(addressResult.value);
            } else {
                errors.push(resolveErrorMessage(addressResult.reason, 'Failed to load addresses'));
            }

            if (loginResult.status === 'fulfilled') {
                const page = asRecord(loginResult.value);
                const content = Array.isArray(page.content) ? (page.content as Record<string, unknown>[]) : undefined;
                setLoginHistory(toHistoryRows(content, 'Login'));
            } else {
                errors.push(resolveErrorMessage(loginResult.reason, 'Failed to load login history'));
            }

            if (generationResult.status === 'fulfilled') {
                const page = asRecord(generationResult.value);
                const content = Array.isArray(page.content) ? (page.content as Record<string, unknown>[]) : undefined;
                setGenerationHistory(toHistoryRows(content, 'Generation'));
            } else {
                errors.push(resolveErrorMessage(generationResult.reason, 'Failed to load generation history'));
            }

            if (settingsResult.status === 'fulfilled') {
                const nextDraft = toUserSettingsDraft(settingsResult.value);
                setSettingsDraft(nextDraft);
                setSettingsSnapshot(nextDraft);
            } else {
                errors.push(resolveErrorMessage(settingsResult.reason, 'Failed to load user settings'));
            }

            if (errors.length > 0) {
                setFeedback({ type: 'error', text: errors.join(' | ') });
            }
        } finally {
            setAddressLoading(false);
            setHistoryLoading(false);
            setSettingsLoading(false);
        }
    }, []);

    const loadContactsData = useCallback(async (keyword?: string) => {
        setContactsLoading(true);
        try {
            const [statsResult, contactsResult, requestsResult] = await Promise.allSettled([
                userBusinessService.getContactStats(),
                userBusinessService.listContacts({ keyword: (keyword || '').trim() || undefined }),
                userBusinessService.listFriendRequests(),
            ]);

            const errors: string[] = [];

            if (statsResult.status === 'fulfilled') {
                setContactStats(statsResult.value);
            } else {
                errors.push(resolveErrorMessage(statsResult.reason, 'Failed to load contact stats'));
            }

            if (contactsResult.status === 'fulfilled') {
                setContacts(contactsResult.value);
            } else {
                errors.push(resolveErrorMessage(contactsResult.reason, 'Failed to load contacts'));
            }

            if (requestsResult.status === 'fulfilled') {
                setFriendRequests(requestsResult.value);
            } else {
                errors.push(resolveErrorMessage(requestsResult.reason, 'Failed to load friend requests'));
            }

            if (errors.length > 0) {
                setFeedback({ type: 'error', text: errors.join(' | ') });
            }
        } finally {
            setContactsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadProfile = async () => {
            setLoading(true);
            try {
                const remoteProfile = await userBusinessService.getUserProfile();
                const next = remoteProfile || fallbackProfile;
                if (!cancelled) {
                    setProfile(next);
                    setNickname(next.nickname || '');
                    setRegion(next.region || '');
                    setBio(next.bio || '');
                    setProfileSnapshot(buildProfileSnapshot(next));
                    setBindingDraft((prev) => ({
                        ...prev,
                        email: (next.email || '').trim(),
                        phone: (next.phone || '').trim(),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    const next = fallbackProfile;
                    setProfile(next);
                    setNickname(next.nickname || '');
                    setRegion(next.region || '');
                    setBio(next.bio || '');
                    setProfileSnapshot(buildProfileSnapshot(next));
                    setBindingDraft((prev) => ({
                        ...prev,
                        email: (next.email || '').trim(),
                        phone: (next.phone || '').trim(),
                    }));
                    setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to load profile') });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void loadProfile();
        void loadAddressAndHistory();
        void loadContactsData();
        return () => {
            cancelled = true;
        };
    }, [fallbackProfile, loadAddressAndHistory, loadContactsData]);

    const resetAddressEditor = () => {
        setEditingAddressId('');
        setAddressForm(emptyAddressForm());
    };

    const hasProfileChanges = useMemo(() => {
        return nickname.trim() !== profileSnapshot.nickname
            || region.trim() !== profileSnapshot.region
            || bio.trim() !== profileSnapshot.bio;
    }, [bio, nickname, profileSnapshot.bio, profileSnapshot.nickname, profileSnapshot.region, region]);

    const hasSettingsChanges = useMemo(() => !areSettingsDraftEqual(settingsDraft, settingsSnapshot), [settingsDraft, settingsSnapshot]);
    const hasAddressDraftChanges = useMemo(
        () => !!editingAddressId || isAddressFormDirty(addressForm),
        [addressForm, editingAddressId],
    );

    const isRefreshing = addressLoading || historyLoading || settingsLoading || contactsLoading;
    const handleBack = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length <= 1) {
            navigate(ROUTES.PORTAL_VIDEO);
            return;
        }
        goBack();
    }, [goBack, navigate]);

    const profileCompletion = useMemo(() => {
        const fields = [
            nickname.trim(),
            region.trim(),
            bio.trim(),
            (displayProfile.email || '').trim(),
            (displayProfile.phone || '').trim(),
        ];
        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
    }, [bio, displayProfile.email, displayProfile.phone, nickname, region]);

    const securityScore = useMemo(() => {
        let score = 55;
        if ((displayProfile.email || '').trim()) {
            score += 15;
        }
        if ((displayProfile.phone || '').trim()) {
            score += 15;
        }
        if (loginHistory.length > 0) {
            score += 15;
        }
        return Math.min(score, 100);
    }, [displayProfile.email, displayProfile.phone, loginHistory.length]);

    const defaultAddress = useMemo(() => addresses.find((item) => isDefaultAddress(item)) || null, [addresses]);
    const activityCountText = `${loginHistory.length + generationHistory.length}`;
    const pendingFriendRequests = useMemo(
        () => friendRequests.filter((item) => (safeString(item.status) || '').toLowerCase() === 'pending'),
        [friendRequests],
    );
    const contactTotalCount = Number(contactStats?.total || contacts.length || 0);
    const contactOnlineCount = Number(contactStats?.online || contacts.filter((item) => !!item.isOnline).length || 0);
    const contactNewTodayCount = Number(contactStats?.newToday || pendingFriendRequests.length || 0);
    const passwordEditing = !!oldPassword || !!newPassword || !!confirmPassword;
    const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
    const hasAnyPendingChanges = hasProfileChanges || hasSettingsChanges || passwordEditing || hasAddressDraftChanges;

    const isSectionDirty = useCallback((section: ProfileSectionKey): boolean => {
        if (section === 'overview') return hasProfileChanges;
        if (section === 'security') return passwordEditing;
        if (section === 'addresses') return hasAddressDraftChanges;
        if (section === 'contacts') return false;
        if (section === 'preferences') return hasSettingsChanges;
        return false;
    }, [hasAddressDraftChanges, hasProfileChanges, hasSettingsChanges, passwordEditing]);

    const currentSectionDirty = isSectionDirty(activeSection);

    const currentSectionStatusText = useMemo(() => {
        if (!currentSectionDirty) {
            return 'No pending changes in this section.';
        }
        if (activeSection === 'overview') return 'Profile fields changed and not saved.';
        if (activeSection === 'security') return 'Password inputs are not submitted yet.';
        if (activeSection === 'addresses') return 'Address form has unsaved changes.';
        if (activeSection === 'contacts') return 'Contacts section is synchronized with server.';
        if (activeSection === 'preferences') return 'Preference updates are not saved.';
        return 'Unsaved changes detected.';
    }, [activeSection, currentSectionDirty]);

    useEffect(() => {
        if (!hasAnyPendingChanges) {
            return;
        }
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasAnyPendingChanges]);

    const handleSectionChange = useCallback((nextSection: ProfileSectionKey) => {
        if (nextSection === activeSection) {
            return;
        }
        if (currentSectionDirty) {
            const confirmed = window.confirm('Current section has unsaved changes. Leave this section anyway?');
            if (!confirmed) {
                return;
            }
        }
        setActiveSection(nextSection);
    }, [activeSection, currentSectionDirty]);

    const handleDiscardCurrentSectionChanges = useCallback(() => {
        if (!currentSectionDirty) {
            return;
        }

        if (activeSection === 'overview') {
            setNickname(profileSnapshot.nickname);
            setRegion(profileSnapshot.region);
            setBio(profileSnapshot.bio);
            setFeedback({ type: 'success', text: 'Profile draft reset.' });
            return;
        }

        if (activeSection === 'security') {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setFeedback({ type: 'success', text: 'Password inputs cleared.' });
            return;
        }

        if (activeSection === 'addresses') {
            resetAddressEditor();
            setFeedback({ type: 'success', text: 'Address editor reset.' });
            return;
        }

        if (activeSection === 'preferences') {
            setSettingsDraft(settingsSnapshot);
            setFeedback({ type: 'success', text: 'Preference draft reset.' });
        }
    }, [activeSection, currentSectionDirty, profileSnapshot.bio, profileSnapshot.nickname, profileSnapshot.region, settingsSnapshot]);

    const handleSaveProfile = async () => {
        const nextNickname = nickname.trim();
        if (nextNickname && nextNickname.length < 2) {
            setFeedback({ type: 'error', text: 'Nickname should contain at least 2 characters.' });
            return;
        }
        if (bio.trim().length > 200) {
            setFeedback({ type: 'error', text: 'Bio should be within 200 characters.' });
            return;
        }
        if (!hasProfileChanges) {
            setFeedback({ type: 'success', text: 'No profile changes to save.' });
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            const updated = await userBusinessService.updateUserProfile({
                nickname: nextNickname || undefined,
                region: region.trim() || undefined,
                bio: bio.trim() || undefined,
            });
            setProfile(updated);
            setProfileSnapshot(buildProfileSnapshot(updated));
            setFeedback({ type: 'success', text: 'Profile updated successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to update profile') });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setFeedback({ type: 'error', text: 'Please fill all password fields.' });
            return;
        }
        if (newPassword.length < 8) {
            setFeedback({ type: 'error', text: 'New password should contain at least 8 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setFeedback({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            await userBusinessService.changePassword({
                oldPassword,
                newPassword,
                confirmPassword,
            });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setFeedback({ type: 'success', text: 'Password changed successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to change password') });
        } finally {
            setSaving(false);
        }
    };

    const applyBoundProfile = (next: UserCenterProfile) => {
        setProfile(next);
        setBindingDraft((prev) => ({
            ...prev,
            email: (next.email || '').trim(),
            phone: (next.phone || '').trim(),
        }));
    };

    const handleBindEmail = async () => {
        const email = bindingDraft.email.trim();
        if (!email) {
            setFeedback({ type: 'error', text: 'Please enter an email.' });
            return;
        }
        setBindingSaving(true);
        setFeedback(null);
        try {
            const updated = await userBusinessService.bindEmail(email, bindingDraft.emailCode.trim() || undefined);
            applyBoundProfile(updated);
            setBindingDraft((prev) => ({ ...prev, emailCode: '' }));
            setFeedback({ type: 'success', text: 'Email bound successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to bind email') });
        } finally {
            setBindingSaving(false);
        }
    };

    const handleUnbindEmail = async () => {
        setBindingSaving(true);
        setFeedback(null);
        try {
            const updated = await userBusinessService.unbindEmail();
            applyBoundProfile(updated);
            setBindingDraft((prev) => ({ ...prev, emailCode: '' }));
            setFeedback({ type: 'success', text: 'Email unbound successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to unbind email') });
        } finally {
            setBindingSaving(false);
        }
    };

    const handleBindPhone = async () => {
        const phone = bindingDraft.phone.trim();
        if (!phone) {
            setFeedback({ type: 'error', text: 'Please enter a phone number.' });
            return;
        }
        setBindingSaving(true);
        setFeedback(null);
        try {
            const updated = await userBusinessService.bindPhone(phone, bindingDraft.phoneCode.trim() || undefined);
            applyBoundProfile(updated);
            setBindingDraft((prev) => ({ ...prev, phoneCode: '' }));
            setFeedback({ type: 'success', text: 'Phone bound successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to bind phone') });
        } finally {
            setBindingSaving(false);
        }
    };

    const handleUnbindPhone = async () => {
        setBindingSaving(true);
        setFeedback(null);
        try {
            const updated = await userBusinessService.unbindPhone();
            applyBoundProfile(updated);
            setBindingDraft((prev) => ({ ...prev, phoneCode: '' }));
            setFeedback({ type: 'success', text: 'Phone unbound successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to unbind phone') });
        } finally {
            setBindingSaving(false);
        }
    };

    const handleBindSocial = async (platform: 'wechat' | 'qq') => {
        const code = platform === 'wechat' ? bindingDraft.wechatCode.trim() : bindingDraft.qqCode.trim();
        const thirdPartyUserId = platform === 'wechat'
            ? bindingDraft.wechatUserId.trim()
            : bindingDraft.qqUserId.trim();
        if (!code && !thirdPartyUserId) {
            setFeedback({ type: 'error', text: `Please provide ${platform.toUpperCase()} code or user ID.` });
            return;
        }
        setBindingSaving(true);
        setFeedback(null);
        try {
            await userBusinessService.bindThirdParty(platform, {
                code: code || undefined,
                thirdPartyUserId: thirdPartyUserId || undefined,
            });
            if (platform === 'wechat') {
                setBindingDraft((prev) => ({ ...prev, wechatCode: '', wechatUserId: '' }));
            } else {
                setBindingDraft((prev) => ({ ...prev, qqCode: '', qqUserId: '' }));
            }
            setFeedback({ type: 'success', text: `${platform.toUpperCase()} account bound.` });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, `Failed to bind ${platform.toUpperCase()} account`) });
        } finally {
            setBindingSaving(false);
        }
    };

    const handleUnbindSocial = async (platform: 'wechat' | 'qq') => {
        setBindingSaving(true);
        setFeedback(null);
        try {
            await userBusinessService.unbindThirdParty(platform);
            setFeedback({ type: 'success', text: `${platform.toUpperCase()} account unbound.` });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, `Failed to unbind ${platform.toUpperCase()} account`) });
        } finally {
            setBindingSaving(false);
        }
    };

    const handleEditAddress = (address: UserCenterAddress) => {
        setEditingAddressId(getAddressId(address));
        setAddressForm({
            name: getAddressText(address, 'name'),
            phone: getAddressText(address, 'phone'),
            provinceCode: getAddressText(address, 'provinceCode'),
            cityCode: getAddressText(address, 'cityCode'),
            districtCode: getAddressText(address, 'districtCode'),
            addressDetail: getAddressText(address, 'addressDetail'),
            isDefault: isDefaultAddress(address),
        });
    };

    const handleSaveAddress = async () => {
        const name = addressForm.name.trim();
        const phone = addressForm.phone.trim();
        const addressDetail = addressForm.addressDetail.trim();
        if (!name || !phone || !addressDetail) {
            setFeedback({ type: 'error', text: 'Name, phone and address detail are required.' });
            return;
        }
        if (name.length < 2) {
            setFeedback({ type: 'error', text: 'Contact name should contain at least 2 characters.' });
            return;
        }
        if (!isAddressPhoneValid(phone)) {
            setFeedback({ type: 'error', text: 'Invalid phone number format.' });
            return;
        }
        if (addressDetail.length < 5) {
            setFeedback({ type: 'error', text: 'Address detail should contain at least 5 characters.' });
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            const payload = {
                name,
                phone,
                countryCode: 'CN',
                provinceCode: addressForm.provinceCode.trim() || undefined,
                cityCode: addressForm.cityCode.trim() || undefined,
                districtCode: addressForm.districtCode.trim() || undefined,
                addressDetail,
                isDefault: addressForm.isDefault,
            };

            const isEditing = !!editingAddressId;
            if (isEditing) {
                await userBusinessService.updateAddress(editingAddressId, payload);
            } else {
                await userBusinessService.createAddress(payload);
            }
            await loadAddressAndHistory();
            resetAddressEditor();
            setFeedback({ type: 'success', text: isEditing ? 'Address updated successfully.' : 'Address created successfully.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to save address') });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId: string | number | undefined) => {
        if (addressId === undefined || addressId === null) {
            return;
        }
        const confirmed = window.confirm('Delete this address?');
        if (!confirmed) {
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            await userBusinessService.deleteAddress(addressId);
            await loadAddressAndHistory();
            if (editingAddressId && editingAddressId === String(addressId)) {
                resetAddressEditor();
            }
            setFeedback({ type: 'success', text: 'Address deleted.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to delete address') });
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultAddress = async (addressId: string | number | undefined) => {
        if (addressId === undefined || addressId === null) {
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            await userBusinessService.setDefaultAddress(addressId);
            await loadAddressAndHistory();
            setFeedback({ type: 'success', text: 'Default address updated.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to set default address') });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUserSettings = async () => {
        if (!hasSettingsChanges) {
            setFeedback({ type: 'success', text: 'No user setting changes to save.' });
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            const updated = await userBusinessService.updateUserSettings(toUserSettingsPayload(settingsDraft));
            const nextDraft = toUserSettingsDraft(updated);
            setSettingsDraft(nextDraft);
            setSettingsSnapshot(nextDraft);
            setFeedback({ type: 'success', text: 'User settings updated.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to update user settings') });
        } finally {
            setSaving(false);
        }
    };

    const handleRefreshContacts = async () => {
        await loadContactsData(contactKeyword);
    };

    const handleProcessFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
        if (!requestId) {
            return;
        }
        setSocialActionKey(`${action}-${requestId}`);
        try {
            await userBusinessService.processFriendRequest(requestId, action);
            await loadContactsData(contactKeyword);
            setFeedback({
                type: 'success',
                text: action === 'accept' ? 'Friend request accepted.' : 'Friend request rejected.',
            });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, `Failed to ${action} friend request`) });
        } finally {
            setSocialActionKey('');
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        if (!contactId) {
            return;
        }
        const confirmed = window.confirm('Delete this contact?');
        if (!confirmed) {
            return;
        }
        setSocialActionKey(`delete-${contactId}`);
        try {
            await userBusinessService.deleteContact(contactId);
            await loadContactsData(contactKeyword);
            setFeedback({ type: 'success', text: 'Contact deleted.' });
        } catch (error) {
            setFeedback({ type: 'error', text: resolveErrorMessage(error, 'Failed to delete contact') });
        } finally {
            setSocialActionKey('');
        }
    };

    const handleQuickSave = () => {
        if (activeSection === 'overview') {
            void handleSaveProfile();
            return;
        }
        if (activeSection === 'security') {
            void handleChangePassword();
            return;
        }
        if (activeSection === 'addresses') {
            void handleSaveAddress();
            return;
        }
        if (activeSection === 'contacts') {
            void handleRefreshContacts();
            return;
        }
        if (activeSection === 'preferences') {
            void handleSaveUserSettings();
        }
    };

    const quickSaveButtonLabel = (() => {
        if (activeSection === 'overview') return 'Save Profile';
        if (activeSection === 'security') return 'Update Password';
        if (activeSection === 'addresses') return editingAddressId ? 'Update Address' : 'Add Address';
        if (activeSection === 'contacts') return 'Refresh Contacts';
        if (activeSection === 'preferences') return 'Save Preferences';
        return 'Save';
    })();

    const isPermissionOrAuthError = feedback?.type === 'error'
        && /(permission|unauthorized|forbidden|unauthenticated|not login|not logged in|\u672a\u767b\u5f55|\u65e0\u6743\u9650|\u6743\u9650\u4e0d\u8db3|\u672a\u6388\u6743|\u7981\u6b62\u8bbf\u95ee)/i.test(feedback.text);

    const feedbackClassName = feedback?.type === 'success'
        ? 'border-[#2563eb]/40 bg-[#2563eb]/10 text-[#d1d5db]'
        : isPermissionOrAuthError
            ? 'border-red-500/50 bg-red-500/15 text-red-100'
            : 'border-red-500/40 bg-red-500/10 text-red-200';

    return (
        <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8 md:py-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-2xl border border-[#27272a] bg-[#1e1e20]/95 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1c] text-[#d1d5db]">
                                <User size={30} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-[#ffffff]">{displayProfile.nickname || 'User'}</h1>
                                <p className="mt-1 text-sm text-[#9ca3af]">{displayProfile.email || 'No email bound'}</p>
                                <p className="text-xs text-[#6b7280]">{displayProfile.phone || 'No phone bound'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-4 text-sm text-[#d1d5db] transition hover:bg-[#27272a]"
                            >
                                <ArrowLeft size={15} />
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void loadAddressAndHistory();
                                    void loadContactsData(contactKeyword);
                                }}
                                disabled={isRefreshing}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-4 text-sm text-[#d1d5db] transition hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatCard title="Profile Completion" value={`${profileCompletion}%`} hint="Complete key fields to improve recommendations." />
                        <StatCard
                            title="Address Book"
                            value={`${addresses.length}`}
                            hint={defaultAddress ? `Default: ${getAddressText(defaultAddress, 'name') || 'Set'}` : 'No default address yet.'}
                        />
                        <StatCard title="Recent Activity" value={activityCountText} hint="Combined login and generation records." />
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                            <span>Profile progress</span>
                            <span>{profileCompletion}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#27272a]">
                            <div className="h-full rounded-full bg-[#2563eb] transition-all" style={{ width: `${profileCompletion}%` }} />
                        </div>
                    </div>
                </div>

                {feedback ? (
                    <div className={`rounded-xl border px-4 py-3 text-sm ${feedbackClassName}`}>
                        {feedback.text}
                    </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="rounded-2xl border border-[#1a1a1c] bg-[#050505] p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d1d5db]">
                            <LayoutGrid size={16} />
                            Account Navigation
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
                            {PROFILE_SECTION_ITEMS.map((item) => {
                                const active = item.key === activeSection;
                                const hasPending = isSectionDirty(item.key);
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => handleSectionChange(item.key)}
                                        className={`min-w-[180px] rounded-xl border px-3 py-3 text-left transition lg:w-full ${
                                            active
                                                ? 'border-white/10 bg-[#1e1e20] text-[#e5e7eb]'
                                                : 'border-[#27272a] bg-[#1a1a1c] text-[#d1d5db] hover:border-[#27272a] hover:bg-[#1a1a1c]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <Icon size={16} className={active ? 'text-[#2563eb]' : 'text-[#6b7280]'} />
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                                    <span>{item.title}</span>
                                                    {hasPending ? (
                                                        <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                                                    ) : null}
                                                </div>
                                                <div className="mt-1 text-[11px] leading-4 text-[#6b7280]">{item.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <section className="rounded-2xl border border-[#1a1a1c] bg-[#050505] p-4 md:p-5">
                        {loading ? (
                            <div className="rounded-xl border border-dashed border-[#27272a] bg-[#1a1a1c] px-4 py-8 text-center text-sm text-[#9ca3af]">
                                Loading profile...
                            </div>
                        ) : null}

                        {!loading ? (
                            <div className="mb-4 rounded-xl border border-[#27272a] bg-[#1a1a1c] px-3 py-3">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="text-xs text-[#9ca3af]">{currentSectionStatusText}</div>
                                        {hasAnyPendingChanges ? (
                                            <div className="mt-1 text-[11px] text-[#d1d5db]">Unsaved changes exist in your account center.</div>
                                        ) : (
                                            <div className="mt-1 text-[11px] text-[#9ca3af]">All sections are synchronized.</div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={handleQuickSave}
                                            disabled={
                                                saving
                                                || activeSection === 'activity'
                                                || (activeSection !== 'contacts' && !currentSectionDirty)
                                            }
                                            className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : quickSaveButtonLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDiscardCurrentSectionChanges}
                                            disabled={saving || !currentSectionDirty}
                                            className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-1.5 text-xs text-[#d1d5db] transition hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Discard Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!loading && activeSection === 'overview' ? (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#ffffff]">Profile Overview</h2>
                                    <span className="text-xs text-[#9ca3af]">{hasProfileChanges ? 'Unsaved profile changes' : 'All profile changes saved'}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] px-3 py-3">
                                        <div className="mb-2 inline-flex items-center gap-2 text-xs text-[#9ca3af]">
                                            <Mail size={14} />
                                            Email
                                        </div>
                                        <div className="text-sm text-[#ffffff]">{displayProfile.email || 'Not bound'}</div>
                                    </div>
                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] px-3 py-3">
                                        <div className="mb-2 inline-flex items-center gap-2 text-xs text-[#9ca3af]">
                                            <Phone size={14} />
                                            Phone
                                        </div>
                                        <div className="text-sm text-[#ffffff]">{displayProfile.phone || 'Not bound'}</div>
                                    </div>
                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] px-3 py-3">
                                        <div className="mb-2 inline-flex items-center gap-2 text-xs text-[#9ca3af]">
                                            <MapPin size={14} />
                                            Region
                                        </div>
                                        <div className="text-sm text-[#ffffff]">{region.trim() || 'Not set'}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                    <h3 className="text-sm font-semibold text-[#d1d5db]">Edit Basic Information</h3>
                                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <label className="text-xs text-[#9ca3af]">
                                            Nickname
                                            <input
                                                value={nickname}
                                                onChange={(event) => setNickname(event.target.value)}
                                                className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                placeholder="Your nickname"
                                            />
                                            {nickname.trim().length > 0 && nickname.trim().length < 2 ? (
                                                <div className="mt-1 text-[11px] text-[#d1d5db]">Use at least 2 characters.</div>
                                            ) : null}
                                        </label>
                                        <label className="text-xs text-[#9ca3af]">
                                            Region
                                            <input
                                                value={region}
                                                onChange={(event) => setRegion(event.target.value)}
                                                className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                placeholder="Your region"
                                            />
                                        </label>
                                    </div>
                                    <label className="mt-3 block text-xs text-[#9ca3af]">
                                        Bio
                                        <textarea
                                            value={bio}
                                            onChange={(event) => setBio(event.target.value)}
                                            className="mt-1 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2 text-sm text-[#ffffff]"
                                            placeholder="Write a short self-introduction"
                                            rows={3}
                                        />
                                        <div className={`mt-1 text-[11px] ${bio.trim().length > 200 ? 'text-[#d1d5db]' : 'text-[#9ca3af]'}`}>
                                            {bio.trim().length}/200
                                        </div>
                                    </label>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSaveProfile}
                                            disabled={saving || !hasProfileChanges}
                                            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save Profile'}
                                        </button>
                                        {!hasProfileChanges ? (
                                            <span className="text-xs text-[#9ca3af]">No pending profile edits</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!loading && activeSection === 'security' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#ffffff]">Security Center</h2>
                                    <span className="text-xs text-[#9ca3af]">{securityScore}/100 security score</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-[#27272a]">
                                    <div className="h-full rounded-full bg-[#2563eb] transition-all" style={{ width: `${securityScore}%` }} />
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-[#2563eb]" />
                                            <h3 className="text-sm font-semibold text-[#d1d5db]">Change Password</h3>
                                        </div>
                                        <div className="space-y-2.5">
                                            <input
                                                type="password"
                                                value={oldPassword}
                                                onChange={(event) => setOldPassword(event.target.value)}
                                                className="h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                placeholder="Current password"
                                            />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(event) => setNewPassword(event.target.value)}
                                                className="h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                placeholder="New password (8+ chars)"
                                            />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                className="h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <div className="mt-3 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2.5">
                                            <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                                                <span>Password Strength</span>
                                                <span>{passwordStrength.label}</span>
                                            </div>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#27272a]">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        passwordStrength.score >= 4
                                                            ? 'bg-[#2563eb]'
                                                            : passwordStrength.score === 3
                                                                ? 'bg-[#3b82f6]'
                                                                : passwordStrength.score === 2
                                                                    ? 'bg-[#6b7280]'
                                                                    : 'bg-[#52525b]'
                                                    }`}
                                                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 text-[11px] text-[#9ca3af]">{passwordStrength.hint}</div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleChangePassword}
                                                disabled={saving}
                                                className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {saving ? 'Submitting...' : 'Update Password'}
                                            </button>
                                            {!passwordEditing ? (
                                                <span className="text-xs text-[#9ca3af]">Password form is idle</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Mail size={16} className="text-[#2563eb]" />
                                            <h3 className="text-sm font-semibold text-[#d1d5db]">Account Binding</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-lg border border-[#27272a] bg-[#1a1a1c] p-3">
                                                <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                                                    <span>Email</span>
                                                    <span>{displayProfile.email || 'Not bound'}</span>
                                                </div>
                                                <div className="mt-2 space-y-2">
                                                    <input
                                                        value={bindingDraft.email}
                                                        onChange={(event) => setBindingDraft((prev) => ({ ...prev, email: event.target.value }))}
                                                        className="h-9 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                        placeholder="Email address"
                                                    />
                                                    <input
                                                        value={bindingDraft.emailCode}
                                                        onChange={(event) => setBindingDraft((prev) => ({ ...prev, emailCode: event.target.value }))}
                                                        className="h-9 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                        placeholder="Verify code (optional)"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleBindEmail()}
                                                            disabled={bindingSaving}
                                                            className="rounded-md bg-[#2563eb] px-3 py-1.5 text-xs text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
                                                        >
                                                            {bindingSaving ? 'Processing...' : 'Bind'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleUnbindEmail()}
                                                            disabled={bindingSaving}
                                                            className="rounded-md border border-[#27272a] px-3 py-1.5 text-xs text-[#d1d5db] transition hover:bg-[#27272a] disabled:opacity-50"
                                                        >
                                                            Unbind
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-[#27272a] bg-[#1a1a1c] p-3">
                                                <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                                                    <span>Phone</span>
                                                    <span>{displayProfile.phone || 'Not bound'}</span>
                                                </div>
                                                <div className="mt-2 space-y-2">
                                                    <input
                                                        value={bindingDraft.phone}
                                                        onChange={(event) => setBindingDraft((prev) => ({ ...prev, phone: event.target.value }))}
                                                        className="h-9 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                        placeholder="Phone number"
                                                    />
                                                    <input
                                                        value={bindingDraft.phoneCode}
                                                        onChange={(event) => setBindingDraft((prev) => ({ ...prev, phoneCode: event.target.value }))}
                                                        className="h-9 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                        placeholder="Verify code (optional)"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleBindPhone()}
                                                            disabled={bindingSaving}
                                                            className="rounded-md bg-[#2563eb] px-3 py-1.5 text-xs text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
                                                        >
                                                            {bindingSaving ? 'Processing...' : 'Bind'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleUnbindPhone()}
                                                            disabled={bindingSaving}
                                                            className="rounded-md border border-[#27272a] px-3 py-1.5 text-xs text-[#d1d5db] transition hover:bg-[#27272a] disabled:opacity-50"
                                                        >
                                                            Unbind
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                                <div className="rounded-lg border border-[#27272a] bg-[#1a1a1c] p-3">
                                                    <div className="text-xs text-[#9ca3af]">WeChat</div>
                                                    <div className="mt-2 space-y-2">
                                                        <input
                                                            value={bindingDraft.wechatCode}
                                                            onChange={(event) => setBindingDraft((prev) => ({ ...prev, wechatCode: event.target.value }))}
                                                            className="h-8 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-2 text-[11px] text-[#ffffff]"
                                                            placeholder="Auth code"
                                                        />
                                                        <input
                                                            value={bindingDraft.wechatUserId}
                                                            onChange={(event) => setBindingDraft((prev) => ({ ...prev, wechatUserId: event.target.value }))}
                                                            className="h-8 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-2 text-[11px] text-[#ffffff]"
                                                            placeholder="Third-party user ID"
                                                        />
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleBindSocial('wechat')}
                                                                disabled={bindingSaving}
                                                                className="rounded-md bg-[#2563eb] px-2 py-1 text-[11px] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                                                            >
                                                                Bind
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleUnbindSocial('wechat')}
                                                                disabled={bindingSaving}
                                                                className="rounded-md border border-[#27272a] px-2 py-1 text-[11px] text-[#d1d5db] hover:bg-[#27272a] disabled:opacity-50"
                                                            >
                                                                Unbind
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border border-[#27272a] bg-[#1a1a1c] p-3">
                                                    <div className="text-xs text-[#9ca3af]">QQ</div>
                                                    <div className="mt-2 space-y-2">
                                                        <input
                                                            value={bindingDraft.qqCode}
                                                            onChange={(event) => setBindingDraft((prev) => ({ ...prev, qqCode: event.target.value }))}
                                                            className="h-8 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-2 text-[11px] text-[#ffffff]"
                                                            placeholder="Auth code"
                                                        />
                                                        <input
                                                            value={bindingDraft.qqUserId}
                                                            onChange={(event) => setBindingDraft((prev) => ({ ...prev, qqUserId: event.target.value }))}
                                                            className="h-8 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-2 text-[11px] text-[#ffffff]"
                                                            placeholder="Third-party user ID"
                                                        />
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleBindSocial('qq')}
                                                                disabled={bindingSaving}
                                                                className="rounded-md bg-[#2563eb] px-2 py-1 text-[11px] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                                                            >
                                                                Bind
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleUnbindSocial('qq')}
                                                                disabled={bindingSaving}
                                                                className="rounded-md border border-[#27272a] px-2 py-1 text-[11px] text-[#d1d5db] hover:bg-[#27272a] disabled:opacity-50"
                                                            >
                                                                Unbind
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <HistoryPanel
                                        title="Login History"
                                        rows={loginHistory}
                                        emptyText="No login records."
                                        keyPrefix="security-login"
                                    />
                                </div>
                            </div>
                        ) : null}

                        {!loading && activeSection === 'addresses' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#ffffff]">Address Management</h2>
                                    <span className="text-xs text-[#9ca3af]">{defaultAddress ? 'Default address configured' : 'No default address yet'}</span>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                        <h3 className="text-sm font-semibold text-[#d1d5db]">{editingAddressId ? 'Edit Address' : 'Add Address'}</h3>
                                        <div className="mt-3 space-y-2.5">
                                            <label className="block text-xs text-[#9ca3af]">
                                                Contact Name
                                                <input
                                                    value={addressForm.name}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, name: event.target.value }))}
                                                    className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                    placeholder="Address contact name"
                                                />
                                            </label>
                                            <label className="block text-xs text-[#9ca3af]">
                                                Phone
                                                <input
                                                    value={addressForm.phone}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))}
                                                    className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                                    placeholder="Address contact phone"
                                                />
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <input
                                                    value={addressForm.provinceCode}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, provinceCode: event.target.value }))}
                                                    className="h-10 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                    placeholder="Province"
                                                />
                                                <input
                                                    value={addressForm.cityCode}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, cityCode: event.target.value }))}
                                                    className="h-10 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                    placeholder="City"
                                                />
                                                <input
                                                    value={addressForm.districtCode}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, districtCode: event.target.value }))}
                                                    className="h-10 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-xs text-[#ffffff]"
                                                    placeholder="District"
                                                />
                                            </div>
                                            <label className="block text-xs text-[#9ca3af]">
                                                Address Detail
                                                <textarea
                                                    value={addressForm.addressDetail}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, addressDetail: event.target.value }))}
                                                    className="mt-1 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2 text-sm text-[#ffffff]"
                                                    placeholder="Street / building / room"
                                                    rows={3}
                                                />
                                            </label>
                                            <label className="inline-flex items-center gap-2 text-xs text-[#9ca3af]">
                                                <input
                                                    type="checkbox"
                                                    checked={addressForm.isDefault}
                                                    onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                                                    className="h-4 w-4 accent-[#2563eb]"
                                                />
                                                Set as default address
                                            </label>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={handleSaveAddress}
                                                disabled={saving}
                                                className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {saving ? 'Submitting...' : editingAddressId ? 'Update Address' : 'Add Address'}
                                            </button>
                                            {editingAddressId ? (
                                                <button
                                                    type="button"
                                                    onClick={resetAddressEditor}
                                                    className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-4 py-2 text-sm text-[#d1d5db] transition hover:bg-[#27272a]"
                                                >
                                                    Cancel Edit
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-[#d1d5db]">Saved Addresses</h3>
                                            {addressLoading ? (
                                                <span className="text-xs text-[#9ca3af]">Loading...</span>
                                            ) : (
                                                <span className="text-xs text-[#9ca3af]">{addresses.length} records</span>
                                            )}
                                        </div>
                                        <div className="space-y-2.5">
                                            {addresses.length === 0 ? (
                                                <div className="rounded-lg border border-dashed border-[#27272a] px-3 py-4 text-xs text-[#9ca3af]">No saved addresses.</div>
                                            ) : addresses.map((address) => (
                                                <div
                                                    key={getAddressId(address) || `${getAddressText(address, 'name')}-${getAddressText(address, 'phone')}`}
                                                    className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2.5"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm text-[#ffffff]">
                                                                {getAddressText(address, 'name') || '--'} {getAddressText(address, 'phone') || '--'}
                                                            </div>
                                                            <div className="mt-1 text-xs text-[#9ca3af]">{formatAddress(address)}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {isDefaultAddress(address) ? (
                                                                <span className="rounded-full bg-[#2563eb]/15 px-2 py-0.5 text-[10px] text-[#d1d5db]">Default</span>
                                                            ) : null}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditAddress(address)}
                                                                className="rounded-md border border-[#27272a] px-2 py-1 text-[11px] text-[#d1d5db] hover:bg-[#27272a]"
                                                            >
                                                                Edit
                                                            </button>
                                                            {!isDefaultAddress(address) ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleSetDefaultAddress(getAddressId(address) || undefined)}
                                                                    className="rounded-md border border-[#2563eb]/40 px-2 py-1 text-[11px] text-[#d1d5db] hover:bg-[#2563eb]/15"
                                                                >
                                                                    Set Default
                                                                </button>
                                                            ) : null}
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDeleteAddress(getAddressId(address) || undefined)}
                                                                className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-[#9ca3af] transition hover:bg-[#27272a] hover:text-[#d1d5db]"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!loading && activeSection === 'contacts' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#ffffff]">Contacts</h2>
                                    <button
                                        type="button"
                                        onClick={() => void handleRefreshContacts()}
                                        disabled={contactsLoading}
                                        className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-1.5 text-xs text-[#d1d5db] transition hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {contactsLoading ? 'Refreshing...' : 'Refresh Contacts'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <StatCard title="Total Contacts" value={`${contactTotalCount}`} hint="Total friend contacts in your account." />
                                    <StatCard title="Online Now" value={`${contactOnlineCount}`} hint="Contacts currently online." />
                                    <StatCard title="New Requests" value={`${contactNewTodayCount}`} hint="Pending requests for your review." />
                                </div>

                                <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-[#d1d5db]">Search Contacts</h3>
                                            <p className="text-xs text-[#9ca3af]">Filter by nickname, username or region.</p>
                                        </div>
                                        <div className="flex w-full gap-2 sm:w-auto">
                                            <input
                                                value={contactKeyword}
                                                onChange={(event) => setContactKeyword(event.target.value)}
                                                className="h-9 flex-1 rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff] sm:w-72"
                                                placeholder="Search keyword"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void handleRefreshContacts()}
                                                disabled={contactsLoading}
                                                className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
                                            >
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-[#d1d5db]">Contact List</h3>
                                            <span className="text-xs text-[#9ca3af]">{contacts.length} records</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {contacts.length === 0 ? (
                                                <div className="rounded-lg border border-dashed border-[#27272a] px-3 py-4 text-xs text-[#9ca3af]">No contacts found.</div>
                                            ) : contacts.map((contact, index) => {
                                                const contactId = safeString(contact.id) || safeString(contact.username) || `contact-${index + 1}`;
                                                const displayName = safeString(contact.remark) || safeString(contact.nickname) || safeString(contact.name) || safeString(contact.username) || '--';
                                                const secondaryName = safeString(contact.username) || safeString(contact.nickname) || '--';
                                                const statusText = safeString(contact.status) || (contact.isOnline ? 'online' : 'offline');
                                                const isActionRunning = socialActionKey === `delete-${contactId}`;
                                                return (
                                                    <div key={contactId} className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2.5">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm text-[#ffffff]">{displayName}</div>
                                                                <div className="mt-1 text-xs text-[#9ca3af]">{secondaryName}</div>
                                                                <div className="mt-0.5 text-[11px] text-[#6b7280]">{safeString(contact.region) || statusText || '--'}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDeleteContact(contactId)}
                                                                disabled={isActionRunning}
                                                                className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-[#9ca3af] transition hover:bg-[#27272a] hover:text-[#d1d5db] disabled:opacity-50"
                                                            >
                                                                {isActionRunning ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[#27272a] bg-[#1a1a1c] p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-[#d1d5db]">Friend Requests</h3>
                                            <span className="text-xs text-[#9ca3af]">{friendRequests.length} records</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {friendRequests.length === 0 ? (
                                                <div className="rounded-lg border border-dashed border-[#27272a] px-3 py-4 text-xs text-[#9ca3af]">No friend requests.</div>
                                            ) : friendRequests.map((request, index) => {
                                                const rawRequestId = safeString(request.id);
                                                const requestId = rawRequestId || `request-${index + 1}`;
                                                const requester = safeString(request.fromName) || safeString(request.fromId) || '--';
                                                const requestStatus = (safeString(request.status) || 'pending').toLowerCase();
                                                const acceptKey = `accept-${requestId}`;
                                                const rejectKey = `reject-${requestId}`;
                                                const isPending = requestStatus === 'pending' && !!rawRequestId;
                                                return (
                                                    <div key={requestId} className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-2.5">
                                                        <div className="text-sm text-[#ffffff]">{requester}</div>
                                                        <div className="mt-1 text-xs text-[#9ca3af]">{safeString(request.message) || '--'}</div>
                                                        <div className="mt-1 text-[11px] text-[#6b7280]">{formatDateTime(request.createdAt)} | {requestStatus.toUpperCase()}</div>
                                                        {isPending ? (
                                                            <div className="mt-2 flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleProcessFriendRequest(rawRequestId, 'accept')}
                                                                    disabled={!rawRequestId || socialActionKey === acceptKey || socialActionKey === rejectKey}
                                                                    className="rounded-md bg-[#2563eb] px-2 py-1 text-[11px] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                                                                >
                                                                    {socialActionKey === acceptKey ? 'Accepting...' : 'Accept'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleProcessFriendRequest(rawRequestId, 'reject')}
                                                                    disabled={!rawRequestId || socialActionKey === acceptKey || socialActionKey === rejectKey}
                                                                    className="rounded-md border border-[#27272a] px-2 py-1 text-[11px] text-[#d1d5db] hover:bg-[#27272a] disabled:opacity-50"
                                                                >
                                                                    {socialActionKey === rejectKey ? 'Rejecting...' : 'Reject'}
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!loading && activeSection === 'preferences' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#ffffff]">User Preferences</h2>
                                    <span className="text-xs text-[#9ca3af]">{hasSettingsChanges ? 'Unsaved preference changes' : 'Preferences are synchronized'}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <label className="text-xs text-[#9ca3af]">
                                        Theme
                                        <select
                                            value={settingsDraft.theme}
                                            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, theme: event.target.value }))}
                                            className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                        >
                                            <option value="system">System</option>
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </label>
                                    <label className="text-xs text-[#9ca3af]">
                                        Language
                                        <select
                                            value={settingsDraft.language}
                                            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, language: event.target.value }))}
                                            className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 text-sm text-[#ffffff]"
                                        >
                                            <option value="zh-CN">Chinese (Simplified)</option>
                                            <option value="en-US">English</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="grid gap-3 xl:grid-cols-3">
                                    <div className="space-y-2.5">
                                        <h3 className="text-sm font-semibold text-[#d1d5db]">Notifications</h3>
                                        <ToggleCard
                                            label="System Notifications"
                                            description="Receive important system updates."
                                            checked={settingsDraft.notificationSettings.system}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                notificationSettings: { ...prev.notificationSettings, system: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Message Notifications"
                                            description="Show notifications for direct messages."
                                            checked={settingsDraft.notificationSettings.message}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                notificationSettings: { ...prev.notificationSettings, message: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Activity Notifications"
                                            description="Keep track of account activity."
                                            checked={settingsDraft.notificationSettings.activity}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                notificationSettings: { ...prev.notificationSettings, activity: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Promotion Notifications"
                                            description="Receive offers and campaign updates."
                                            checked={settingsDraft.notificationSettings.promotion}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                notificationSettings: { ...prev.notificationSettings, promotion: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Sound Alerts"
                                            description="Play sound for incoming notifications."
                                            checked={settingsDraft.notificationSettings.sound}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                notificationSettings: { ...prev.notificationSettings, sound: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Vibration Alerts"
                                            description="Use vibration for key alerts."
                                            checked={settingsDraft.notificationSettings.vibration}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                notificationSettings: { ...prev.notificationSettings, vibration: value },
                                            }))}
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <h3 className="text-sm font-semibold text-[#d1d5db]">Privacy</h3>
                                        <ToggleCard
                                            label="Public Profile"
                                            description="Allow others to view your profile."
                                            checked={settingsDraft.privacySettings.publicProfile}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                privacySettings: { ...prev.privacySettings, publicProfile: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Allow Search"
                                            description="Enable profile discovery in search results."
                                            checked={settingsDraft.privacySettings.allowSearch}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                privacySettings: { ...prev.privacySettings, allowSearch: value },
                                            }))}
                                        />
                                        <ToggleCard
                                            label="Allow Friend Request"
                                            description="Permit new friend requests."
                                            checked={settingsDraft.privacySettings.allowFriendRequest}
                                            onChange={(value) => setSettingsDraft((prev) => ({
                                                ...prev,
                                                privacySettings: { ...prev.privacySettings, allowFriendRequest: value },
                                            }))}
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <h3 className="text-sm font-semibold text-[#d1d5db]">Playback & Data</h3>
                                        <ToggleCard
                                            label="Auto Play"
                                            description="Auto-play generated previews."
                                            checked={settingsDraft.autoPlay}
                                            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, autoPlay: value }))}
                                        />
                                        <ToggleCard
                                            label="High Quality"
                                            description="Prefer high quality output."
                                            checked={settingsDraft.highQuality}
                                            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, highQuality: value }))}
                                        />
                                        <ToggleCard
                                            label="Data Saver"
                                            description="Reduce network consumption when possible."
                                            checked={settingsDraft.dataSaver}
                                            onChange={(value) => setSettingsDraft((prev) => ({ ...prev, dataSaver: value }))}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveUserSettings}
                                    disabled={saving || !hasSettingsChanges}
                                    className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        ) : null}

                        {!loading && activeSection === 'activity' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#ffffff]">Recent Activity</h2>
                                    <button
                                        type="button"
                                        onClick={() => void loadAddressAndHistory()}
                                        className="rounded-lg border border-[#27272a] bg-[#1a1a1c] px-3 py-1.5 text-xs text-[#d1d5db] transition hover:bg-[#27272a]"
                                    >
                                        Refresh Activity
                                    </button>
                                </div>

                                {historyLoading ? (
                                    <div className="rounded-xl border border-dashed border-[#27272a] px-4 py-5 text-sm text-[#9ca3af]">
                                        Loading history...
                                    </div>
                                ) : null}

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <HistoryPanel
                                        title="Login History"
                                        rows={loginHistory}
                                        emptyText="No login records."
                                        keyPrefix="activity-login"
                                    />
                                    <HistoryPanel
                                        title="Generation History"
                                        rows={generationHistory}
                                        emptyText="No generation records."
                                        keyPrefix="activity-generation"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
