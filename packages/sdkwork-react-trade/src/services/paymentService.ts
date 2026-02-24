import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  TradePageRequest,
  TradePageResponse,
  Wallet,
  Transaction,
} from '../entities';
import { PaymentMethod as PaymentMethodEnum, PaymentStatus as PaymentStatusEnum, OrderStatus as OrderStatusEnum } from '../entities';
import { orderService } from './orderService';
import { generateUUID } from 'sdkwork-react-commons';

/**
 * 发起支付参数
 */
export interface InitiatePaymentParams {
  /** 订单 UUID */
  orderUuid: string;
  /** 支付方式 */
  method: PaymentMethod;
  /** 使用余额 (分) */
  useBalance?: number;
  /** 使用积分 */
  usePoints?: number;
}

/**
 * 支付结果
 */
export interface PaymentResult {
  /** 支付是否成功 */
  success: boolean;
  /** 支付记录 */
  payment?: Payment;
  /** 错误信息 */
  errorMessage?: string;
  /** 第三方支付跳转 URL */
  redirectUrl?: string;
  /** 支付流水号 */
  transactionId?: string;
}

/**
 * 退款参数
 */
export interface RefundParams {
  /** 支付 UUID */
  paymentUuid: string;
  /** 退款金额 (分) */
  amount?: number;
  /** 退款原因 */
  reason: string;
}

/**
 * 充值参数
 */
export interface RechargeParams {
  /** 充值金额 (分) */
  amount: number;
  /** 支付方式 */
  method: PaymentMethod;
  /** 备注 */
  remark?: string;
}

/**
 * 支付服务接口
 */
export interface IPaymentService {
  /**
   * 发起支付
   */
  initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult>;

  /**
   * 查询支付状态
   */
  queryPaymentStatus(paymentUuid: string): Promise<PaymentStatus>;

  /**
   * 根据 UUID 获取支付详情
   */
  getPaymentById(uuid: string): Promise<Payment | null>;

  /**
   * 获取支付列表 (分页)
   */
  getPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>>;

  /**
   * 获取我的支付列表 (分页)
   */
  getMyPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>>;

  /**
   * 申请退款
   */
  requestRefund(params: RefundParams): Promise<Payment>;

  /**
   * 发起充值
   */
  initiateRecharge(params: RechargeParams): Promise<PaymentResult>;

  /**
   * 获取钱包信息
   */
  getWallet(): Promise<Wallet>;

  /**
   * 获取交易流水列表
   */
  getTransactionList(params: TradePageRequest): Promise<TradePageResponse<Transaction>>;

  /**
   * 模拟支付回调 (用于测试)
   */
  simulatePaymentCallback(paymentUuid: string, success: boolean): Promise<void>;
}

/**
 * 支付服务实现 (本地存储版本)
 */
export class PaymentService implements IPaymentService {
  private readonly PAYMENT_STORAGE_KEY = 'trade_payments';
  private readonly WALLET_STORAGE_KEY = 'trade_wallet';
  private readonly TRANSACTION_STORAGE_KEY = 'trade_transactions';

