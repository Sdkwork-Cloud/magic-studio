import { PlanTier, Subscription } from '../entities/vip.entity';

export const vipService = {
  getPlans: async () => {
    return await Promise.resolve();
  },

  subscribe: async (planId: PlanTier): Promise<Subscription> => {
    console.log(`[VipService] Processing subscription for ${planId}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    return {
      planId,
      status: 'active',
      expiresAt
    };
  }
};
