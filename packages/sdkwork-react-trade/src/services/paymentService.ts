import { getSdkworkClient } from '@sdkwork/react-core';
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  TradePageRequest,
  TradePageResponse,
  Wallet,
  Transaction,
} from '../entities';
import { PaymentMethod as PaymentMethodEnum, PaymentStatus as PaymentStatusEnum } from '../entities';

type AnyRecord = Record<string, unknown>;

interface ApiEnvelope<T> {
  code?: string | number;
  data?: T;
  msg?: string;
  message?: string;
}

const SUCCESS_CODE = '2000';

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
  simulatePaymentCallback(paymentUuid: string, success: boolean): Promise<void>;
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

function mapPaymentMethod(value: unknown, fallback: PaymentMethod = PaymentMethodEnum.ALIPAY): PaymentMethod {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();
  const map: Record<string, PaymentMethod> = {
    ALIPAY: PaymentMethodEnum.ALIPAY,
    WECHAT_PAY: PaymentMethodEnum.WECHAT_PAY,
    CREDIT_CARD: PaymentMethodEnum.CREDIT_CARD,
    BALANCE: PaymentMethodEnum.BALANCE,
    POINTS: PaymentMethodEnum.POINTS,
    MIXED: PaymentMethodEnum.MIXED,
  };
  return map[normalized] || fallback;
}

function toSdkPaymentMethod(value: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    [PaymentMethodEnum.ALIPAY]: 'ALIPAY',
    [PaymentMethodEnum.WECHAT_PAY]: 'WECHAT_PAY',
    [PaymentMethodEnum.CREDIT_CARD]: 'CREDIT_CARD',
    [PaymentMethodEnum.BALANCE]: 'BALANCE',
    [PaymentMethodEnum.POINTS]: 'POINTS',
    [PaymentMethodEnum.MIXED]: 'MIXED',
  };
  return map[value] || 'ALIPAY';
}

function mapPaymentStatus(value: unknown): PaymentStatus {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();
  if (!normalized || normalized === 'PENDING' || normalized === 'UNPAID') {
    return PaymentStatusEnum.PENDING;
  }
  if (normalized === 'PROCESSING') {
    return PaymentStatusEnum.PROCESSING;
  }
  if (normalized === 'SUCCESS' || normalized === 'PAID' || normalized === 'COMPLETED') {
    return PaymentStatusEnum.SUCCESS;
  }
  if (normalized === 'REFUNDING') {
    return PaymentStatusEnum.REFUNDING;
  }
  if (normalized === 'REFUNDED') {
    return PaymentStatusEnum.REFUNDED;
  }
  return PaymentStatusEnum.FAILED;
}

function resolveRedirectUrl(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const source = data as AnyRecord;
  const direct = [
    source.payUrl,
    source.paymentUrl,
    source.url,
    source.qrCodeUrl,
    source.qrCode,
  ];
  for (const value of direct) {
    const text = normalizeText(value);
    if (text) {
      return text;
    }
  }

  if (source.paymentParams && typeof source.paymentParams === 'object') {
    const nested = source.paymentParams as AnyRecord;
    const nestedCandidates = [
      nested.payUrl,
      nested.paymentUrl,
      nested.url,
      nested.qrCodeUrl,
      nested.qrCode,
    ];
    for (const value of nestedCandidates) {
      const text = normalizeText(value);
      if (text) {
        return text;
      }
    }
  }
  return undefined;
}

function mapPaymentRecord(raw: AnyRecord, fallback?: Partial<Payment>): Payment {
  const nowIso = new Date().toISOString();
  const uuid = toId(raw.paymentId, toId(raw.paymentOrderId, fallback?.uuid || `payment-${Date.now()}`));
  const paymentNo = toId(raw.paymentSn, toId(raw.paymentOrderId, toId(raw.outTradeNo, uuid)));
  const orderUuid = toId(raw.orderId, fallback?.orderUuid || '');
  const orderNo = toId(raw.merchantOrderId, toId(raw.outTradeNo, fallback?.orderNo || orderUuid));
  const amount = toNumber(raw.amount, fallback?.amount || 0);
  const method = mapPaymentMethod(raw.paymentMethod, fallback?.method || PaymentMethodEnum.ALIPAY);
  const status = mapPaymentStatus(raw.status);

  return {
    uuid,
    paymentNo,
    orderUuid,
    orderNo,
    amount,
    method,
    status,
    userUuid: fallback?.userUuid || '',
    transactionId: normalizeText(raw.transactionId) || fallback?.transactionId,
    channel: normalizeText(raw.paymentProvider) || fallback?.channel,
    errorMessage: fallback?.errorMessage,
    paidAt: normalizeText(raw.successTime) || fallback?.paidAt,
    refundedAt: fallback?.refundedAt,
    refundAmount: fallback?.refundAmount,
    refundReason: fallback?.refundReason,
    receiptUrl: resolveRedirectUrl(raw) || fallback?.receiptUrl,
    metadata: (raw.paymentParams as Record<string, unknown> | undefined) || fallback?.metadata,
    createdAt: normalizeText(raw.createdAt) || fallback?.createdAt || nowIso,
    updatedAt: normalizeText(raw.updatedAt) || fallback?.updatedAt || nowIso,
  };
}