  private generatePaymentNo(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${timestamp}${random}`;
  }

  private generateTransactionNo(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  private async getPayments(): Promise<Payment[]> {
    const data = localStorage.getItem(this.PAYMENT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async savePayments(payments: Payment[]): Promise<void> {
    localStorage.setItem(this.PAYMENT_STORAGE_KEY, JSON.stringify(payments));
  }

  private async getWalletData(): Promise<Wallet> {
    const data = localStorage.getItem(this.WALLET_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // 初始化默认钱包
    const defaultWallet: Wallet = {
      uuid: generateUUID(),
      userUuid: 'current-user',
      balance: 100000, // 默认 1000 元体验金
      frozenBalance: 0,
      points: 10000, // 默认 10000 积分
      totalRecharged: 100000,
      totalSpent: 0,
      totalEarnedPoints: 10000,
      totalUsedPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.saveWalletData(defaultWallet);
    return defaultWallet;
  }

  private async saveWalletData(wallet: Wallet): Promise<void> {
    localStorage.setItem(this.WALLET_STORAGE_KEY, JSON.stringify(wallet));
  }

  private async getTransactions(): Promise<Transaction[]> {
    const data = localStorage.getItem(this.TRANSACTION_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async saveTransactions(transactions: Transaction[]): Promise<void> {
    localStorage.setItem(this.TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));
  }

  private async createTransaction(
    type: Transaction['type'],
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    pointsChange: number,
    description: string,
    orderUuid?: string,
    paymentUuid?: string
  ): Promise<Transaction> {
    const transactions = await this.getTransactions();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      uuid: generateUUID(),
      transactionNo: this.generateTransactionNo(),
      type,
      amount,
      balanceBefore,
      balanceAfter,
      pointsChange,
      userUuid: 'current-user',
      description,
      orderUuid,
      paymentUuid,
      createdAt: now,
      updatedAt: now,
    };

    transactions.push(transaction);
    await this.saveTransactions(transactions);
    return transaction;
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    try {
      // 获取订单
      const order = await orderService.getOrderById(params.orderUuid);
      if (!order) {
        return {
          success: false,
          errorMessage: '订单不存在',
        };
      }

      if (order.status !== 'PENDING_PAYMENT') {
        return {
          success: false,
          errorMessage: '订单状态不支持支付',
        };
      }

      const payments = await this.getPayments();
      const wallet = await this.getWalletData();
      const now = new Date().toISOString();

      // 计算支付金额
      let remainingAmount = order.amount;
      let useBalance = params.useBalance || 0;
      let usePoints = params.usePoints || 0;

      // 积分抵扣 (假设 100 积分 = 1 元)
      if (usePoints > 0) {
        const pointsValue = Math.floor(usePoints / 100);
        remainingAmount -= pointsValue;
      }

      // 余额抵扣
      if (useBalance > 0) {
        useBalance = Math.min(useBalance, remainingAmount, wallet.balance);
        remainingAmount -= useBalance;
      }

      // 创建支付记录
      const payment: Payment = {
        uuid: generateUUID(),
        paymentNo: this.generatePaymentNo(),
        orderUuid: order.uuid,
        orderNo: order.orderNo,
        amount: order.amount,
        method: params.method,
        status: PaymentStatusEnum.PENDING,
        userUuid: 'current-user',
        metadata: {
          useBalance,
          usePoints,
          remainingAmount,
        },
        createdAt: now,
        updatedAt: now,
      };

      payments.push(payment);
      await this.savePayments(payments);

      // 如果是余额/积分支付，直接完成
      if (params.method === PaymentMethodEnum.BALANCE || params.method === PaymentMethodEnum.POINTS) {
        return await this.completePayment(payment.uuid, useBalance, usePoints);
      }

      // 第三方支付，返回跳转 URL (模拟)
      const redirectUrl = this.getThirdPartyRedirectUrl(params.method, payment.paymentNo);

      return {
        success: true,
        payment,
        redirectUrl,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : '支付失败',
      };
    }
  }

  private getThirdPartyRedirectUrl(method: PaymentMethod, paymentNo: string): string {
    // 模拟第三方支付跳转 URL
    const baseUrl = 'https://payment.example.com/pay';
    return `${baseUrl}?no=${paymentNo}&method=${method}`;
  }

  private async completePayment(
    paymentUuid: string,
    useBalance: number,
    usePoints: number
  ): Promise<PaymentResult> {
    const payments = await this.getPayments();
    const paymentIndex = payments.findIndex((p) => p.uuid === paymentUuid);

    if (paymentIndex === -1) {
      return {
        success: false,
        errorMessage: '支付记录不存在',
      };
    }

    const payment = payments[paymentIndex];
    const wallet = await this.getWalletData();
    const order = await orderService.getOrderById(payment.orderUuid);

    if (!order) {
      return {
        success: false,
        errorMessage: '订单不存在',
      };
    }

    const now = new Date().toISOString();
    const balanceBefore = wallet.balance;

    // 更新支付记录
    payment.status = PaymentStatusEnum.SUCCESS;
    payment.paidAt = now;
    payment.updatedAt = now;

    // 更新钱包
    wallet.balance -= useBalance;
    wallet.points -= usePoints;
    wallet.totalSpent += payment.amount;
    wallet.updatedAt = now;

    // 更新订单状态
    await orderService.updateOrderStatus(order.uuid, OrderStatusEnum.PAID);

    // 创建交易记录
    await this.createTransaction(
      'CONSUME',
      payment.amount,
      balanceBefore,
      wallet.balance,
      -usePoints,
      `支付订单 ${order.orderNo}`,
      order.uuid,
      payment.uuid
    );

    payments[paymentIndex] = payment;
    await this.savePayments(payments);
    await this.saveWalletData(wallet);

    return {
      success: true,
      payment,
    };
  }

  async queryPaymentStatus(paymentUuid: string): Promise<PaymentStatus> {
    const payments = await this.getPayments();
    const payment = payments.find((p) => p.uuid === paymentUuid);
    return payment?.status || PaymentStatusEnum.FAILED;
  }

  async getPaymentById(uuid: string): Promise<Payment | null> {
    const payments = await this.getPayments();
    return payments.find((p) => p.uuid === uuid) || null;
  }

  async getPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>> {
    const payments = await this.getPayments();
    return this.paginatePayments(payments, params);
  }

  async getMyPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>> {
    const payments = await this.getPayments();
    const myPayments = payments.filter((p) => p.userUuid === 'current-user');
    return this.paginatePayments(myPayments, params);
  }

  private paginatePayments(
    payments: Payment[],
    params: TradePageRequest
  ): TradePageResponse<Payment> {
    let filtered = [...payments];

    if (params.status) {
      filtered = filtered.filter((p) => p.status === params.status);
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.paymentNo.toLowerCase().includes(keyword) ||
          p.orderNo.toLowerCase().includes(keyword)
      );
    }

    filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

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

  async requestRefund(params: RefundParams): Promise<Payment> {
    const payments = await this.getPayments();
    const index = payments.findIndex((p) => p.uuid === params.paymentUuid);

    if (index === -1) {
      throw new Error('支付记录不存在');
    }

    const payment = payments[index];
    if (payment.status !== PaymentStatusEnum.SUCCESS) {
      throw new Error('只有成功的支付才能退款');
    }

    const now = new Date().toISOString();
    payment.status = PaymentStatusEnum.REFUNDING;
    payment.refundReason = params.reason;
    payment.refundAmount = params.amount || payment.amount;
    payment.updatedAt = now;

    payments[index] = payment;
    await this.savePayments(payments);

    // TODO: 实际场景中需要调用支付平台退款接口

    return payment;
  }

  async initiateRecharge(params: RechargeParams): Promise<PaymentResult> {
    const payments = await this.getPayments();
    const now = new Date().toISOString();

    const payment: Payment = {
      uuid: generateUUID(),
      paymentNo: this.generatePaymentNo(),
      orderUuid: '',
      orderNo: '',
      amount: params.amount,
      method: params.method,
      status: PaymentStatusEnum.PENDING,
      userUuid: 'current-user',
      metadata: {
        type: 'RECHARGE',
        remark: params.remark,
      },
      createdAt: now,
      updatedAt: now,
    };

    payments.push(payment);
    await this.savePayments(payments);

    // 模拟第三方支付
    const redirectUrl = this.getThirdPartyRedirectUrl(params.method, payment.paymentNo);

    return {
      success: true,
      payment,
      redirectUrl,
    };
  }

  async getWallet(): Promise<Wallet> {
    return this.getWalletData();
  }

  async getTransactionList(params: TradePageRequest): Promise<TradePageResponse<Transaction>> {
    const transactions = await this.getTransactions();
    let filtered = [...transactions];

    if (params.type) {
      filtered = filtered.filter((t) => t.type === params.type);
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transactionNo.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword)
      );
    }

    filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

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

  async simulatePaymentCallback(paymentUuid: string, success: boolean): Promise<void> {
    const payments = await this.getPayments();
    const index = payments.findIndex((p) => p.uuid === paymentUuid);

    if (index === -1) {
      throw new Error('支付记录不存在');
    }

    const payment = payments[index];
    const now = new Date().toISOString();

    if (success) {
      payment.status = PaymentStatusEnum.SUCCESS;
      payment.paidAt = now;
      payment.transactionId = `TXN${Date.now()}`;

      // 更新订单状态
      const order = await orderService.getOrderById(payment.orderUuid);
      if (order) {
        await orderService.updateOrderStatus(order.uuid, OrderStatusEnum.PAID);
      }
    } else {
      payment.status = PaymentStatusEnum.FAILED;
      payment.errorMessage = '支付失败';
    }

    payment.updatedAt = now;
    payments[index] = payment;
    await this.savePayments(payments);
  }
}

/**
 * 支付服务单例
 */
export const paymentService = new PaymentService();
