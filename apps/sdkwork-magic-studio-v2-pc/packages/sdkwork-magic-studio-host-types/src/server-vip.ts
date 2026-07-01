import type {
  MagicStudioTradeOrder,
  MagicStudioTradePayment,
  MagicStudioTradePaymentMethod,
} from './server-trade.ts';

export type MagicStudioVipPlanTier = 'free' | 'basic' | 'standard' | 'premium';

export type MagicStudioVipBillingCycle = 'month' | 'year' | 'onetime';

export type MagicStudioVipSubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED';

export type MagicStudioVipPlanTagColor = 'blue' | 'cyan' | 'orange' | 'purple';

export interface MagicStudioVipPlanFeature {
  id: string;
  text: string;
  included: boolean;
  tooltip?: string | null;
}

export interface MagicStudioVipPlanTag {
  text: string;
  color: MagicStudioVipPlanTagColor;
}

export interface MagicStudioVipPricingOption {
  cycle: MagicStudioVipBillingCycle;
  amount: number;
  originalAmount?: number | null;
  durationDays: number;
  points: number;
  isDefault: boolean;
}

export interface MagicStudioVipPlan {
  id: string;
  tier: MagicStudioVipPlanTier;
  name: string;
  currency: string;
  description?: string | null;
  defaultCycle: MagicStudioVipBillingCycle;
  pricingOptions: MagicStudioVipPricingOption[];
  features: MagicStudioVipPlanFeature[];
  tags?: MagicStudioVipPlanTag[] | null;
  buttonText?: string | null;
  isPopular: boolean;
  sortOrder: number;
}

export interface MagicStudioVipSubscription {
  uuid: string;
  userUuid: string;
  planId: string;
  tier: MagicStudioVipPlanTier;
  planName: string;
  status: MagicStudioVipSubscriptionStatus;
  billingCycle: MagicStudioVipBillingCycle;
  amount: number;
  currency: string;
  points: number;
  startedAt: string;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  orderUuid?: string | null;
  paymentUuid?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioVipStatus {
  currentPlanId: string;
  currentTier: MagicStudioVipPlanTier;
  active: boolean;
  status: MagicStudioVipSubscriptionStatus;
  subscription?: MagicStudioVipSubscription | null;
  expiresAt?: string | null;
}

export interface MagicStudioVipPurchaseRequest {
  planId: MagicStudioVipPlanTier;
  billingCycle?: MagicStudioVipBillingCycle;
  paymentMethod?: MagicStudioTradePaymentMethod;
}

export interface MagicStudioVipPurchaseResult {
  subscription: MagicStudioVipSubscription;
  status: MagicStudioVipStatus;
  order?: MagicStudioTradeOrder | null;
  payment?: MagicStudioTradePayment | null;
}

export interface MagicStudioVipSubscriptionListQuery {
  page?: number;
  pageSize?: number;
  status?: MagicStudioVipSubscriptionStatus;
}

export interface MagicStudioVipSubscriptionCancelRequest {
  reason?: string;
}