function mapHistoryType(value: unknown): Transaction['type'] {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_').toUpperCase();
  if (normalized === 'RECHARGE') return 'RECHARGE';
  if (normalized === 'WITHDRAW') return 'WITHDRAW';
  if (normalized === 'TRANSFER_IN' || normalized === 'TRANSFER_OUT') return 'TRANSFER';
  if (normalized === 'REFUND') return 'REFUND';
  if (normalized === 'REWARD') return 'REWARD';
  return 'CONSUME';
}

function mapHistoryTransaction(raw: AnyRecord): Transaction {
  const nowIso = new Date().toISOString();
  return {
    uuid: toId(raw.historyId, `history-${Date.now()}`),
    transactionNo: toId(raw.transactionId, toId(raw.historyId, `TXN-${Date.now()}`)),
    type: mapHistoryType(raw.transactionType),
    amount: toNumber(raw.amount, 0),
    balanceBefore: toNumber(raw.balanceBefore, 0),
    balanceAfter: toNumber(raw.balanceAfter, 0),
    pointsChange: toNumber(raw.points, 0),
    orderUuid: toId(raw.relatedId),
    paymentUuid: toId(raw.transactionId),
    userUuid: toId(raw.userId),
    description: normalizeText(raw.remarks) || normalizeText(raw.transactionTypeName) || 'Transaction',
    remark: normalizeText(raw.remarks) || undefined,
    metadata: undefined,
    createdAt: normalizeText(raw.createdAt) || nowIso,
    updatedAt: normalizeText(raw.updatedAt) || nowIso,
  };
}

