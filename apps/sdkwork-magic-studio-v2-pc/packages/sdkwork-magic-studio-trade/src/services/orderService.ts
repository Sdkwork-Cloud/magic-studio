import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  isMagicStudioServerResourceNotFoundError,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

import type {
  Order,
  OrderStatistics,
  OrderStatus,
  OrderType,
  TradePageRequest,
  TradePageResponse,
} from '../entities';
import { OrderStatus as OrderStatusEnum } from '../entities';
import {
  mapTradeOrder,
  mapTradeOrderPage,
  mapTradeOrderStatistics,
  normalizeTradeIdentifier,
  normalizeTradeTaskType,
  toTradeOrderQuery,
} from './tradeCommerceMapper';

export interface CreateOrderParams {
  type: OrderType;
  title: string;
  description?: string;
  amount: number;
  productId?: string | number;
  contentId?: string | number;
  taskType?: string;
  taskParams?: Record<string, unknown>;
  workspaceUuid?: string;
  projectUuid?: string;
  remark?: string;
  expireInMinutes?: number;
}

export interface CancelOrderParams {
  orderUuid: string;
  reason: string;
}

export interface IOrderService {
  createOrder(params: CreateOrderParams): Promise<Order>;
  getOrderById(uuid: string): Promise<Order | null>;
  getOrderByNo(orderNo: string): Promise<Order | null>;
  getOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>>;
  getMyOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>>;
  updateOrderStatus(uuid: string, status: OrderStatus): Promise<Order>;
  cancelOrder(params: CancelOrderParams): Promise<Order>;
  deleteOrder(uuid: string): Promise<void>;
  getOrderStatistics(): Promise<OrderStatistics>;
  getPendingPaymentOrders(): Promise<Order[]>;
  getInProgressOrders(): Promise<Order[]>;
}

type TradeOrderServerClient = Pick<
  MagicStudioServerClient,
  | 'cancelTradeOrder'
  | 'createTradeOrder'
  | 'deleteTradeOrder'
  | 'listTradeOrders'
  | 'readTradeOrder'
  | 'readTradeOrderStatistics'
  | 'updateTradeOrderStatus'
>;

export interface OrderServiceOptions {
  serverClient?: TradeOrderServerClient;
}

const ORDER_NOT_FOUND_CODES = ['APP_TRADE_ORDER_NOT_FOUND'] as const;

function sortOrdersByNewest(items: Order[]): Order[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt);
    const rightTime = Date.parse(right.updatedAt || right.createdAt);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return right.uuid.localeCompare(left.uuid);
  });
}

export class OrderService implements IOrderService {
  private readonly serverClient?: TradeOrderServerClient;
  private cachedServerClient?: TradeOrderServerClient;

  constructor(options: OrderServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): TradeOrderServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('OrderService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[OrderService] trade orders require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  async createOrder(params: CreateOrderParams): Promise<Order> {
    const response = await this.getServerClient().createTradeOrder({
      type: params.type,
      title: params.title,
      description: params.description,
      amount: params.amount,
      productId: normalizeTradeIdentifier(params.productId),
      contentId: normalizeTradeIdentifier(params.contentId),
      taskType: normalizeTradeTaskType(params.taskType),
      taskParams: params.taskParams,
      workspaceUuid: normalizeTradeIdentifier(params.workspaceUuid),
      projectUuid: normalizeTradeIdentifier(params.projectUuid),
      remark: params.remark,
      expireInMinutes: params.expireInMinutes,
    });

    return mapTradeOrder(response.data);
  }

  async getOrderById(uuid: string): Promise<Order | null> {
    try {
      const response = await this.getServerClient().readTradeOrder(uuid);
      return mapTradeOrder(response.data);
    } catch (error) {
      if (isMagicStudioServerResourceNotFoundError(error, ORDER_NOT_FOUND_CODES)) {
        return null;
      }
      throw error;
    }
  }

  async getOrderByNo(orderNo: string): Promise<Order | null> {
    try {
      const response = await this.getServerClient().readTradeOrder(orderNo);
      return mapTradeOrder(response.data);
    } catch (error) {
      if (isMagicStudioServerResourceNotFoundError(error, ORDER_NOT_FOUND_CODES)) {
        return null;
      }
      throw error;
    }
  }

  async getOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>> {
    const response = await this.getServerClient().listTradeOrders(
      toTradeOrderQuery(params),
    );
    return mapTradeOrderPage(response);
  }

  async getMyOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>> {
    return this.getOrderList(params);
  }

  async updateOrderStatus(uuid: string, status: OrderStatus): Promise<Order> {
    const response = await this.getServerClient().updateTradeOrderStatus(uuid, {
      status,
    });
    return mapTradeOrder(response.data);
  }

  async cancelOrder(params: CancelOrderParams): Promise<Order> {
    const response = await this.getServerClient().cancelTradeOrder(params.orderUuid, {
      reason: params.reason,
    });
    return mapTradeOrder(response.data);
  }

  async deleteOrder(uuid: string): Promise<void> {
    await this.getServerClient().deleteTradeOrder(uuid);
  }

  async getOrderStatistics(): Promise<OrderStatistics> {
    const response = await this.getServerClient().readTradeOrderStatistics();
    return mapTradeOrderStatistics(response.data);
  }

  async getPendingPaymentOrders(): Promise<Order[]> {
    const response = await this.getServerClient().listTradeOrders({
      page: 1,
      pageSize: 100,
      status: OrderStatusEnum.PENDING_PAYMENT,
    });
    return mapTradeOrderPage(response).items;
  }

  async getInProgressOrders(): Promise<Order[]> {
    const [paidOrders, inProgressOrders] = await Promise.all([
      this.getServerClient().listTradeOrders({
        page: 1,
        pageSize: 100,
        status: OrderStatusEnum.PAID,
      }),
      this.getServerClient().listTradeOrders({
        page: 1,
        pageSize: 100,
        status: OrderStatusEnum.IN_PROGRESS,
      }),
    ]);

    const merged = [...mapTradeOrderPage(paidOrders).items, ...mapTradeOrderPage(inProgressOrders).items];
    const deduped = merged.filter((item, index) =>
      merged.findIndex((candidate) => candidate.uuid === item.uuid) === index,
    );

    return sortOrdersByNewest(deduped);
  }
}

export const orderService = new OrderService();
