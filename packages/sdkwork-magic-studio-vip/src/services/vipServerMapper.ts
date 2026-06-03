import type {
  MagicStudioVipBillingCycle,
  MagicStudioVipPlan,
  MagicStudioVipPricingOption as MagicStudioVipPricingOptionDto,
  MagicStudioVipStatus,
  MagicStudioVipSubscription,
  MagicStudioTradePaymentMethod,
} from '@sdkwork/magic-studio-server';

import {
  PlanTier,
  type BillingCycle,
  type Subscription,
  type VipPlan as VipPlanEntity,
  type VipPricingOption,
  type VipPurchasePaymentMethod,
} from '../entities';

function amountToPrice(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return amount / 100;
}

function normalizeText(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function mapPlanTier(tier: string): PlanTier {
  if (tier === PlanTier.BASIC) return PlanTier.BASIC;
  if (tier === PlanTier.STANDARD) return PlanTier.STANDARD;
  if (tier === PlanTier.PREMIUM) return PlanTier.PREMIUM;
  return PlanTier.FREE;
}

function mapBillingCycle(cycle: MagicStudioVipBillingCycle): BillingCycle {
  if (cycle === 'year') return 'year';
  if (cycle === 'onetime') return 'onetime';
  return 'month';
}

function mapStatus(
  status: MagicStudioVipSubscription['status'] | MagicStudioVipStatus['status'],
): Subscription['status'] {
  if (status === 'CANCELLED') return 'canceled';
  if (status === 'EXPIRED') return 'expired';
  return 'active';
}

function parseTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getBillingLabel(option: MagicStudioVipPricingOptionDto): string {
  if (option.durationDays <= 0) {
    return 'Forever';
  }
  if (option.durationDays % 365 === 0) {
    return `${option.durationDays / 365} Year`;
  }
  if (option.durationDays % 30 === 0) {
    return `${option.durationDays / 30} Month`;
  }
  return `${option.durationDays} Days`;
}

export function mapVipPricingOption(
  option: MagicStudioVipPricingOptionDto,
): VipPricingOption {
  return {
    cycle: mapBillingCycle(option.cycle),
    price: amountToPrice(option.amount),
    originalPrice:
      typeof option.originalAmount === 'number'
        ? amountToPrice(option.originalAmount)
        : undefined,
    points: option.points,
    durationDays: option.durationDays,
    isDefault: option.isDefault,
  };
}

export function resolveVipPricingOption(
  plan: VipPlanEntity,
  cycle?: BillingCycle,
): VipPricingOption {
  const options = Array.isArray(plan.pricingOptions) ? plan.pricingOptions : [];
  if (options.length === 0) {
    return {
      cycle: plan.defaultCycle || cycle || 'month',
      price: plan.price,
      originalPrice: plan.originalPrice,
      points: plan.points,
      durationDays: 0,
      isDefault: true,
    };
  }

  return (
    options.find((option) => option.cycle === cycle)
    || options.find((option) => option.isDefault)
    || options[0]
  );
}

export function mapVipPlan(plan: MagicStudioVipPlan): VipPlanEntity {
  const pricingOptions = plan.pricingOptions.map(mapVipPricingOption);
  const defaultPricing =
    pricingOptions.find((option) => option.isDefault) || pricingOptions[0];

  return {
    id: mapPlanTier(plan.tier),
    name: plan.name,
    price: defaultPricing?.price || 0,
    originalPrice: defaultPricing?.originalPrice,
    currency: plan.currency,
    billingCycle: defaultPricing ? getBillingLabel(plan.pricingOptions.find((option) => option.isDefault) || plan.pricingOptions[0]) : 'Forever',
    description: normalizeText(plan.description),
    points: defaultPricing?.points || 0,
    pricingOptions,
    defaultCycle: mapBillingCycle(plan.defaultCycle),
    features: plan.features.map((feature) => ({
      id: feature.id,
      text: feature.text,
      included: feature.included,
      tooltip: normalizeText(feature.tooltip || undefined),
    })),
    tags: Array.isArray(plan.tags)
      ? plan.tags.map((tag) => ({
          text: tag.text,
          color: tag.color,
        }))
      : undefined,
    buttonText:
      normalizeText(plan.buttonText || undefined)
      || (plan.tier === 'free' ? 'Current Plan' : `Subscribe ${plan.name}`),
    isPopular: Boolean(plan.isPopular),
  };
}

export function mapVipSubscription(
  subscription: MagicStudioVipSubscription,
): Subscription {
  return {
    subscriptionId: subscription.uuid,
    planId: mapPlanTier(subscription.tier),
    status: mapStatus(subscription.status),
    expiresAt: parseTimestamp(subscription.expiresAt),
    billingCycle: mapBillingCycle(subscription.billingCycle),
    orderUuid: normalizeText(subscription.orderUuid),
    paymentUuid: normalizeText(subscription.paymentUuid),
    amount: amountToPrice(subscription.amount),
    currency: subscription.currency,
  };
}

export function mapVipStatus(status: MagicStudioVipStatus): Subscription {
  if (status.subscription) {
    return mapVipSubscription(status.subscription);
  }

  return {
    planId: mapPlanTier(status.currentTier),
    status: mapStatus(status.status),
    expiresAt: parseTimestamp(status.expiresAt),
    billingCycle: status.currentTier === 'free' ? 'onetime' : 'month',
  };
}

export function toVipPaymentMethod(
  method?: VipPurchasePaymentMethod,
): MagicStudioTradePaymentMethod | undefined {
  if (method === 'wechat') {
    return 'WECHAT_PAY';
  }
  if (method === 'alipay') {
    return 'ALIPAY';
  }
  if (method === 'balance') {
    return 'BALANCE';
  }
  return undefined;
}
