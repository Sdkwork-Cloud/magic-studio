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
  Payment,
  PaymentMethod,
  PaymentStatus,
  TradePageRequest,
  TradePageResponse,
  Transaction,
  Wallet,
} from '../entities';
import { PaymentMethod as PaymentMethodEnum, PaymentStatus as PaymentStatusEnum } from '../entities';
import {
  mapTradePayment,
  mapTradePaymentActionResult,
  mapTradePaymentPage,
  mapTradeTransactionPage,
  mapTradeWallet,
  toTradePaymentQuery,
  toTradeTransactionQuery,
} from './tradeCommerceMapper';

const ORDER_PAYMENT_METHODS: readonly PaymentMethod[] = [
  PaymentMethodEnum.ALIPAY,
  PaymentMethodEnum.WECHAT_PAY,
] as const;
const PAYMENT_NOT_FOUND_CODES = ['APP_TRADE_PAYMENT_NOT_FOUND'] as const;

export const SUPPORTED_ORDER_PAYMENT_METHODS: readonly PaymentMethod[] = ORDER_PAYMENT_METHODS;

export function isSupportedOrderPaymentMethod(method: PaymentMethod): boolean {
  return ORDER_PAYMENT_METHODS.includes(method);
}

export interface InitiatePaymentParams {
  orderUuid: string;
  method: PaymentMethod;
  useBalance?: number;
  usePoints?: number;
}

export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  errorMessage?: string;
  redirectUrl?: string;
  transactionId?: string;
}

export interface RefundParams {
  paymentUuid: string;
  amount?: number;
  reason: string;
}

export interface RechargeParams {
  amount: number;
  method: PaymentMethod;
  remark?: string;
}

export interface IPaymentService {
  initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult>;
  queryPaymentStatus(paymentUuid: string): Promise<PaymentStatus>;
  getPaymentById(uuid: string): Promise<Payment | null>;
  getPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>>;
  getMyPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>>;
  requestRefund(params: RefundParams): Promise<Payment>;
  initiateRecharge(params: RechargeParams): Promise<PaymentResult>;
  getWallet(): Promise<Wallet>;
  getTransactionList(params: TradePageRequest): Promise<TradePageResponse<Transaction>>;
}

type TradePaymentServerClient = Pick<
  MagicStudioServerClient,
  | 'createTradePayment'
  | 'listTradePayments'
  | 'listTradeTransactions'
  | 'readTradePayment'
  | 'readTradeWallet'
  | 'rechargeTradeWallet'
  | 'refundTradePayment'
>;

export interface PaymentServiceOptions {
  serverClient?: TradePaymentServerClient;
}

export class PaymentService implements IPaymentService {
  private readonly serverClient?: TradePaymentServerClient;
  private cachedServerClient?: TradePaymentServerClient;

  constructor(options: PaymentServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): TradePaymentServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('PaymentService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[PaymentService] trade payments require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    if (!isSupportedOrderPaymentMethod(params.method)) {
      return {
        success: false,
        errorMessage: `Magic Studio order payment does not support payment method: ${params.method}`,
      };
    }

    try {
      const response = await this.getServerClient().createTradePayment({
        orderUuid: params.orderUuid,
        method: params.method,
        useBalance: params.useBalance,
        usePoints: params.usePoints,
      });

      return mapTradePaymentActionResult(response.data);
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  async queryPaymentStatus(paymentUuid: string): Promise<PaymentStatus> {
    const payment = await this.getPaymentById(paymentUuid);
    return payment?.status || PaymentStatusEnum.FAILED;
  }

  async getPaymentById(uuid: string): Promise<Payment | null> {
    try {
      const response = await this.getServerClient().readTradePayment(uuid);
      return mapTradePayment(response.data);
    } catch (error) {
      if (isMagicStudioServerResourceNotFoundError(error, PAYMENT_NOT_FOUND_CODES)) {
        return null;
      }
      throw error;
    }
  }

  async getPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>> {
    const response = await this.getServerClient().listTradePayments(
      toTradePaymentQuery(params),
    );
    return mapTradePaymentPage(response);
  }

  async getMyPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>> {
    return this.getPaymentList(params);
  }

  async requestRefund(params: RefundParams): Promise<Payment> {
    const response = await this.getServerClient().refundTradePayment(params.paymentUuid, {
      amount: params.amount,
      reason: params.reason,
    });
    return mapTradePayment(response.data);
  }

  async initiateRecharge(params: RechargeParams): Promise<PaymentResult> {
    try {
      const response = await this.getServerClient().rechargeTradeWallet({
        amount: params.amount,
        method: params.method,
        remark: params.remark,
      });

      return mapTradePaymentActionResult(response.data);
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Recharge failed',
      };
    }
  }

  async getWallet(): Promise<Wallet> {
    const response = await this.getServerClient().readTradeWallet();
    return mapTradeWallet(response.data);
  }

  async getTransactionList(params: TradePageRequest): Promise<TradePageResponse<Transaction>> {
    const response = await this.getServerClient().listTradeTransactions(
      toTradeTransactionQuery(params),
    );
    return mapTradeTransactionPage(response);
  }
}

export const paymentService = new PaymentService();
