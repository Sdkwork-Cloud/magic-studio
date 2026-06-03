import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
  MagicStudioTradeOrder,
  MagicStudioTradeOrderCancelRequest,
  MagicStudioTradeOrderCreateRequest,
  MagicStudioTradeOrderListQuery,
  MagicStudioTradeOrderStatistics,
  MagicStudioTradeOrderStatusUpdateRequest,
} from '@sdkwork/magic-studio-server';

type CreateOrderRequest = Parameters<MagicStudioServerClient['createTradeOrder']>[0];
type ListOrderQuery = Parameters<MagicStudioServerClient['listTradeOrders']>[0];
type StatusUpdateRequest = Parameters<MagicStudioServerClient['updateTradeOrderStatus']>[1];
type CancelOrderRequest = NonNullable<Parameters<MagicStudioServerClient['cancelTradeOrder']>[1]>;
type ReadOrderResponse = Awaited<ReturnType<MagicStudioServerClient['readTradeOrder']>>;
type CreateOrderResponse = Awaited<ReturnType<MagicStudioServerClient['createTradeOrder']>>;
type ListOrderResponse = Awaited<ReturnType<MagicStudioServerClient['listTradeOrders']>>;
type DeleteOrderResponse = Awaited<ReturnType<MagicStudioServerClient['deleteTradeOrder']>>;
type StatisticsResponse = Awaited<ReturnType<MagicStudioServerClient['readTradeOrderStatistics']>>;

const validOrderCreateRequest = {
  type: 'IMAGE_GENERATION',
  title: 'Launch poster',
  description: 'Create launch artwork',
  amount: 9900,
  productId: 'product-101',
  contentId: 'asset-202',
  taskType: 'TEXT_TO_VIDEO',
  taskParams: {
    prompt: 'launch poster',
  },
  workspaceUuid: 'workspace-1',
  projectUuid: 'project-1',
  remark: 'launch campaign',
  expireInMinutes: 30,
} satisfies CreateOrderRequest satisfies MagicStudioTradeOrderCreateRequest;

const validOrderListQuery = {
  page: 2,
  pageSize: 5,
  sortBy: 'amount',
  sortOrder: 'asc',
  keyword: 'poster',
  status: 'PENDING_PAYMENT',
  type: 'IMAGE_GENERATION',
  startTime: '2026-04-01T00:00:00.000Z',
  endTime: '2026-04-30T00:00:00.000Z',
} satisfies ListOrderQuery satisfies MagicStudioTradeOrderListQuery;

const validStatusUpdateRequest = {
  status: 'COMPLETED',
} satisfies StatusUpdateRequest satisfies MagicStudioTradeOrderStatusUpdateRequest;

const validCancelRequest = {
  reason: 'user_cancelled',
} satisfies CancelOrderRequest satisfies MagicStudioTradeOrderCancelRequest;

const validOrder = {
  uuid: 'order-1',
  orderNo: 'MSO-20260422-001',
  type: 'IMAGE_GENERATION',
  status: 'PENDING_PAYMENT',
  title: 'Launch poster',
  description: 'Create launch artwork',
  amount: 9900,
  paidAmount: 0,
  usedPoints: 0,
  usedBalance: 0,
  paymentMethod: 'ALIPAY',
  paymentStatus: 'PENDING',
  taskUuid: 'task-1',
  taskType: 'TEXT_TO_VIDEO',
  taskParams: {
    prompt: 'launch poster',
  },
  resourceUuids: ['asset-202'],
  userUuid: 'user-1',
  workspaceUuid: 'workspace-1',
  projectUuid: 'project-1',
  remark: 'launch campaign',
  cancelReason: null,
  failureReason: null,
  paidAt: null,
  completedAt: null,
  cancelledAt: null,
  expiresAt: '2026-04-22T10:30:00.000Z',
  metadata: {
    source: 'contract-typecheck',
  },
  createdAt: '2026-04-22T10:00:00.000Z',
  updatedAt: '2026-04-22T10:00:00.000Z',
} satisfies MagicStudioTradeOrder;

const validOrderEnvelope = {
  requestId: 'req-order-1',
  timestamp: '2026-04-22T10:00:00.000Z',
  data: validOrder,
  meta: {
    version: '2026-04-22',
  },
} satisfies ReadOrderResponse satisfies CreateOrderResponse satisfies MagicStudioApiEnvelope<MagicStudioTradeOrder>;

const validOrderListEnvelope = {
  requestId: 'req-order-list-1',
  timestamp: '2026-04-22T10:00:00.000Z',
  items: [validOrder],
  meta: {
    page: 2,
    pageSize: 5,
    total: 1,
    version: '2026-04-22',
  },
} satisfies ListOrderResponse satisfies MagicStudioApiListEnvelope<MagicStudioTradeOrder>;

const validDeleteResponse = {
  requestId: 'req-order-delete-1',
  timestamp: '2026-04-22T10:05:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: '2026-04-22',
  },
} satisfies DeleteOrderResponse satisfies MagicStudioApiEnvelope<MagicStudioOperationOkResult>;

const validOrderStatistics = {
  totalOrders: 8,
  pendingPaymentOrders: 2,
  inProgressOrders: 3,
  completedOrders: 3,
  totalSpent: 68800,
  monthSpent: 12800,
} satisfies MagicStudioTradeOrderStatistics;

const validStatisticsResponse = {
  requestId: 'req-order-statistics-1',
  timestamp: '2026-04-22T10:10:00.000Z',
  data: validOrderStatistics,
  meta: {
    version: '2026-04-22',
  },
} satisfies StatisticsResponse satisfies MagicStudioApiEnvelope<MagicStudioTradeOrderStatistics>;

void validOrderCreateRequest;
void validOrderListQuery;
void validStatusUpdateRequest;
void validCancelRequest;
void validOrderEnvelope;
void validOrderListEnvelope;
void validDeleteResponse;
void validStatisticsResponse;
