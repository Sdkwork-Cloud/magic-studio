import type {
  MagicStudioApiListEnvelope,
  MagicStudioTradeOrder,
  MagicStudioTradeOrderListQuery,
  MagicStudioTradeOrderSortBy,
  MagicStudioTradeOrderStatistics,
  MagicStudioTradeOrderStatus,
  MagicStudioTradeOrderType,
  MagicStudioTradePayment,
  MagicStudioTradePaymentActionResult,
  MagicStudioTradePaymentListQuery,
  MagicStudioTradePaymentMethod,
  MagicStudioTradePaymentSortBy,
  MagicStudioTradePaymentStatus,
  MagicStudioTradeSortOrder,
  MagicStudioTradeTaskType,
  MagicStudioTradeTransaction,
  MagicStudioTradeTransactionListQuery,
  MagicStudioTradeTransactionSortBy,
  MagicStudioTradeTransactionType,
  MagicStudioTradeWallet,
} from '@sdkwork/magic-studio-server';

import type {
  Order,
  OrderStatistics,
  Payment,
  TradePageRequest,
  TradePageResponse,
  Transaction,
  Wallet,
} from '../entities';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TaskType,
} from '../entities';

const ORDER_SORT_BY: readonly MagicStudioTradeOrderSortBy[] = [
  'latest',
  'amount',
  'status',
];

const PAYMENT_SORT_BY: readonly MagicStudioTradePaymentSortBy[] = [
  'latest',
  'amount',
  'status',
];

const TRANSACTION_SORT_BY: readonly MagicStudioTradeTransactionSortBy[] = [
  'latest',
  'amount',
  'type',
];

const TRADE_SORT_ORDERS: readonly MagicStudioTradeSortOrder[] = ['asc', 'desc'];
const TRADE_ORDER_STATUSES = Object.values(OrderStatus) as MagicStudioTradeOrderStatus[];
const TRADE_ORDER_TYPES = Object.values(OrderType) as MagicStudioTradeOrderType[];
const TRADE_PAYMENT_METHODS = Object.values(PaymentMethod) as MagicStudioTradePaymentMethod[];
const TRADE_PAYMENT_STATUSES = Object.values(PaymentStatus) as MagicStudioTradePaymentStatus[];
const TRADE_TASK_TYPES = Object.values(TaskType) as MagicStudioTradeTaskType[];
const TRADE_TRANSACTION_TYPES: readonly MagicStudioTradeTransactionType[] = [
  'RECHARGE',
  'CONSUME',
  'REFUND',
  'TRANSFER',
  'REWARD',
  'WITHDRAW',
];

