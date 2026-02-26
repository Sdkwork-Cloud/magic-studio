
export enum PlanTier {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export interface VipPlanFeatures {
  id: string;
  text: string;
  included: boolean;
  tooltip?: string;
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
  billingCycle?: 'month' | 'year' | 'onetime';
}