export class PaymentService implements IPaymentService {
  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    try {
      const client = getSdkworkClient();
      const response = await client.orders.pay(params.orderUuid, {
        orderId: params.orderUuid,
        paymentMethod: toSdkPaymentMethod(params.method),
      });
      const payData = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to initiate payment');

      const fallbackPayment: Payment = {
        uuid: toId(payData.paymentId, toId(payData.orderId, `payment-${Date.now()}`)),
        paymentNo: toId(payData.outTradeNo, toId(payData.paymentId, `PAY-${Date.now()}`)),
        orderUuid: params.orderUuid,
        orderNo: toId(payData.orderNo, params.orderUuid),
        amount: toNumber(payData.amount, 0),
        method: params.method,
        status: mapPaymentStatus(payData.status || 'PROCESSING'),
        userUuid: '',
        transactionId: toId(payData.transactionId),
        channel: normalizeText(payData.paymentMethod) || undefined,
        metadata: {
          paymentParams: payData.paymentParams,
          useBalance: params.useBalance,
          usePoints: params.usePoints,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const paymentId = toId(payData.paymentId);
      const latest = paymentId ? await this.getPaymentById(paymentId) : null;
      const payment = latest || fallbackPayment;
      const redirectUrl = resolveRedirectUrl(payData);

      return {
        success: true,
        payment,
        redirectUrl,
        transactionId: payment.transactionId,
      };
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
    const paymentId = toId(uuid);
    if (!paymentId) {
      return null;
    }

    const client = getSdkworkClient();
    const candidates: Array<() => Promise<unknown>> = [
      () => client.payments.getPaymentDetail(paymentId),
      () => client.payments.getPaymentStatus(paymentId),
      () => client.payments.getPaymentStatusByOutTradeNo(paymentId),
    ];

    for (const candidate of candidates) {
      try {
        const response = await candidate();
        const data = unwrapApiData<AnyRecord>(response as ApiEnvelope<AnyRecord>, 'Failed to load payment detail');
        return mapPaymentRecord(data);
      } catch {
        // try next candidate
      }
    }

    return null;
  }

  async getPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>> {
    const page = Math.max(1, toNumber(params.page, 1));
    const pageSize = Math.max(1, toNumber(params.pageSize, 10));
    const client = getSdkworkClient();
    const response = await client.payments.listPaymentRecords({
      page,
      pageNo: page,
      pageSize,
      size: pageSize,
      status: normalizeText(params.status) || undefined,
      keyword: params.keyword,
      startDate: params.startTime,
      endDate: params.endTime,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    const pageData = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to load payment list');
    const list = Array.isArray(pageData.content) ? pageData.content as AnyRecord[] : [];
    const items = list.map((item) => mapPaymentRecord(item));
    const total = toNumber(pageData.totalElements, items.length);
    const pageRaw = toNumber(pageData.number, page - 1);
    const currentPage = pageRaw + 1;
    const totalPages = Math.max(1, toNumber(pageData.totalPages, Math.ceil(total / Math.max(1, pageSize))));

    return {
      items,
      total,
      totalPages,
      currentPage,
      pageSize,
    };
  }

  async getMyPaymentList(params: TradePageRequest): Promise<TradePageResponse<Payment>> {
    return this.getPaymentList(params);
  }

  async requestRefund(params: RefundParams): Promise<Payment> {
    const existing = await this.getPaymentById(params.paymentUuid);
    if (!existing || !existing.orderUuid) {
      throw new Error('Cannot resolve related order for refund');
    }

    const client = getSdkworkClient();
    await client.orders.applyRefund(existing.orderUuid, {
      reason: normalizeText(params.reason) || 'user_refund_request',
    });

    const latest = await this.getPaymentById(params.paymentUuid);
    if (latest) {
      return {
        ...latest,
        status: latest.status === PaymentStatusEnum.SUCCESS ? PaymentStatusEnum.REFUNDING : latest.status,
      };
    }

    return {
      ...existing,
      status: PaymentStatusEnum.REFUNDING,
      refundAmount: params.amount || existing.amount,
      refundReason: normalizeText(params.reason) || undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  async initiateRecharge(params: RechargeParams): Promise<PaymentResult> {
    try {
      const client = getSdkworkClient();
      const response = await client.account.recharge({
        amount: params.amount,
        paymentMethod: toSdkPaymentMethod(params.method),
        remarks: params.remark,
      });
      const data = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to initiate recharge');
      const nowIso = new Date().toISOString();

      const payment: Payment = {
        uuid: toId(data.transactionId, `recharge-${Date.now()}`),
        paymentNo: toId(data.transactionId, `RECHARGE-${Date.now()}`),
        orderUuid: '',
        orderNo: '',
        amount: toNumber(data.amount, params.amount),
        method: mapPaymentMethod(data.paymentMethod, params.method),
        status: mapPaymentStatus(data.status || 'PROCESSING'),
        userUuid: toId(data.userId),
        transactionId: toId(data.transactionId),
        channel: normalizeText(data.paymentMethod) || undefined,
        createdAt: normalizeText(data.createdAt) || nowIso,
        updatedAt: normalizeText(data.updatedAt) || nowIso,
      };

      return {
        success: true,
        payment,
        redirectUrl: resolveRedirectUrl(data),
        transactionId: payment.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Recharge failed',
      };
    }
  }

  async getWallet(): Promise<Wallet> {
    const client = getSdkworkClient();
    const [cashResponse, pointsResponse] = await Promise.all([
      client.account.getCash(),
      client.account.getPoints().catch(() => ({ data: {} })),
    ]);

    const cashData = unwrapApiData<AnyRecord>(cashResponse as unknown as ApiEnvelope<AnyRecord>, 'Failed to load cash account');
    const pointsData = unwrapApiData<AnyRecord>(pointsResponse as unknown as ApiEnvelope<AnyRecord>, 'Failed to load points account');
    const nowIso = new Date().toISOString();

    return {
      uuid: toId(cashData.accountId, `wallet-${Date.now()}`),
      userUuid: toId(cashData.userId, toId(pointsData.userId)),
      balance: toNumber(cashData.availableBalance, toNumber(cashData.totalBalance, 0)),
      frozenBalance: toNumber(cashData.frozenBalance, 0),
      points: toNumber(pointsData.availablePoints, toNumber(pointsData.totalPoints, 0)),
      totalRecharged: toNumber(cashData.totalRecharged, 0),
      totalSpent: toNumber(cashData.totalSpent, 0),
      totalEarnedPoints: toNumber(pointsData.totalEarned, 0),
      totalUsedPoints: toNumber(pointsData.totalSpent, 0),
      createdAt: normalizeText(cashData.createdAt) || nowIso,
      updatedAt: normalizeText(cashData.updatedAt) || nowIso,
    };
  }

  async getTransactionList(params: TradePageRequest): Promise<TradePageResponse<Transaction>> {
    const page = Math.max(1, toNumber(params.page, 1));
    const pageSize = Math.max(1, toNumber(params.pageSize, 10));
    const client = getSdkworkClient();
    const response = await client.account.getHistoryCash({
      page,
      pageNo: page,
      pageSize,
      size: pageSize,
      type: normalizeText(params.type) || undefined,
      keyword: params.keyword,
      startTime: params.startTime,
      endTime: params.endTime,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    const pageData = unwrapApiData<AnyRecord>(response as unknown as ApiEnvelope<AnyRecord>, 'Failed to load transaction list');
    const list = Array.isArray(pageData.content) ? pageData.content as AnyRecord[] : [];
    const items = list.map((item) => mapHistoryTransaction(item));
    const total = toNumber(pageData.totalElements, items.length);
    const pageRaw = toNumber(pageData.number, page - 1);
    const currentPage = pageRaw + 1;
    const totalPages = Math.max(1, toNumber(pageData.totalPages, Math.ceil(total / Math.max(1, pageSize))));

    return {
      items,
      total,
      totalPages,
      currentPage,
      pageSize,
    };
  }

  async simulatePaymentCallback(paymentUuid: string, _success: boolean): Promise<void> {
    await this.queryPaymentStatus(paymentUuid);
  }
}

export const paymentService = new PaymentService();
