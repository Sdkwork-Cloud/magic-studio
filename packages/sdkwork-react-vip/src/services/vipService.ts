import { PlanTier, Subscription } from '../entities';

export const vipService = {
  getPlans: async () => {
    return await Promise.resolve();
  },

  subscribe: async (planId: PlanTier, billingCycle: 'month' | 'year' | 'onetime' = 'month'): Promise<Subscription> => {
    console.log(`[VipService] Processing subscription for ${planId} with billing cycle: ${billingCycle}...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calculate expiration based on billing cycle
    let expiresAt: number;
    if (billingCycle === 'onetime') {
      expiresAt = 0; // Lifetime subscription never expires
    } else if (billingCycle === 'year') {
      expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    } else {
      expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    return {
      planId,
      status: 'active',
      expiresAt,
      billingCycle
    };
  }
};
