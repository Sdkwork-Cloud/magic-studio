
import { PlanTier, Subscription } from '../entities/vip.entity';

export const vipService = {
  getPlans: async () => {
    // Simulate API call
    return await Promise.resolve();
  },

  subscribe: async (planId: PlanTier): Promise<Subscription> => {
    console.log(`[VipService] Processing subscription for ${planId}...`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determine mock expiration (1 month from now)
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    return {
      planId,
      status: 'active',
      expiresAt
    };
  }
};
