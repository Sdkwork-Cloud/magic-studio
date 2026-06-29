import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const serverClient = {
    createTradePayment: vi.fn(),
    listTradePayments: vi.fn(),
    listTradeTransactions: vi.fn(),
    readTradePayment: vi.fn(),
    readTradeWallet: vi.fn(),
    rechargeTradeWallet: vi.fn(),
    refundTradePayment: vi.fn(),
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

import { PaymentMethod } from '../entities';
import { paymentService } from './paymentService';

const basePayment = {
  uuid: 'payment-1',
  paymentNo: 'PAY-1',
  orderUuid: 'order-1',
  orderNo: 'ORDER-1',
  amount: 1299,
  method: 'ALIPAY' as const,
  status: 'PROCESSING' as const,
  userUuid: '1',
  createdAt: '2026-04-06T00:00:00.000Z',
  updatedAt: '2026-04-06T00:00:00.000Z',
};

const buildListEnvelope = <T,>(items: T[]) => ({
  items,
  meta: {
    page: 2,
    pageSize: 5,
    total: items.length,
  },
});

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes order payments through the canonical runtime server client', async () => {
    mocks.serverClient.createTradePayment.mockResolvedValueOnce({
      data: {
        success: true,
        payment: basePayment,
        redirectUrl: 'https://pay.example.com/order-1',
        transactionId: 'txn-1',
      },
    });

    const result = await paymentService.initiatePayment({
      orderUuid: 'order-1',
      method: PaymentMethod.ALIPAY,
    });

    expect(mocks.readDefaultPlatformRuntime).toHaveBeenCalledWith('PaymentService');
    expect(mocks.createRuntimeMagicStudioServerClient).toHaveBeenCalledTimes(1);
    expect(mocks.serverClient.createTradePayment).toHaveBeenCalledWith({
      orderUuid: 'order-1',
      method: PaymentMethod.ALIPAY,
      useBalance: undefined,
      usePoints: undefined,
    });
    expect(result).toMatchObject({
      success: true,
      redirectUrl: 'https://pay.example.com/order-1',
      transactionId: 'txn-1',
      payment: {
        uuid: 'payment-1',
        status: 'PROCESSING',
      },
    });
  });

  it.each([
    PaymentMethod.BALANCE,
    PaymentMethod.POINTS,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.MIXED,
  ])('rejects unsupported order payment method %s before calling the server', async (method) => {
    const result = await paymentService.initiatePayment({
      orderUuid: 'order-unsupported-1',
      method,
    });

    expect(result).toMatchObject({
      success: false,
      errorMessage: `Magic Studio order payment does not support payment method: ${method}`,
    });
    expect(mocks.serverClient.createTradePayment).not.toHaveBeenCalled();
  });

  it('routes recharge through the canonical runtime server client', async () => {
    mocks.serverClient.rechargeTradeWallet.mockResolvedValueOnce({
      data: {
        success: true,
        payment: {
          ...basePayment,
          uuid: 'payment-recharge-1',
          paymentNo: 'PAY-RECHARGE-1',
          orderUuid: 'wallet-recharge',
          orderNo: 'RECHARGE-1',
          method: 'WECHAT_PAY',
        },
        redirectUrl: 'https://pay.example.com/recharge-1',
      },
    });

    const result = await paymentService.initiateRecharge({
      amount: 8800,
      method: PaymentMethod.WECHAT_PAY,
      remark: 'wallet topup',
    });

    expect(mocks.serverClient.rechargeTradeWallet).toHaveBeenCalledWith({
      amount: 8800,
      method: PaymentMethod.WECHAT_PAY,
      remark: 'wallet topup',
    });
    expect(result).toMatchObject({
      success: true,
      redirectUrl: 'https://pay.example.com/recharge-1',
      payment: {
        uuid: 'payment-recharge-1',
        method: PaymentMethod.WECHAT_PAY,
      },
    });
  });

  it('routes refunds through the canonical runtime server client', async () => {
    mocks.serverClient.refundTradePayment.mockResolvedValueOnce({
      data: {
        ...basePayment,
        status: 'REFUNDING',
        refundAmount: 1299,
        refundReason: 'duplicate-order',
      },
    });

    const result = await paymentService.requestRefund({
      paymentUuid: 'payment-1',
      amount: 1299,
      reason: 'duplicate-order',
    });

    expect(mocks.serverClient.refundTradePayment).toHaveBeenCalledWith('payment-1', {
      amount: 1299,
      reason: 'duplicate-order',
    });
    expect(result).toMatchObject({
      uuid: 'payment-1',
      status: 'REFUNDING',
      refundAmount: 1299,
      refundReason: 'duplicate-order',
    });
  });

  it('routes transaction history through the canonical runtime server client', async () => {
    mocks.serverClient.listTradeTransactions.mockResolvedValueOnce(buildListEnvelope([
      {
        uuid: 'transaction-1',
        transactionNo: 'TXN-1',
        type: 'RECHARGE',
        amount: 8800,
        balanceBefore: 10000,
        balanceAfter: 18800,
        pointsChange: 0,
        orderUuid: null,
        paymentUuid: 'payment-recharge-1',
        userUuid: '1',
        description: 'wallet topup',
        remark: null,
        createdAt: '2026-04-06T10:00:00.000Z',
        updatedAt: '2026-04-06T10:05:00.000Z',
      },
    ]));

    const result = await paymentService.getTransactionList({
      page: 2,
      pageSize: 5,
      status: 'SUCCESS',
      type: 'RECHARGE',
      startTime: '2026-04-01T00:00:00.000Z',
      endTime: '2026-04-06T00:00:00.000Z',
      sortBy: 'createdAt',
      sortOrder: 'asc',
      keyword: 'wallet topup',
    });

    expect(mocks.serverClient.listTradeTransactions).toHaveBeenCalledWith({
      page: 2,
      pageSize: 5,
      sortBy: undefined,
      sortOrder: 'asc',
      keyword: 'wallet topup',
      type: 'RECHARGE',
      startTime: '2026-04-01T00:00:00.000Z',
      endTime: '2026-04-06T00:00:00.000Z',
    });
    expect(result).toMatchObject({
      total: 1,
      totalPages: 1,
      currentPage: 2,
      pageSize: 5,
      items: [
        {
          uuid: 'transaction-1',
          transactionNo: 'TXN-1',
          type: 'RECHARGE',
          amount: 8800,
          paymentUuid: 'payment-recharge-1',
          description: 'wallet topup',
        },
      ],
    });
  });

  it('ships a payment service contract typecheck guard for Magic Studio server drift', async () => {
    await expect(
      access(
        new URL('./paymentService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('does not expose simulated payment callback helpers in production payment service code', async () => {
    const source = await readFile(
      new URL('./paymentService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('simulatePaymentCallback')).toBe(false);
    expect(source.includes('simulateTradePaymentCallback')).toBe(false);
  });

  it('ships a dedicated trade contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
