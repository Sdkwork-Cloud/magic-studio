import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioServerClient,
  MagicStudioVipPlan,
  MagicStudioVipPurchaseRequest,
  MagicStudioVipPurchaseResult,
  MagicStudioVipStatus,
  MagicStudioVipSubscription,
  MagicStudioVipSubscriptionCancelRequest,
  MagicStudioVipSubscriptionListQuery,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimePlanList = Awaited<
  ReturnType<MagicStudioServerClient['listVipPlans']>
>;
type RuntimeStatusEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readVipStatus']>
>;
type RuntimePurchaseRequest = Parameters<MagicStudioServerClient['purchaseVip']>[0];
type RuntimePurchaseEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['purchaseVip']>
>;
type RuntimeSubscriptionListQuery = NonNullable<
  Parameters<MagicStudioServerClient['listVipSubscriptions']>[0]
>;
type RuntimeSubscriptionList = Awaited<
  ReturnType<MagicStudioServerClient['listVipSubscriptions']>
>;
type RuntimeCancelRequest = NonNullable<
  Parameters<MagicStudioServerClient['cancelVipSubscription']>[1]
>;
type RuntimeCancelEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['cancelVipSubscription']>
>;

const runtimePlanListMatchesServerEnvelope: AssertAssignable<
  RuntimePlanList,
  MagicStudioApiListEnvelope<MagicStudioVipPlan>
> = true;
const runtimeStatusMatchesServerEnvelope: AssertAssignable<
  RuntimeStatusEnvelope,
  MagicStudioApiEnvelope<MagicStudioVipStatus>
> = true;
const runtimePurchaseRequestMatchesServerType: AssertAssignable<
  RuntimePurchaseRequest,
  MagicStudioVipPurchaseRequest
> = true;
const serverPurchaseRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioVipPurchaseRequest,
  RuntimePurchaseRequest
> = true;
const runtimePurchaseMatchesServerEnvelope: AssertAssignable<
  RuntimePurchaseEnvelope,
  MagicStudioApiEnvelope<MagicStudioVipPurchaseResult>
> = true;
const runtimeSubscriptionQueryMatchesServerType: AssertAssignable<
  RuntimeSubscriptionListQuery,
  MagicStudioVipSubscriptionListQuery
> = true;
const runtimeSubscriptionListMatchesServerEnvelope: AssertAssignable<
  RuntimeSubscriptionList,
  MagicStudioApiListEnvelope<MagicStudioVipSubscription>
> = true;
const runtimeCancelRequestMatchesServerType: AssertAssignable<
  RuntimeCancelRequest,
  MagicStudioVipSubscriptionCancelRequest
> = true;
const runtimeCancelMatchesServerEnvelope: AssertAssignable<
  RuntimeCancelEnvelope,
  MagicStudioApiEnvelope<MagicStudioVipSubscription>
> = true;

const validVipPlan = {
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
} satisfies MagicStudioVipPlan;

const validVipSubscription = {
  uuid: 'subscription-basic',
  userUuid: 'user-1',
  planId: validVipPlan.id,
  tier: validVipPlan.tier,
  planName: validVipPlan.name,
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
} satisfies MagicStudioVipSubscription;

const validVipStatus = {
  currentPlanId: validVipPlan.id,
  currentTier: validVipPlan.tier,
  active: true,
  status: 'ACTIVE',
  subscription: validVipSubscription,
  expiresAt: validVipSubscription.expiresAt,
} satisfies MagicStudioVipStatus;

const validVipPurchaseRequest = {
  planId: 'basic',
  billingCycle: 'month',
  paymentMethod: 'BALANCE',
} satisfies RuntimePurchaseRequest;

const validVipPurchaseResult = {
  subscription: validVipSubscription,
  status: validVipStatus,
  order: null,
  payment: null,
} satisfies MagicStudioVipPurchaseResult;

const validVipPlanListResponse = {
  requestId: 'request-vip-plans',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validVipPlan],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimePlanList;

const validVipStatusResponse = {
  requestId: 'request-vip-status',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validVipStatus,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeStatusEnvelope;

const validVipPurchaseResponse = {
  requestId: 'request-vip-purchase',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validVipPurchaseResult,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimePurchaseEnvelope;

const validVipSubscriptionQuery = {
  page: 1,
  pageSize: 100,
  status: 'ACTIVE',
} satisfies RuntimeSubscriptionListQuery;

const validVipCancelRequest = {
  reason: 'not needed',
} satisfies RuntimeCancelRequest;

void runtimePlanListMatchesServerEnvelope;
void runtimeStatusMatchesServerEnvelope;
void runtimePurchaseRequestMatchesServerType;
void serverPurchaseRequestMatchesRuntimeType;
void runtimePurchaseMatchesServerEnvelope;
void runtimeSubscriptionQueryMatchesServerType;
void runtimeSubscriptionListMatchesServerEnvelope;
void runtimeCancelRequestMatchesServerType;
void runtimeCancelMatchesServerEnvelope;
void validVipPurchaseRequest;
void validVipPlanListResponse;
void validVipStatusResponse;
void validVipPurchaseResponse;
void validVipSubscriptionQuery;
void validVipCancelRequest;
