import type {
  MagicStudioApiListEnvelope,
  MagicStudioServerClient,
  MagicStudioTradePayment,
  MagicStudioTradePaymentActionResult,
  MagicStudioTradePaymentCreateRequest,
  MagicStudioTradePaymentRechargeRequest,
  MagicStudioTradePaymentRefundRequest,
  MagicStudioTradeTransaction,
  MagicStudioTradeTransactionListQuery,
  MagicStudioTradeWallet,
} from '@sdkwork/magic-studio-server';

type CreatePaymentRequest = Parameters<MagicStudioServerClient['createTradePayment']>[0];
type RechargeRequest = Parameters<MagicStudioServerClient['rechargeTradeWallet']>[0];
type RefundRequest = Parameters<MagicStudioServerClient['refundTradePayment']>[1];
type TransactionQuery = Parameters<MagicStudioServerClient['listTradeTransactions']>[0];

const validCreatePaymentRequest = {
  orderUuid: 'order-1',
  method: 'ALIPAY',
  useBalance: undefined,
  usePoints: undefined,
} satisfies CreatePaymentRequest satisfies MagicStudioTradePaymentCreateRequest;

const validRechargeRequest = {
  amount: 8800,
  method: 'WECHAT_PAY',
  remark: 'wallet topup',
} satisfies RechargeRequest satisfies MagicStudioTradePaymentRechargeRequest;

const validRefundRequest = {
  amount: 1299,
  reason: 'duplicate-order',
} satisfies RefundRequest satisfies MagicStudioTradePaymentRefundRequest;

const validTransactionQuery = {
  page: 2,
  pageSize: 5,
  sortBy: 'latest',
  sortOrder: 'asc',
  keyword: 'wallet topup',
  type: 'RECHARGE',
  startTime: '2026-04-01T00:00:00.000Z',
  endTime: '2026-04-06T00:00:00.000Z',
} satisfies TransactionQuery satisfies MagicStudioTradeTransactionListQuery;

const validPayment = {
  uuid: 'payment-1',
  paymentNo: 'PAY-1',
  orderUuid: 'order-1',
  orderNo: 'ORDER-1',
  amount: 1299,
  method: 'ALIPAY',
  status: 'PROCESSING',
  userUuid: 'user-1',
  transactionId: 'txn-1',
  channel: 'alipay',
  createdAt: '2026-04-06T00:00:00.000Z',
  updatedAt: '2026-04-06T00:00:00.000Z',
} satisfies MagicStudioTradePayment;

const validPaymentActionResult = {
  success: true,
  payment: validPayment,
  redirectUrl: 'https://pay.example.com/order-1',
  transactionId: 'txn-1',
} satisfies MagicStudioTradePaymentActionResult;

const validWallet = {
  uuid: 'wallet-1',
  userUuid: 'user-1',
  balance: 18800,
  frozenBalance: 0,
  points: 320,
  totalRecharged: 28800,
  totalSpent: 10000,
  totalEarnedPoints: 500,
  totalUsedPoints: 180,
  createdAt: '2026-04-06T00:00:00.000Z',
  updatedAt: '2026-04-06T00:00:00.000Z',
} satisfies MagicStudioTradeWallet;

const validTransaction = {
  uuid: 'transaction-1',
  transactionNo: 'TXN-1',
  type: 'RECHARGE',
  amount: 8800,
  balanceBefore: 10000,
  balanceAfter: 18800,
  pointsChange: 0,
  paymentUuid: 'payment-1',
  userUuid: 'user-1',
  description: 'wallet topup',
  createdAt: '2026-04-06T10:00:00.000Z',
  updatedAt: '2026-04-06T10:05:00.000Z',
} satisfies MagicStudioTradeTransaction;

const validTransactionList = {
  requestId: 'req-transaction-list-1',
  timestamp: '2026-04-06T10:05:00.000Z',
  items: [validTransaction],
  meta: {
    page: 2,
    pageSize: 5,
    total: 1,
    version: '2026-04-06',
  },
} satisfies MagicStudioApiListEnvelope<MagicStudioTradeTransaction>;

void validCreatePaymentRequest;
void validRechargeRequest;
void validRefundRequest;
void validTransactionQuery;
void validPaymentActionResult;
void validWallet;
void validTransactionList;