function normalizeOptionalText(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizePositiveInteger(value?: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value > 0 ? Math.trunc(value) : undefined;
}

function normalizeIdentifier(value?: string | number | null): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function normalizeEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTradePageResponse<TInput, TOutput>(
  envelope: MagicStudioApiListEnvelope<TInput>,
  mapItem: (item: TInput) => TOutput,
): TradePageResponse<TOutput> {
  const pageSize = envelope.meta.pageSize;
  const total = envelope.meta.total;

  return {
    items: envelope.items.map(mapItem),
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    currentPage: envelope.meta.page,
    pageSize,
  };
}

export function normalizeTradeTaskType(value?: string): MagicStudioTradeTaskType | undefined {
  return normalizeEnum(value, TRADE_TASK_TYPES);
}

export function mapTradeOrder(order: MagicStudioTradeOrder): Order {
  return {
    uuid: order.uuid,
    orderNo: order.orderNo,
    type: order.type as OrderType,
    status: order.status as OrderStatus,
    title: order.title,
    description: normalizeOptionalText(order.description),
    amount: order.amount,
    paidAmount: order.paidAmount,
    usedPoints: order.usedPoints,
    usedBalance: order.usedBalance,
    paymentMethod: order.paymentMethod ? (order.paymentMethod as PaymentMethod) : undefined,
    paymentStatus: order.paymentStatus as PaymentStatus,
    taskUuid: normalizeOptionalText(order.taskUuid),
    taskType: order.taskType ? (order.taskType as TaskType) : undefined,
    taskParams: isRecord(order.taskParams) ? order.taskParams : undefined,
    resourceUuids: Array.isArray(order.resourceUuids) ? order.resourceUuids : undefined,
    userUuid: order.userUuid,
    workspaceUuid: normalizeOptionalText(order.workspaceUuid),
    projectUuid: normalizeOptionalText(order.projectUuid),
    remark: normalizeOptionalText(order.remark),
    cancelReason: normalizeOptionalText(order.cancelReason),
    failureReason: normalizeOptionalText(order.failureReason),
    paidAt: normalizeOptionalText(order.paidAt),
    completedAt: normalizeOptionalText(order.completedAt),
    cancelledAt: normalizeOptionalText(order.cancelledAt),
    expiresAt: normalizeOptionalText(order.expiresAt),
    metadata: isRecord(order.metadata) ? order.metadata : undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function mapTradePayment(payment: MagicStudioTradePayment): Payment {
  return {
    uuid: payment.uuid,
    paymentNo: payment.paymentNo,
    orderUuid: payment.orderUuid,
    orderNo: payment.orderNo,
    amount: payment.amount,
    method: payment.method as PaymentMethod,
    status: payment.status as PaymentStatus,
    userUuid: payment.userUuid,
    transactionId: normalizeOptionalText(payment.transactionId),
    channel: normalizeOptionalText(payment.channel),
    errorMessage: normalizeOptionalText(payment.errorMessage),
    paidAt: normalizeOptionalText(payment.paidAt),
    refundedAt: normalizeOptionalText(payment.refundedAt),
    refundAmount: typeof payment.refundAmount === 'number' ? payment.refundAmount : undefined,
    refundReason: normalizeOptionalText(payment.refundReason),
    receiptUrl: normalizeOptionalText(payment.receiptUrl),
    metadata: isRecord(payment.metadata) ? payment.metadata : undefined,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export function mapTradeWallet(wallet: MagicStudioTradeWallet): Wallet {
  return {
    uuid: wallet.uuid,
    userUuid: wallet.userUuid,
    balance: wallet.balance,
    frozenBalance: wallet.frozenBalance,
    points: wallet.points,
    totalRecharged: wallet.totalRecharged,
    totalSpent: wallet.totalSpent,
    totalEarnedPoints: wallet.totalEarnedPoints,
    totalUsedPoints: wallet.totalUsedPoints,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

export function mapTradeTransaction(transaction: MagicStudioTradeTransaction): Transaction {
  return {
    uuid: transaction.uuid,
    transactionNo: transaction.transactionNo,
    type: transaction.type,
    amount: transaction.amount,
    balanceBefore: transaction.balanceBefore,
    balanceAfter: transaction.balanceAfter,
    pointsChange: transaction.pointsChange,
    orderUuid: normalizeOptionalText(transaction.orderUuid),
    paymentUuid: normalizeOptionalText(transaction.paymentUuid),
    userUuid: transaction.userUuid,
    description: transaction.description,
    remark: normalizeOptionalText(transaction.remark),
    metadata: isRecord(transaction.metadata) ? transaction.metadata : undefined,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

export function mapTradeOrderStatistics(
  statistics: MagicStudioTradeOrderStatistics,
): OrderStatistics {
  return {
    totalOrders: statistics.totalOrders,
    pendingPaymentOrders: statistics.pendingPaymentOrders,
    inProgressOrders: statistics.inProgressOrders,
    completedOrders: statistics.completedOrders,
    totalSpent: statistics.totalSpent,
    monthSpent: statistics.monthSpent,
  };
}

export function mapTradePaymentActionResult(
  result: MagicStudioTradePaymentActionResult,
): {
  success: boolean;
  payment?: Payment;
  errorMessage?: string;
  redirectUrl?: string;
  transactionId?: string;
} {
  return {
    success: result.success,
    payment: result.payment ? mapTradePayment(result.payment) : undefined,
    errorMessage: normalizeOptionalText(result.errorMessage),
    redirectUrl: normalizeOptionalText(result.redirectUrl),
    transactionId: normalizeOptionalText(result.transactionId),
  };
}

export function mapTradeOrderPage(
  envelope: MagicStudioApiListEnvelope<MagicStudioTradeOrder>,
): TradePageResponse<Order> {
  return toTradePageResponse(envelope, mapTradeOrder);
}

export function mapTradePaymentPage(
  envelope: MagicStudioApiListEnvelope<MagicStudioTradePayment>,
): TradePageResponse<Payment> {
  return toTradePageResponse(envelope, mapTradePayment);
}

export function mapTradeTransactionPage(
  envelope: MagicStudioApiListEnvelope<MagicStudioTradeTransaction>,
): TradePageResponse<Transaction> {
  return toTradePageResponse(envelope, mapTradeTransaction);
}

export function toTradeOrderQuery(
  params: TradePageRequest,
): MagicStudioTradeOrderListQuery {
  return {
    page: normalizePositiveInteger(params.page),
    pageSize: normalizePositiveInteger(params.pageSize),
    sortBy: normalizeEnum(params.sortBy, ORDER_SORT_BY),
    sortOrder: normalizeEnum(params.sortOrder, TRADE_SORT_ORDERS),
    keyword: normalizeOptionalText(params.keyword),
    status: normalizeEnum(params.status, TRADE_ORDER_STATUSES),
    type: normalizeEnum(params.type, TRADE_ORDER_TYPES),
    startTime: normalizeOptionalText(params.startTime),
    endTime: normalizeOptionalText(params.endTime),
  };
}

export function toTradePaymentQuery(
  params: TradePageRequest,
): MagicStudioTradePaymentListQuery {
  return {
    page: normalizePositiveInteger(params.page),
    pageSize: normalizePositiveInteger(params.pageSize),
    sortBy: normalizeEnum(params.sortBy, PAYMENT_SORT_BY),
    sortOrder: normalizeEnum(params.sortOrder, TRADE_SORT_ORDERS),
    keyword: normalizeOptionalText(params.keyword),
    status: normalizeEnum(params.status, TRADE_PAYMENT_STATUSES),
    method: normalizeEnum(params.type, TRADE_PAYMENT_METHODS),
    startTime: normalizeOptionalText(params.startTime),
    endTime: normalizeOptionalText(params.endTime),
  };
}

export function toTradeTransactionQuery(
  params: TradePageRequest,
): MagicStudioTradeTransactionListQuery {
  return {
    page: normalizePositiveInteger(params.page),
    pageSize: normalizePositiveInteger(params.pageSize),
    sortBy: normalizeEnum(params.sortBy, TRANSACTION_SORT_BY),
    sortOrder: normalizeEnum(params.sortOrder, TRADE_SORT_ORDERS),
    keyword: normalizeOptionalText(params.keyword),
    type: normalizeEnum(params.type, TRADE_TRANSACTION_TYPES),
    startTime: normalizeOptionalText(params.startTime),
    endTime: normalizeOptionalText(params.endTime),
  };
}

export function normalizeTradeIdentifier(
  value?: string | number | null,
): string | undefined {
  return normalizeIdentifier(value);
}
