import type {
  Order,
  OrderStatus,
  OrderType,
  TradePageRequest,
  TradePageResponse,
  OrderStatistics,
  TaskType,
  PaymentStatus,
} from '../entities';
import { OrderStatus as OrderStatusEnum } from '../entities';
import { generateUUID } from 'sdkwork-react-commons';

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
  /**
   * 创建订单
   */
  createOrder(params: CreateOrderParams): Promise<Order>;

  /**
   * 根据 UUID 获取订单详情
   */
  getOrderById(uuid: string): Promise<Order | null>;

  /**
   * 根据订单号获取订单详情
   */
  getOrderByNo(orderNo: string): Promise<Order | null>;

  /**
   * 获取订单列表 (分页)
   */
  getOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>>;

  /**
   * 获取我的订单列表 (分页)
   */
  getMyOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>>;

  /**
   * 更新订单状态
   */
  updateOrderStatus(uuid: string, status: OrderStatus): Promise<Order>;

  /**
   * 取消订单
   */
  cancelOrder(params: CancelOrderParams): Promise<Order>;

  /**
   * 删除订单
   */
  deleteOrder(uuid: string): Promise<void>;

  /**
   * 获取订单统计信息
   */
  getOrderStatistics(): Promise<OrderStatistics>;

  /**
   * 获取待支付订单列表
   */
  getPendingPaymentOrders(): Promise<Order[]>;

  /**
   * 获取进行中订单列表
   */
  getInProgressOrders(): Promise<Order[]>;
}

/**
 * 订单服务实现 (本地存储版本)
 */
export class OrderService implements IOrderService {
  private readonly STORAGE_KEY = 'trade_orders';

  private generateOrderNo(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  private async getOrders(): Promise<Order[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async saveOrders(orders: Order[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
  }

  async createOrder(params: CreateOrderParams): Promise<Order> {
    const orders = await this.getOrders();
    const now = new Date().toISOString();
    const expiresAt = params.expireInMinutes
      ? new Date(Date.now() + params.expireInMinutes * 60 * 1000).toISOString()
      : undefined;

    const order: Order = {
      uuid: generateUUID(),
      orderNo: this.generateOrderNo(),
      type: params.type,
      status: OrderStatusEnum.PENDING_PAYMENT,
      title: params.title,
      description: params.description,
      amount: params.amount,
      paidAmount: 0,
      usedPoints: 0,
      usedBalance: 0,
      paymentStatus: 'PENDING' as PaymentStatus,
      taskType: params.taskType as TaskType | undefined,
      taskParams: params.taskParams,
      workspaceUuid: params.workspaceUuid,
      projectUuid: params.projectUuid,
      remark: params.remark,
      userUuid: 'current-user', // TODO: 从认证上下文获取
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    orders.push(order);
    await this.saveOrders(orders);
    return order;
  }

  async getOrderById(uuid: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.uuid === uuid) || null;
  }

  async getOrderByNo(orderNo: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.orderNo === orderNo) || null;
  }

  async getOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>> {
    const orders = await this.getOrders();
    return this.paginateOrders(orders, params);
  }

  async getMyOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>> {
    // TODO: 从认证上下文获取当前用户 UUID
    const orders = await this.getOrders();
    const myOrders = orders.filter((o) => o.userUuid === 'current-user');
    return this.paginateOrders(myOrders, params);
  }

  private paginateOrders(orders: Order[], params: TradePageRequest): TradePageResponse<Order> {
    let filtered = [...orders];

    // 应用过滤
    if (params.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }
    if (params.type) {
      filtered = filtered.filter((o) => o.type === params.type);
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(keyword) ||
          o.orderNo.toLowerCase().includes(keyword) ||
          o.description?.toLowerCase().includes(keyword)
      );
    }
    if (params.startTime) {
      filtered = filtered.filter((o) => o.createdAt >= params.startTime!);
    }
    if (params.endTime) {
      filtered = filtered.filter((o) => o.createdAt <= params.endTime!);
    }

    // 排序
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[params.sortBy as keyof Order];
        const bVal = b[params.sortBy as keyof Order];
        if (aVal && bVal) {
          if (aVal < bVal) return params.sortOrder === 'desc' ? 1 : -1;
          if (aVal > bVal) return params.sortOrder === 'desc' ? -1 : 1;
        }
        return 0;
      });
    } else {
      // 默认按创建时间降序
      filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }

  async updateOrderStatus(uuid: string, status: OrderStatus): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex((o) => o.uuid === uuid);
    if (index === -1) {
      throw new Error(`Order not found: ${uuid}`);
    }

    const order = orders[index];
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // 根据状态设置相关时间
    if (status === OrderStatusEnum.PAID) {
      order.paidAt = order.updatedAt;
      order.paymentStatus = 'SUCCESS' as PaymentStatus;
    } else if (status === OrderStatusEnum.COMPLETED) {
      order.completedAt = order.updatedAt;
    } else if (status === OrderStatusEnum.CANCELLED) {
      order.cancelledAt = order.updatedAt;
    }

    orders[index] = order;
    await this.saveOrders(orders);
    return order;
  }

  async cancelOrder(params: CancelOrderParams): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex((o) => o.uuid === params.orderUuid);
    if (index === -1) {
      throw new Error(`Order not found: ${params.orderUuid}`);
    }

    const order = orders[index];
    if (order.status !== OrderStatusEnum.PENDING_PAYMENT) {
      throw new Error('Only pending payment orders can be cancelled');
    }

    order.status = OrderStatusEnum.CANCELLED;
    order.cancelReason = params.reason;
    order.cancelledAt = new Date().toISOString();
    order.updatedAt = order.cancelledAt;

    orders[index] = order;
    await this.saveOrders(orders);
    return order;
  }

  async deleteOrder(uuid: string): Promise<void> {
    const orders = await this.getOrders();
    const filtered = orders.filter((o) => o.uuid !== uuid);
    await this.saveOrders(filtered);
  }

  async getOrderStatistics(): Promise<OrderStatistics> {
    const orders = await this.getOrders();
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const stats: OrderStatistics = {
      totalOrders: orders.length,
      pendingPaymentOrders: orders.filter((o) => o.status === OrderStatusEnum.PENDING_PAYMENT).length,
      inProgressOrders: orders.filter((o) => o.status === OrderStatusEnum.IN_PROGRESS).length,
      completedOrders: orders.filter((o) => o.status === OrderStatusEnum.COMPLETED).length,
      totalSpent: orders
        .filter((o) => o.status === OrderStatusEnum.COMPLETED)
        .reduce((sum, o) => sum + o.paidAmount, 0),
      monthSpent: orders
        .filter((o) => o.status === OrderStatusEnum.COMPLETED && new Date(o.createdAt) >= monthAgo)
        .reduce((sum, o) => sum + o.paidAmount, 0),
    };

    return stats;
  }

  async getPendingPaymentOrders(): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter((o) => o.status === OrderStatusEnum.PENDING_PAYMENT);
  }

  async getInProgressOrders(): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter((o) => o.status === OrderStatusEnum.IN_PROGRESS);
  }
}

/**
 * 订单服务单例
 */
export const orderService = new OrderService();
