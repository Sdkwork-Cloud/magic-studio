import { getSdkworkClient } from '@sdkwork/react-core';
import type {
  Order,
  OrderStatistics,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TaskType,
  TradePageRequest,
  TradePageResponse,
} from '../entities';
import {
  OrderStatus as OrderStatusEnum,
  OrderType as OrderTypeEnum,
  PaymentMethod as PaymentMethodEnum,
  PaymentStatus as PaymentStatusEnum,
} from '../entities';

type AnyRecord = Record<string, unknown>;

interface ApiEnvelope<T> {
  code?: string | number;
  data?: T;
  msg?: string;
  message?: string;
}

const SUCCESS_CODE = '2000';

/**
 * 创建订单参数
 */
export interface CreateOrderParams {
  /** 订单类型 */
  type: OrderType;
  /** 订单标题 */
  title: string;
  /** 订单描述 */
  description?: string;
  /** 订单金额 (分) */
  amount: number;
  /** 任务类型 */
  taskType?: string;
  /** 任务参数 */
  taskParams?: Record<string, unknown>;
  /** 工作区 UUID */
  workspaceUuid?: string;
  /** 项目 UUID */
  projectUuid?: string;
  /** 备注 */
  remark?: string;
  /** 过期时间 (分钟) */
  expireInMinutes?: number;
}

/**
 * 取消订单参数
 */
export interface CancelOrderParams {
  /** 订单 UUID */
  orderUuid: string;
  /** 取消原因 */
  reason: string;
}

/**
 * 订单服务接口
 */
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

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toId(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function unwrapApiData<T>(payload: T | ApiEnvelope<T>, fallbackMessage: string): T {
  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiEnvelope<T>;
    if ('code' in envelope) {
      const code = String(envelope.code ?? '').trim();
      if (code && code !== SUCCESS_CODE && !code.startsWith('2')) {
        throw new Error(normalizeText(envelope.msg) || normalizeText(envelope.message) || fallbackMessage);
      }
    }
    if ('data' in envelope && envelope.data !== undefined) {
      return envelope.data as T;
    }
  }
  return payload as T;
}

function mapOrderStatus(value: unknown): OrderStatus {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();

  if (!normalized || normalized === 'PENDING' || normalized === 'UNPAID' || normalized.includes('PENDING_PAYMENT')) {
    return OrderStatusEnum.PENDING_PAYMENT;
  }
  if (normalized === 'PAID') {
    return OrderStatusEnum.PAID;
  }
  if (
    normalized.includes('PENDING_SHIPMENT')
    || normalized.includes('PENDING_RECEIPT')
    || normalized === 'PROCESSING'
    || normalized === 'SHIPPED'
    || normalized === 'DELIVERED'
    || normalized.includes('IN_PROGRESS')
  ) {
    return OrderStatusEnum.IN_PROGRESS;
  }
  if (normalized.includes('COMPLETE')) {
    return OrderStatusEnum.COMPLETED;
  }
  if (normalized.includes('REFUND')) {
    return OrderStatusEnum.REFUNDED;
  }
  if (normalized.includes('CANCEL') || normalized.includes('CLOSE')) {
    return OrderStatusEnum.CANCELLED;
  }
  if (normalized.includes('DISPUTE')) {
    return OrderStatusEnum.DISPUTED;
  }
  return OrderStatusEnum.PENDING_PAYMENT;
}

function mapOrderType(value: unknown): OrderType {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();
  const fallback = OrderTypeEnum.CUSTOM_SERVICE;

  const allowed: Record<string, OrderType> = {
    VIDEO_GENERATION: OrderTypeEnum.VIDEO_GENERATION,
    IMAGE_GENERATION: OrderTypeEnum.IMAGE_GENERATION,
    AUDIO_GENERATION: OrderTypeEnum.AUDIO_GENERATION,
    MUSIC_GENERATION: OrderTypeEnum.MUSIC_GENERATION,
    VIDEO_EDITING: OrderTypeEnum.VIDEO_EDITING,
    CUSTOM_SERVICE: OrderTypeEnum.CUSTOM_SERVICE,
    SUBSCRIPTION: OrderTypeEnum.SUBSCRIPTION,
    CREDIT_TOPUP: OrderTypeEnum.CREDIT_TOPUP,
  };

  return allowed[normalized] || fallback;
}

function mapPaymentMethod(value: unknown): PaymentMethod | undefined {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();
  if (!normalized) {
    return undefined;
  }
  const map: Record<string, PaymentMethod> = {
    ALIPAY: PaymentMethodEnum.ALIPAY,
    WECHAT_PAY: PaymentMethodEnum.WECHAT_PAY,
    CREDIT_CARD: PaymentMethodEnum.CREDIT_CARD,
    BALANCE: PaymentMethodEnum.BALANCE,
    POINTS: PaymentMethodEnum.POINTS,
    MIXED: PaymentMethodEnum.MIXED,
  };
  return map[normalized];
}

