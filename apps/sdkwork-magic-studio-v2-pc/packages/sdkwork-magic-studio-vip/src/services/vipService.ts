import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';

import {
  PlanTier,
  type BillingCycle,
  type Subscription,
  type VipPlan,
  type VipPurchasePaymentMethod,
} from '../entities';
import {
  mapVipPlan,
  mapVipStatus,
  mapVipSubscription,
  toVipPaymentMethod,
} from './vipServerMapper';

type VipServerClient = Pick<
  MagicStudioServerClient,
  | 'listVipPlans'
  | 'readVipStatus'
  | 'listVipSubscriptions'
  | 'purchaseVip'
  | 'cancelVipSubscription'
>;

export interface VipServiceOptions {
  serverClient?: VipServerClient;
}

export interface VipServiceContract {
  getPlans(): Promise<VipPlan[]>;
  getStatus(): Promise<Subscription>;
  getSubscriptionHistory(): Promise<Subscription[]>;
  subscribe(
    planId: PlanTier,
    billingCycle?: BillingCycle,
    paymentMethod?: VipPurchasePaymentMethod,
  ): Promise<Subscription>;
  cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription>;
}

export class VipService implements VipServiceContract {
  private readonly serverClient?: VipServerClient;
  private cachedServerClient?: VipServerClient;

  constructor(options: VipServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): VipServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('VipService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[VipService] VIP capabilities require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  async getPlans(): Promise<VipPlan[]> {
    const response = await this.getServerClient().listVipPlans();
    return response.items.map(mapVipPlan);
  }

  async getStatus(): Promise<Subscription> {
    const response = await this.getServerClient().readVipStatus();
    return mapVipStatus(response.data);
  }

  async getSubscriptionHistory(): Promise<Subscription[]> {
    const response = await this.getServerClient().listVipSubscriptions({
      page: 1,
      pageSize: 100,
    });
    return response.items.map(mapVipSubscription);
  }

  async subscribe(
    planId: PlanTier,
    billingCycle: BillingCycle = 'month',
    paymentMethod: VipPurchasePaymentMethod = 'balance',
  ): Promise<Subscription> {
    if (planId === PlanTier.FREE) {
      return this.getStatus();
    }

    const response = await this.getServerClient().purchaseVip({
      planId,
      billingCycle,
      paymentMethod: toVipPaymentMethod(paymentMethod),
    });
    return mapVipSubscription(response.data.subscription);
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    const response = await this.getServerClient().cancelVipSubscription(subscriptionId, {
      reason,
    });
    return mapVipSubscription(response.data);
  }
}

export const vipService = new VipService();
