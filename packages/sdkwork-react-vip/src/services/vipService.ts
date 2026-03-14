import type {
    PlusApiResultListVipPackVO,
    PlusApiResultVipPurchaseVO,
    PlusApiResultVipStatusVO,
    VipPackVO,
    VipPurchaseForm,
    VipPurchaseVO,
    VipStatusVO,
} from '@sdkwork/app-sdk';
import { getAppSdkClientWithSession } from '@sdkwork/react-core';
import { PlanTier } from '../entities';
import type { Subscription, VipPlan, VipPlanFeatures } from '../entities';

type BillingCycle = 'month' | 'year' | 'onetime';
type ApiResult<T> = { code?: string; msg?: string; data?: T };

interface VipPackCache {
    packByTier: Map<PlanTier, VipPackVO>;
    tierByPackId: Map<number, PlanTier>;
    allPacks: VipPackVO[];
}

const SUCCESS_CODE = '2000';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 60_000;
const PLAN_ORDER: PlanTier[] = [PlanTier.FREE, PlanTier.BASIC, PlanTier.STANDARD, PlanTier.PREMIUM];

let cachedPackMap: VipPackCache | null = null;
let cacheExpiredAt = 0;

function unwrapResult<T>(result: ApiResult<T>, fallback: string): T {
    const code = (result?.code || '').trim();
    if (code && code !== SUCCESS_CODE) {
        throw new Error((result?.msg || '').trim() || fallback);
    }
    return (result?.data as T) || ({} as T);
}

function normalizeText(value?: string): string {
    return (value || '').trim().toLowerCase();
}

function parseNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePackId(pack: VipPackVO): number | null {
    const parsed = Number(pack.id);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseTime(value?: string): number | null {
    if (!value) {
        return null;
    }
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
}

function resolveTier(pack: VipPackVO): PlanTier | null {
    const searchableText = normalizeText(
        [pack.name, pack.levelName, pack.description, ...(Array.isArray(pack.tags) ? pack.tags : [])]
            .filter((entry): entry is string => !!entry)
            .join(' '),
    );
    if (!searchableText) {
        return null;
    }
    if (searchableText.includes('free')) {
        return PlanTier.FREE;
    }
    if (
        searchableText.includes('premium') ||
        searchableText.includes('advanced') ||
        searchableText.includes('ultimate') ||
        searchableText.includes('max')
    ) {
        return PlanTier.PREMIUM;
    }
    if (searchableText.includes('standard') || searchableText.includes('pro') || searchableText.includes('plus')) {
        return PlanTier.STANDARD;
    }
    if (searchableText.includes('basic') || searchableText.includes('starter') || searchableText.includes('trial')) {
        return PlanTier.BASIC;
    }
    return null;
}

function getTagColor(planTier: PlanTier): 'blue' | 'cyan' | 'orange' | 'purple' {
    if (planTier === PlanTier.PREMIUM) {
        return 'orange';
    }
    if (planTier === PlanTier.STANDARD) {
        return 'cyan';
    }
    if (planTier === PlanTier.BASIC) {
        return 'blue';
    }
    return 'purple';
}

function getBillingLabel(vipDurationDays?: number): string {
    const days = parseNumber(vipDurationDays, 0);
    if (days <= 0) {
        return 'Forever';
    }
    if (days % 365 === 0) {
        return `${days / 365} Year`;
    }
    if (days % 30 === 0) {
        return `${days / 30} Month`;
    }
    return `${days} Days`;
}

function toVipFeatures(planTier: PlanTier, pack: VipPackVO): VipPlanFeatures[] {
    const featureTexts = [
        ...(Array.isArray(pack.tags) ? pack.tags : []),
        (pack.description || '').trim(),
    ].filter((entry): entry is string => !!entry && !!entry.trim());

    if (featureTexts.length === 0) {
        featureTexts.push(`${(pack.levelName || pack.name || 'VIP').trim()} benefits`);
    }

    return featureTexts.map((text, index) => ({
        id: `${planTier}-feature-${index + 1}`,
        text,
        included: true,
    }));
}

function toVipPlan(planTier: PlanTier, pack: VipPackVO): VipPlan {
    const name = (pack.name || pack.levelName || planTier).trim() || planTier;
    const price = parseNumber(pack.price, 0);
    const originalPrice = parseNumber(pack.originalPrice, 0);
    const tags = (Array.isArray(pack.tags) ? pack.tags : [])
        .map((text) => (text || '').trim())
        .filter(Boolean)
        .map((text) => ({
            text,
            color: getTagColor(planTier),
        }));

    return {
        id: planTier,
        name,
        price,
        originalPrice: originalPrice > price ? originalPrice : undefined,
        currency: 'CNY',
        billingCycle: getBillingLabel(pack.vipDurationDays),
        description: (pack.description || '').trim() || undefined,
        points: parseNumber(pack.pointAmount, 0),
        features: toVipFeatures(planTier, pack),
        tags: tags.length > 0 ? tags : undefined,
        buttonText: planTier === PlanTier.FREE ? 'Current Plan' : `Subscribe ${name}`,
        isPopular: Boolean(pack.recommended),
    };
}

function createDefaultFreePlan(): VipPlan {
    return {
        id: PlanTier.FREE,
        name: 'Free',
        price: 0,
        currency: 'CNY',
        billingCycle: 'Forever',
        points: 0,
        features: [
            {
                id: 'free-default-feature-1',
                text: 'Basic access',
                included: true,
            },
        ],
        buttonText: 'Current Plan',
    };
}

function buildVipPackCache(packs: VipPackVO[]): VipPackCache {
    const sortedPacks = [...packs].sort((left, right) => {
        const weightLeft = parseNumber(left.sortWeight, Number.MAX_SAFE_INTEGER);
        const weightRight = parseNumber(right.sortWeight, Number.MAX_SAFE_INTEGER);
        if (weightLeft !== weightRight) {
            return weightLeft - weightRight;
        }
        return parseNumber(left.price, 0) - parseNumber(right.price, 0);
    });

    const packByTier = new Map<PlanTier, VipPackVO>();
    const tierByPackId = new Map<number, PlanTier>();
    const assignedPackIds = new Set<number>();

    const tryAssign = (planTier: PlanTier, pack: VipPackVO): void => {
        if (packByTier.has(planTier)) {
            return;
        }
        const packId = parsePackId(pack);
        if (packId === null || assignedPackIds.has(packId)) {
            return;
        }
        packByTier.set(planTier, pack);
        tierByPackId.set(packId, planTier);
        assignedPackIds.add(packId);
    };

    sortedPacks.forEach((pack) => {
        const detectedTier = resolveTier(pack);
        if (detectedTier) {
            tryAssign(detectedTier, pack);
        }
    });

    if (!packByTier.has(PlanTier.FREE)) {
        const freePack = sortedPacks.find((pack) => parseNumber(pack.price, 0) <= 0);
        if (freePack) {
            tryAssign(PlanTier.FREE, freePack);
        }
    }

    PLAN_ORDER.forEach((planTier) => {
        if (packByTier.has(planTier)) {
            return;
        }
        const fallbackPack = sortedPacks.find((pack) => {
            const packId = parsePackId(pack);
            return packId !== null && !assignedPackIds.has(packId);
        });
        if (fallbackPack) {
            tryAssign(planTier, fallbackPack);
        }
    });

    return {
        packByTier,
        tierByPackId,
        allPacks: sortedPacks,
    };
}

function resolveTierForPack(cache: VipPackCache, pack: VipPackVO): PlanTier | null {
    const packId = parsePackId(pack);
    if (packId !== null && cache.tierByPackId.has(packId)) {
        return cache.tierByPackId.get(packId) as PlanTier;
    }
    return resolveTier(pack);
}

function pickPackForSubscription(cache: VipPackCache, planTier: PlanTier, billingCycle: BillingCycle): VipPackVO | null {
    const candidates = cache.allPacks.filter((pack) => {
        const tier = resolveTierForPack(cache, pack);
        return tier === planTier && parsePackId(pack) !== null;
    });

    if (candidates.length === 0) {
        return cache.packByTier.get(planTier) || null;
    }

    if (billingCycle === 'year') {
        return [...candidates].sort((left, right) => {
            const leftDuration = parseNumber(left.vipDurationDays, 0);
            const rightDuration = parseNumber(right.vipDurationDays, 0);
            if (leftDuration !== rightDuration) {
                return rightDuration - leftDuration;
            }
            return parseNumber(left.price, 0) - parseNumber(right.price, 0);
        })[0];
    }

    return [...candidates].sort((left, right) => {
        const leftDelta = Math.abs(parseNumber(left.vipDurationDays, 30) - 30);
        const rightDelta = Math.abs(parseNumber(right.vipDurationDays, 30) - 30);
        if (leftDelta !== rightDelta) {
            return leftDelta - rightDelta;
        }
        return parseNumber(left.price, 0) - parseNumber(right.price, 0);
    })[0];
}

async function loadVipPackCache(forceRefresh = false): Promise<VipPackCache> {
    if (!forceRefresh && cachedPackMap && Date.now() < cacheExpiredAt) {
        return cachedPackMap;
    }
    const client = getAppSdkClientWithSession();
    const response = await client.vip.listAllPacks();
    const data = unwrapResult<VipPackVO[]>(
        response as PlusApiResultListVipPackVO,
        'Failed to load VIP packs',
    );
    cachedPackMap = buildVipPackCache(Array.isArray(data) ? data : []);
    cacheExpiredAt = Date.now() + CACHE_TTL_MS;
    return cachedPackMap;
}

function mapSubscriptionStatus(status?: string, vipStatus: VipStatusVO | null = null): Subscription['status'] {
    if (vipStatus && vipStatus.isVip === false) {
        const expireTime = parseTime(vipStatus.expireTime);
        return expireTime !== null && expireTime <= Date.now() ? 'expired' : 'canceled';
    }

    const normalizedStatus = normalizeText(status);
    if (normalizedStatus.includes('cancel')) {
        return 'canceled';
    }
    if (normalizedStatus.includes('expire')) {
        return 'expired';
    }
    if (
        normalizedStatus.includes('active') ||
        normalizedStatus.includes('paid') ||
        normalizedStatus.includes('success') ||
        normalizedStatus === ''
    ) {
        return 'active';
    }
    return 'canceled';
}

function resolveExpiresAt(vipStatus: VipStatusVO | null, purchase: VipPurchaseVO, billingCycle: BillingCycle): number {
    const byStatus = parseTime(vipStatus?.expireTime);
    if (byStatus !== null) {
        return byStatus;
    }

    const durationDays = parseNumber(purchase.durationDays, 0);
    if (durationDays > 0) {
        return Date.now() + durationDays * DAY_IN_MS;
    }

    if (billingCycle === 'onetime') {
        return 0;
    }
    if (billingCycle === 'year') {
        return Date.now() + 365 * DAY_IN_MS;
    }
    return Date.now() + 30 * DAY_IN_MS;
}

async function tryGetVipStatus(): Promise<VipStatusVO | null> {
    const client = getAppSdkClientWithSession();
    try {
        const response = await client.vip.getVipStatus();
        return unwrapResult<VipStatusVO>(
            response as PlusApiResultVipStatusVO,
            'Failed to load VIP status',
        );
    } catch (error) {
        console.warn('[VipService] Failed to refresh VIP status after purchase:', error);
        return null;
    }
}

export const vipService = {
    getPlans: async (): Promise<VipPlan[]> => {
        const cache = await loadVipPackCache();
        const plans = PLAN_ORDER.map((planTier) => {
            const pack = cache.packByTier.get(planTier);
            if (!pack) {
                return null;
            }
            return toVipPlan(planTier, pack);
        }).filter((plan): plan is VipPlan => !!plan);

        if (!plans.some((plan) => plan.id === PlanTier.FREE)) {
            plans.unshift(createDefaultFreePlan());
        }
        return plans;
    },

    subscribe: async (planId: PlanTier, billingCycle: BillingCycle = 'month'): Promise<Subscription> => {
        if (planId === PlanTier.FREE) {
            return {
                planId: PlanTier.FREE,
                status: 'active',
                expiresAt: 0,
                billingCycle: 'onetime',
            };
        }

        let cache = await loadVipPackCache();
        let targetPack = pickPackForSubscription(cache, planId, billingCycle);
        if (!targetPack) {
            cache = await loadVipPackCache(true);
            targetPack = pickPackForSubscription(cache, planId, billingCycle);
        }
        if (!targetPack) {
            throw new Error(`VIP pack not found for tier: ${planId}`);
        }

        const packId = parsePackId(targetPack);
        if (packId === null) {
            throw new Error(`VIP pack id is invalid for tier: ${planId}`);
        }

        const client = getAppSdkClientWithSession();
        const form: VipPurchaseForm = { packId };
        const purchaseResponse = await client.vip.purchase(form);
        const purchaseData = unwrapResult<VipPurchaseVO>(
            purchaseResponse as PlusApiResultVipPurchaseVO,
            'Failed to create VIP purchase',
        );

        const purchasePackId = parseNumber(purchaseData.packId, NaN);
        const resolvedPlanId =
            Number.isFinite(purchasePackId) && cache.tierByPackId.has(purchasePackId)
                ? (cache.tierByPackId.get(purchasePackId) as PlanTier)
                : planId;

        const vipStatus = await tryGetVipStatus();
        return {
            planId: resolvedPlanId,
            status: mapSubscriptionStatus(purchaseData.status, vipStatus),
            expiresAt: resolveExpiresAt(vipStatus, purchaseData, billingCycle),
            billingCycle,
        };
    },
};
