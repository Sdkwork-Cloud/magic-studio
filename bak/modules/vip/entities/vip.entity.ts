
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
  price: number; // Current price
  originalPrice?: number; // Crossed out price
  currency: string;
  billingCycle: string; // e.g. 'Month', 'Year', '7 Days'
  description?: string;
  points: number; // Monthly credits/points
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
}
