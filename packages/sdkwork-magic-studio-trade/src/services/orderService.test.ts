import { access } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MagicStudioServerClientError,
  type MagicStudioTradeOrder,
} from '@sdkwork/magic-studio-server';

const mocks = vi.hoisted(() => {
  const serverClient = {
    cancelTradeOrder: vi.fn(),
    createTradeOrder: vi.fn(),
    deleteTradeOrder: vi.fn(),
    listTradeOrders: vi.fn(),
    readTradeOrder: vi.fn(),
    readTradeOrderStatistics: vi.fn(),
    updateTradeOrderStatus: vi.fn(),
  };

  return {
    createRuntimeMagicStudioServerClient: vi.fn(() => serverClient),
    isMagicStudioServerRuntimeSupported: vi.fn(() => true),
    readDefaultPlatformRuntime: vi.fn(() => ({
      system: {
        kind: () => 'server',
      },
    })),
    serverClient,
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: mocks.createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported: mocks.isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime: mocks.readDefaultPlatformRuntime,
}));

import {
  OrderService,
  type OrderServiceOptions,
} from './orderService';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TaskType,
} from '../entities';

const baseOrder = {
  uuid: 'order-1',
  orderNo: 'MSO-20260422-001',
  type: 'IMAGE_GENERATION',
  status: 'PENDING_PAYMENT',
  title: 'Launch poster',
  description: null,
  amount: 9900,
  paidAmount: 0,
  usedPoints: 0,
  usedBalance: 0,
  paymentMethod: null,
  paymentStatus: 'PENDING',
  taskUuid: null,
  taskType: null,
  taskParams: null,
  resourceUuids: [],
  userUuid: 'user-1',
  workspaceUuid: 'workspace-1',
  projectUuid: 'project-1',
  remark: null,
  cancelReason: null,
  failureReason: null,
  paidAt: null,
  completedAt: null,
  cancelledAt: null,
  expiresAt: null,
  metadata: null,
  createdAt: '2026-04-22T10:00:00.000Z',
  updatedAt: '2026-04-22T10:00:00.000Z',
} satisfies MagicStudioTradeOrder;

function buildOrder(overrides: Partial<MagicStudioTradeOrder> = {}): MagicStudioTradeOrder {
  return {
    ...baseOrder,
    ...overrides,
  };
}

function buildListEnvelope(
  items: MagicStudioTradeOrder[],
  meta: {
    page?: number;
    pageSize?: number;
    total?: number;
  } = {},
) {
  return {
    items,
    meta: {
      page: meta.page ?? 1,
      pageSize: meta.pageSize ?? 10,
      total: meta.total ?? items.length,
    },
  };
}

