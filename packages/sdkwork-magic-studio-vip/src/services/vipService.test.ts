import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MagicStudioVipPlan,
  MagicStudioVipSubscription,
} from '@sdkwork/magic-studio-server';

import { PlanTier } from '../entities';
import { VipService } from './vipService';

type VipServerClient = NonNullable<
  NonNullable<ConstructorParameters<typeof VipService>[0]>['serverClient']
>;

function createVipPlan(
  overrides: Partial<MagicStudioVipPlan> = {},
): MagicStudioVipPlan {
  return {
    id: 'plan-basic',
    tier: 'basic',
    name: 'Basic',
    currency: 'CNY',
    description: 'Starter benefits',
    defaultCycle: 'month',
    pricingOptions: [
      {
        cycle: 'month',
        amount: 2900,
        originalAmount: 4900,
        durationDays: 30,
        points: 100,
        isDefault: true,
      },
    ],
    features: [
      {
        id: 'feature-generation',
        text: 'Generation quota',
        included: true,
      },
    ],
    tags: [
      {
        text: 'starter',
        color: 'blue',
      },
    ],
    buttonText: 'Subscribe Basic',
    isPopular: true,
    sortOrder: 2,
    ...overrides,
  };
}

function createSubscription(
  overrides: Partial<MagicStudioVipSubscription> = {},
): MagicStudioVipSubscription {
  return {
    uuid: 'subscription-basic',
    userUuid: 'user-1',
    planId: 'plan-basic',
    tier: 'basic',
    planName: 'Basic',
    status: 'ACTIVE',
    billingCycle: 'month',
    amount: 2900,
    currency: 'CNY',
    points: 100,
    startedAt: '2026-04-01T00:00:00.000Z',
    expiresAt: '2026-05-01T00:00:00.000Z',
    cancelledAt: null,
    cancelReason: null,
    orderUuid: 'order-1',
    paymentUuid: 'payment-1',
    metadata: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

function createServerClient(): VipServerClient {
  return {
    listVipPlans: vi.fn(),
    readVipStatus: vi.fn(),
    listVipSubscriptions: vi.fn(),
    purchaseVip: vi.fn(),
    cancelVipSubscription: vi.fn(),
  };
}

describe('vipService', () => {
  let serverClient: VipServerClient;
  let service: VipService;

  beforeEach(() => {
    serverClient = createServerClient();
    service = new VipService({ serverClient });

    vi.mocked(serverClient.listVipPlans).mockResolvedValue({
      requestId: 'request-vip-plans',
      timestamp: '2026-04-25T00:00:00.000Z',
      items: [
        createVipPlan({
          id: 'plan-free',
          tier: 'free',
          name: 'Free',
          defaultCycle: 'onetime',
          pricingOptions: [
            {
              cycle: 'onetime',
              amount: 0,
              originalAmount: 0,
              durationDays: 0,
              points: 0,
              isDefault: true,
            },
          ],
          buttonText: 'Current Plan',
          isPopular: false,
          sortOrder: 1,
        }),
        createVipPlan(),
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 2,
        version: '2026-04-25',
      },
    });
    vi.mocked(serverClient.readVipStatus).mockResolvedValue({
      requestId: 'request-vip-status',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: {
        currentPlanId: 'plan-basic',
        currentTier: 'basic',
        active: true,
        status: 'ACTIVE',
        subscription: createSubscription(),
        expiresAt: '2026-05-01T00:00:00.000Z',
      },
      meta: {
        version: '2026-04-25',
      },
    });
    vi.mocked(serverClient.listVipSubscriptions).mockResolvedValue({
      requestId: 'request-vip-subscriptions',
      timestamp: '2026-04-25T00:00:00.000Z',
      items: [createSubscription()],
      meta: {
        page: 1,
        pageSize: 100,
        total: 1,
        version: '2026-04-25',
      },
    });
    vi.mocked(serverClient.purchaseVip).mockResolvedValue({
      requestId: 'request-vip-purchase',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: {
        subscription: createSubscription(),
        status: {
          currentPlanId: 'plan-basic',
          currentTier: 'basic',
          active: true,
          status: 'ACTIVE',
          subscription: createSubscription(),
          expiresAt: '2026-05-01T00:00:00.000Z',
        },
        order: null,
        payment: null,
      },
      meta: {
        version: '2026-04-25',
      },
    });
    vi.mocked(serverClient.cancelVipSubscription).mockResolvedValue({
      requestId: 'request-vip-cancel',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: createSubscription({
        status: 'CANCELLED',
        cancelledAt: '2026-04-20T00:00:00.000Z',
        cancelReason: 'not needed',
      }),
      meta: {
        version: '2026-04-25',
      },
    });
  });

  it('loads VIP plans through the runtime server client', async () => {
    const plans = await service.getPlans();

    expect(serverClient.listVipPlans).toHaveBeenCalledTimes(1);
    expect(plans.find((plan) => plan.id === PlanTier.BASIC)).toMatchObject({
      id: PlanTier.BASIC,
      name: 'Basic',
      price: 29,
      billingCycle: '1 Month',
      isPopular: true,
      points: 100,
    });
  });

  it('maps current VIP status from the runtime server client', async () => {
    const subscription = await service.getStatus();

    expect(serverClient.readVipStatus).toHaveBeenCalledTimes(1);
    expect(subscription).toMatchObject({
      subscriptionId: 'subscription-basic',
      planId: PlanTier.BASIC,
      status: 'active',
      billingCycle: 'month',
      expiresAt: Date.parse('2026-05-01T00:00:00.000Z'),
      amount: 29,
      currency: 'CNY',
    });
  });

  it('subscribes through the runtime server client purchase endpoint', async () => {
    const subscription = await service.subscribe(PlanTier.BASIC, 'month', 'balance');

    expect(serverClient.purchaseVip).toHaveBeenCalledWith({
      planId: PlanTier.BASIC,
      billingCycle: 'month',
      paymentMethod: 'BALANCE',
    });
    expect(subscription).toMatchObject({
      subscriptionId: 'subscription-basic',
      planId: PlanTier.BASIC,
      status: 'active',
      billingCycle: 'month',
    });
  });

  it('returns current status instead of purchasing the free plan', async () => {
    const subscription = await service.subscribe(PlanTier.FREE);

    expect(serverClient.purchaseVip).not.toHaveBeenCalled();
    expect(serverClient.readVipStatus).toHaveBeenCalledTimes(1);
    expect(subscription.planId).toBe(PlanTier.BASIC);
  });

  it('cancels subscriptions through the runtime server client', async () => {
    const subscription = await service.cancelSubscription(
      'subscription-basic',
      'not needed',
    );

    expect(serverClient.cancelVipSubscription).toHaveBeenCalledWith(
      'subscription-basic',
      { reason: 'not needed' },
    );
    expect(subscription.status).toBe('canceled');
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./vipService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('keeps the contract guard on the runtime server VIP boundary', async () => {
    const source = await readFile(
      new URL('./vipService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(
      false,
    );
    expect(source.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });

  it('ships a vip service contract typecheck guard for server contract drift', async () => {
    await expect(
      access(
        new URL('./vipService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated vip contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