function mapPaymentStatus(orderStatus: OrderStatus): PaymentStatus {
  if (orderStatus === OrderStatusEnum.PENDING_PAYMENT) {
    return PaymentStatusEnum.PENDING;
  }
  if (orderStatus === OrderStatusEnum.IN_PROGRESS) {
    return PaymentStatusEnum.PROCESSING;
  }
  if (orderStatus === OrderStatusEnum.REFUNDED) {
    return PaymentStatusEnum.REFUNDED;
  }
  if (orderStatus === OrderStatusEnum.CANCELLED || orderStatus === OrderStatusEnum.DISPUTED) {
    return PaymentStatusEnum.FAILED;
  }
  return PaymentStatusEnum.SUCCESS;
}

function mapOrder(raw: AnyRecord): Order {
  const nowIso = new Date().toISOString();
  const uuid = toId(raw.orderId, toId(raw.orderSn, `order-${Date.now()}`));
  const orderNo = toId(raw.orderSn, uuid);
  const status = mapOrderStatus(raw.status);
  const amount = toNumber(raw.totalAmount, 0);
  const paidAmount = toNumber(raw.paidAmount, 0);
  const usedPoints = toNumber(raw.paidPointsAmount, 0);

  return {
    uuid,
    orderNo,
    type: mapOrderType(raw.orderType),
    status,
    title: normalizeText(raw.subject) || `Order ${orderNo}`,
    description: normalizeText(raw.remark) || undefined,
    amount,
    paidAmount,
    usedPoints,
    usedBalance: Math.max(0, paidAmount - usedPoints),
    paymentMethod: mapPaymentMethod(raw.paymentMethod),
    paymentStatus: mapPaymentStatus(status),
    taskUuid: undefined,
    taskType: undefined as TaskType | undefined,
    taskParams: undefined,
    resourceUuids: undefined,
    userUuid: toId(raw.userId),
    workspaceUuid: undefined,
    projectUuid: undefined,
    remark: normalizeText(raw.remark) || undefined,
    cancelReason: undefined,
    failureReason: undefined,
    paidAt: normalizeText(raw.payTime) || undefined,
    completedAt: normalizeText(raw.completeTime) || undefined,
    cancelledAt: normalizeText(raw.cancelTime) || undefined,
    expiresAt: normalizeText(raw.expireTime) || undefined,
    metadata: undefined,
    createdAt: normalizeText(raw.createdAt) || nowIso,
    updatedAt: normalizeText(raw.updatedAt) || nowIso,
  };
}

function toOrderQueryStatus(status?: string): string | undefined {
  const normalized = normalizeText(status).replace(/[\s-]+/g, '_').toUpperCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === OrderStatusEnum.IN_PROGRESS) {
    return 'PENDING_SHIPMENT';
  }
  return normalized;
}

function toSdkPaymentMethod(method: PaymentMethod | undefined): string {
  if (!method) {
    return 'ALIPAY';
  }
  const mapping: Record<PaymentMethod, string> = {
    [PaymentMethodEnum.ALIPAY]: 'ALIPAY',
    [PaymentMethodEnum.WECHAT_PAY]: 'WECHAT_PAY',
    [PaymentMethodEnum.CREDIT_CARD]: 'CREDIT_CARD',
    [PaymentMethodEnum.BALANCE]: 'BALANCE',
    [PaymentMethodEnum.POINTS]: 'POINTS',
    [PaymentMethodEnum.MIXED]: 'MIXED',
  };
  return mapping[method] || 'ALIPAY';
}

function toTradePageResponse(pageData: AnyRecord, fallbackPage: number, fallbackSize: number): TradePageResponse<Order> {
  const list = Array.isArray(pageData.content) ? pageData.content as AnyRecord[] : [];
  const items = list.map((item) => mapOrder(item));
  const total = toNumber(pageData.totalElements, items.length);
  const pageRaw = toNumber(pageData.number, fallbackPage - 1);
  const currentPage = pageRaw + 1;
  const pageSize = toNumber(pageData.size, fallbackSize);
  const totalPages = Math.max(1, toNumber(pageData.totalPages, Math.ceil(total / Math.max(1, pageSize))));

  return {
    items,
    total,
    totalPages,
    currentPage,
    pageSize,
  };
}

/**
 * 订单服务实现（SDK-only）
 */
export class OrderService implements IOrderService {
  async createOrder(params: CreateOrderParams): Promise<Order> {
    const client = getSdkworkClient();
    const primaryProductId = params.projectUuid || params.workspaceUuid || 'virtual-product';
    const body = {
      orderType: params.type,
      productId: primaryProductId,
      quantity: 1,
      items: [
        {
          productId: primaryProductId,
          quantity: 1,
          price: String(params.amount),
          productName: params.title,
          contentType: params.taskType || 'GENERATION',
          contentId: params.projectUuid || params.workspaceUuid || undefined,
        },
      ],
      paymentMethod: 'ALIPAY',
      remark: params.remark || params.description || '',
      sourceChannel: 'magic-studio-v2',
      rechargePoints: params.type === OrderTypeEnum.CREDIT_TOPUP ? Math.max(0, Math.round(params.amount)) : undefined,
      orderPayloadValid: true,
    };

    const response = await client.orders.createOrder(body);
    const created = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to create order');
    const orderId = toId(created.orderId);
    if (orderId) {
      const detail = await this.getOrderById(orderId);
      if (detail) {
        return detail;
      }
    }
    return mapOrder(created);
  }