function createService(): OrderService {
  return new OrderService({
    serverClient: mocks.serverClient as unknown as NonNullable<OrderServiceOptions['serverClient']>,
  });
}

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMagicStudioServerRuntimeSupported.mockReturnValue(true);
  });

  it('routes created orders through the canonical runtime server client', async () => {
    mocks.serverClient.createTradeOrder.mockResolvedValueOnce({
      data: buildOrder({
        taskType: 'TEXT_TO_VIDEO',
        taskParams: {
          prompt: 'launch poster',
        },
      }),
    });

    const result = await new OrderService().createOrder({
      type: OrderType.IMAGE_GENERATION,
      title: 'Launch poster',
      description: 'Create launch artwork',
      amount: 9900,
      productId: 101,
      contentId: 202,
      taskType: TaskType.TEXT_TO_VIDEO,
      taskParams: {
        prompt: 'launch poster',
      },
      workspaceUuid: 'workspace-1',
      projectUuid: 'project-1',
      remark: 'launch campaign',
      expireInMinutes: 30,
    });

    expect(mocks.readDefaultPlatformRuntime).toHaveBeenCalledWith('OrderService');
    expect(mocks.createRuntimeMagicStudioServerClient).toHaveBeenCalledTimes(1);
    expect(mocks.serverClient.createTradeOrder).toHaveBeenCalledWith({
      type: OrderType.IMAGE_GENERATION,
      title: 'Launch poster',
      description: 'Create launch artwork',
      amount: 9900,
      productId: '101',
      contentId: '202',
      taskType: TaskType.TEXT_TO_VIDEO,
      taskParams: {
        prompt: 'launch poster',
      },
      workspaceUuid: 'workspace-1',
      projectUuid: 'project-1',
      remark: 'launch campaign',
      expireInMinutes: 30,
    });
    expect(result).toMatchObject({
      uuid: 'order-1',
      type: OrderType.IMAGE_GENERATION,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      taskType: TaskType.TEXT_TO_VIDEO,
      taskParams: {
        prompt: 'launch poster',
      },
    });
  });

  it('fails closed when no supported Magic Studio server runtime is available', async () => {
    mocks.isMagicStudioServerRuntimeSupported.mockReturnValueOnce(false);

    await expect(
      new OrderService().getOrderList({
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toThrow('trade orders require the canonical Magic Studio server runtime');

    expect(mocks.createRuntimeMagicStudioServerClient).not.toHaveBeenCalled();
    expect(mocks.serverClient.listTradeOrders).not.toHaveBeenCalled();
  });

  it('reads orders by uuid or order number and returns null for server 404 responses', async () => {
    mocks.serverClient.readTradeOrder
      .mockResolvedValueOnce({
        data: buildOrder({
          uuid: 'order-uuid-1',
          orderNo: 'MSO-20260422-002',
        }),
      })
      .mockResolvedValueOnce({
        data: buildOrder({
          uuid: 'order-uuid-2',
          orderNo: 'MSO-20260422-003',
        }),
      })
      .mockRejectedValueOnce(new MagicStudioServerClientError('not found', {
        status: 404,
        code: 'APP_TRADE_ORDER_NOT_FOUND',
      }));

    const byUuid = await createService().getOrderById('order-uuid-1');
    const byOrderNo = await createService().getOrderByNo('MSO-20260422-003');
    const missing = await createService().getOrderById('missing-order');

    expect(mocks.serverClient.readTradeOrder).toHaveBeenNthCalledWith(1, 'order-uuid-1');
    expect(mocks.serverClient.readTradeOrder).toHaveBeenNthCalledWith(2, 'MSO-20260422-003');
    expect(mocks.serverClient.readTradeOrder).toHaveBeenNthCalledWith(3, 'missing-order');
    expect(byUuid).toMatchObject({
      uuid: 'order-uuid-1',
      orderNo: 'MSO-20260422-002',
    });
    expect(byOrderNo).toMatchObject({
      uuid: 'order-uuid-2',
      orderNo: 'MSO-20260422-003',
    });
    expect(missing).toBeNull();
  });

  it('does not treat route-missing 404 responses as missing orders', async () => {
    mocks.serverClient.readTradeOrder.mockRejectedValueOnce(
      new MagicStudioServerClientError('HTTP 404 for /missing-route', {
        status: 404,
      }),
    );

    await expect(createService().getOrderById('order-uuid-404')).rejects.toThrow(
      'HTTP 404 for /missing-route',
    );
  });

  it('maps order list filters directly to the server list query contract', async () => {
    mocks.serverClient.listTradeOrders.mockResolvedValueOnce(buildListEnvelope([
      buildOrder({
        uuid: 'order-page-1',
        orderNo: 'MSO-20260422-004',
        paymentMethod: 'ALIPAY',
        paymentStatus: 'PROCESSING',
      }),
    ], {
      page: 2,
      pageSize: 5,
      total: 11,
    }));

    const result = await createService().getOrderList({
      page: 2,
      pageSize: 5,
      sortBy: 'amount',
      sortOrder: 'asc',
      keyword: 'poster',
      status: OrderStatus.PENDING_PAYMENT,
      type: OrderType.IMAGE_GENERATION,
      startTime: '2026-04-01T00:00:00.000Z',
      endTime: '2026-04-30T00:00:00.000Z',
    });

    expect(mocks.serverClient.listTradeOrders).toHaveBeenCalledWith({
      page: 2,
      pageSize: 5,
      sortBy: 'amount',
      sortOrder: 'asc',
      keyword: 'poster',
      status: OrderStatus.PENDING_PAYMENT,
      type: OrderType.IMAGE_GENERATION,
      startTime: '2026-04-01T00:00:00.000Z',
      endTime: '2026-04-30T00:00:00.000Z',
    });
    expect(result).toMatchObject({
      total: 11,
      totalPages: 3,
      currentPage: 2,
      pageSize: 5,
      items: [
        {
          uuid: 'order-page-1',
          paymentMethod: PaymentMethod.ALIPAY,
          paymentStatus: PaymentStatus.PROCESSING,
        },
      ],
    });
  });

  it('routes status updates, cancellations, deletion, and statistics through server methods', async () => {
    mocks.serverClient.updateTradeOrderStatus.mockResolvedValueOnce({
      data: buildOrder({
        status: 'COMPLETED',
        paymentStatus: 'SUCCESS',
        completedAt: '2026-04-22T11:00:00.000Z',
      }),
    });
    mocks.serverClient.cancelTradeOrder.mockResolvedValueOnce({
      data: buildOrder({
        uuid: 'order-cancel-1',
        status: 'CANCELLED',
        paymentStatus: 'FAILED',
        cancelReason: 'user_cancelled',
      }),
    });
    mocks.serverClient.deleteTradeOrder.mockResolvedValueOnce({
      data: {
        ok: true,
      },
    });
    mocks.serverClient.readTradeOrderStatistics.mockResolvedValueOnce({
      data: {
        totalOrders: 8,
        pendingPaymentOrders: 2,
        inProgressOrders: 3,
        completedOrders: 3,
        totalSpent: 68800,
        monthSpent: 12800,
      },
    });

    const service = createService();
    const updated = await service.updateOrderStatus('order-1', OrderStatus.COMPLETED);
    const cancelled = await service.cancelOrder({
      orderUuid: 'order-cancel-1',
      reason: 'user_cancelled',
    });
    await service.deleteOrder('order-delete-1');
    const statistics = await service.getOrderStatistics();

    expect(mocks.serverClient.updateTradeOrderStatus).toHaveBeenCalledWith('order-1', {
      status: OrderStatus.COMPLETED,
    });
    expect(mocks.serverClient.cancelTradeOrder).toHaveBeenCalledWith('order-cancel-1', {
      reason: 'user_cancelled',
    });
    expect(mocks.serverClient.deleteTradeOrder).toHaveBeenCalledWith('order-delete-1');
    expect(mocks.serverClient.readTradeOrderStatistics).toHaveBeenCalledWith();
    expect(updated).toMatchObject({
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.SUCCESS,
    });
    expect(cancelled).toMatchObject({
      uuid: 'order-cancel-1',
      status: OrderStatus.CANCELLED,
      cancelReason: 'user_cancelled',
    });
    expect(statistics).toEqual({
      totalOrders: 8,
      pendingPaymentOrders: 2,
      inProgressOrders: 3,
      completedOrders: 3,
      totalSpent: 68800,
      monthSpent: 12800,
    });
  });

  it('keeps pending-payment and in-progress convenience queries on server status filters', async () => {
    mocks.serverClient.listTradeOrders
      .mockResolvedValueOnce(buildListEnvelope([
        buildOrder({
          uuid: 'order-pending-1',
          orderNo: 'MSO-PENDING-1',
          status: 'PENDING_PAYMENT',
          updatedAt: '2026-04-22T08:00:00.000Z',
        }),
      ]))
      .mockResolvedValueOnce(buildListEnvelope([
        buildOrder({
          uuid: 'order-shared-1',
          orderNo: 'MSO-SHARED-1',
          status: 'PAID',
          paymentStatus: 'SUCCESS',
          updatedAt: '2026-04-22T09:00:00.000Z',
        }),
      ]))
      .mockResolvedValueOnce(buildListEnvelope([
        buildOrder({
          uuid: 'order-progress-1',
          orderNo: 'MSO-PROGRESS-1',
          status: 'IN_PROGRESS',
          paymentStatus: 'SUCCESS',
          updatedAt: '2026-04-22T11:00:00.000Z',
        }),
        buildOrder({
          uuid: 'order-shared-1',
          orderNo: 'MSO-SHARED-1',
          status: 'IN_PROGRESS',
          paymentStatus: 'SUCCESS',
          updatedAt: '2026-04-22T10:00:00.000Z',
        }),
      ]));

    const service = createService();
    const pending = await service.getPendingPaymentOrders();
    const inProgress = await service.getInProgressOrders();

    expect(mocks.serverClient.listTradeOrders).toHaveBeenNthCalledWith(1, {
      page: 1,
      pageSize: 100,
      status: OrderStatus.PENDING_PAYMENT,
    });
    expect(mocks.serverClient.listTradeOrders).toHaveBeenNthCalledWith(2, {
      page: 1,
      pageSize: 100,
      status: OrderStatus.PAID,
    });
    expect(mocks.serverClient.listTradeOrders).toHaveBeenNthCalledWith(3, {
      page: 1,
      pageSize: 100,
      status: OrderStatus.IN_PROGRESS,
    });
    expect(pending).toHaveLength(1);
    expect(inProgress.map((order) => order.uuid)).toEqual([
      'order-progress-1',
      'order-shared-1',
    ]);
  });

  it('ships an order service contract typecheck guard for Magic Studio server drift', async () => {
    await expect(
      access(
        new URL('./orderService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
