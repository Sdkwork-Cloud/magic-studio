
export enum PlanTier {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export type BillingCycle = 'month' | 'year' | 'onetime';

export type VipPurchasePaymentMethod = 'wechat' | 'alipay' | 'balance';

export interface VipPlanFeatures {
  id: string;
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface VipPricingOption {
  cycle: BillingCycle;
  price: number;
  originalPrice?: number;
  points: number;
  durationDays: number;
  isDefault: boolean;
}

export interface VipPlan {
  id: PlanTier;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  billingCycle: string;
  description?: string;
  points: number;
  pricingOptions?: VipPricingOption[];
  defaultCycle?: BillingCycle;
  features: VipPlanFeatures[];
  tags?: {
    text: string;
    color: 'blue' | 'cyan' | 'orange' | 'purple';
  }[];
  buttonText: string;
  isPopular?: boolean;
}

export interface Subscription {
  planId: PlanTier;
  status: 'active' | 'canceled' | 'expired';
  expiresAt: number;
  billingCycle?: BillingCycle;
  subscriptionId?: string;
  orderUuid?: string;
  paymentUuid?: string;
  amount?: number;
  currency?: string;
}