  async getOrderById(uuid: string): Promise<Order | null> {
    const orderId = toId(uuid);
    if (!orderId) {
      return null;
    }
    const client = getSdkworkClient();
    const response = await client.orders.getOrderDetail(orderId);
    const detail = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to load order detail');
    return mapOrder(detail);
  }

  async getOrderByNo(orderNo: string): Promise<Order | null> {
    const no = normalizeText(orderNo);
    if (!no) {
      return null;
    }
    const list = await this.getOrderList({
      page: 1,
      pageSize: 20,
      keyword: no,
    });
    return list.items.find((item) => item.orderNo === no) || null;
  }

  async getOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>> {
    const page = Math.max(1, toNumber(params.page, 1));
    const pageSize = Math.max(1, toNumber(params.pageSize, 10));
    const client = getSdkworkClient();
    const response = await client.orders.listOrders({
      page,
      pageNo: page,
      pageSize,
      size: pageSize,
      keyword: params.keyword,
      status: toOrderQueryStatus(params.status),
      orderType: normalizeText(params.type) || undefined,
      startDate: params.startTime,
      endDate: params.endTime,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    const pageData = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to load orders');
    return toTradePageResponse(pageData, page, pageSize);
  }

  async getMyOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>> {
    return this.getOrderList(params);
  }

  async updateOrderStatus(uuid: string, status: OrderStatus): Promise<Order> {
    const orderId = toId(uuid);
    if (!orderId) {
      throw new Error('Order uuid is required');
    }

    const client = getSdkworkClient();
    if (status === OrderStatusEnum.CANCELLED) {
      await client.orders.cancel(orderId, { reason: 'user_cancelled' });
      const detail = await this.getOrderById(orderId);
      if (!detail) {
        throw new Error('Order not found after cancel');
      }
      return detail;
    }
    if (status === OrderStatusEnum.COMPLETED) {
      await client.orders.confirmReceipt(orderId);
      const detail = await this.getOrderById(orderId);
      if (!detail) {
        throw new Error('Order not found after confirm');
      }
      return detail;
    }
    if (status === OrderStatusEnum.PAID) {
      await client.orders.pay(orderId, { paymentMethod: toSdkPaymentMethod(PaymentMethodEnum.ALIPAY) });
      const detail = await this.getOrderById(orderId);
      if (!detail) {
        throw new Error('Order not found after pay');
      }
      return detail;
    }
    if (status === OrderStatusEnum.REFUNDED) {
      await client.orders.applyRefund(orderId, { reason: 'manual_refund' });
      const detail = await this.getOrderById(orderId);
      if (!detail) {
        throw new Error('Order not found after refund');
      }
      return detail;
    }

    throw new Error(`Unsupported status transition: ${status}`);
  }

  async cancelOrder(params: CancelOrderParams): Promise<Order> {
    const orderId = toId(params.orderUuid);
    if (!orderId) {
      throw new Error('Order uuid is required');
    }
    const client = getSdkworkClient();
    await client.orders.cancel(orderId, {
      reason: normalizeText(params.reason) || 'user_cancelled',
    });
    const detail = await this.getOrderById(orderId);
    if (!detail) {
      throw new Error('Order not found after cancel');
    }
    return detail;
  }

  async deleteOrder(uuid: string): Promise<void> {
    const orderId = toId(uuid);
    if (!orderId) {
      return;
    }
    const client = getSdkworkClient();
    await client.orders.deleteOrder(orderId);
  }

  async getOrderStatistics(): Promise<OrderStatistics> {
    const client = getSdkworkClient();
    const response = await client.orders.getOrderStatistics();
    const stats = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to load order statistics');

    return {
      totalOrders: toNumber(stats.totalOrders, 0),
      pendingPaymentOrders: toNumber(stats.pendingPayment, 0),
      inProgressOrders: toNumber(stats.pendingShipment, 0) + toNumber(stats.pendingReceipt, 0),
      completedOrders: toNumber(stats.completed, 0),
      totalSpent: toNumber(stats.totalAmount, 0),
      monthSpent: 0,
    };
  }

  async getPendingPaymentOrders(): Promise<Order[]> {
    const page = await this.getMyOrderList({
      page: 1,
      pageSize: 100,
      status: OrderStatusEnum.PENDING_PAYMENT,
    });
    return page.items;
  }

  async getInProgressOrders(): Promise<Order[]> {
    const page = await this.getMyOrderList({
      page: 1,
      pageSize: 100,
      status: OrderStatusEnum.IN_PROGRESS,
    });
    return page.items;
  }
}

/**
 * 订单服务单例
 */
export const orderService = new OrderService();
