/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, render, screen, waitFor } from '@/tests/support/reactTesting';
import { PaymentDialog } from './PaymentDialog';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus, type Order } from '../../entities';

const mocks = vi.hoisted(() => ({
  initiatePayment: vi.fn(),
  simulatePaymentCallback: vi.fn(),
}));

vi.mock('../../services', () => ({
  SUPPORTED_ORDER_PAYMENT_METHODS: ['ALIPAY', 'WECHAT_PAY'],
  tradeBusinessService: {
    paymentService: {
      initiatePayment: mocks.initiatePayment,
      simulatePaymentCallback: mocks.simulatePaymentCallback,
    },
  },
}));

vi.mock('../../useTradeI18n', () => ({
  formatTradeCurrency: (amount: number) => `CNY ${amount / 100}`,
  useTradeI18n: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === 'market.payment.confirm') {
        return `Pay ${params?.amount ?? ''}`.trim();
      }

      const dictionary: Record<string, string> = {
        'market.payment.title': 'Payment',
        'market.payment.amount': 'Amount',
        'market.payment.method': 'Method',
        'market.common.cancel': 'Cancel',
        'market.payment.processing': 'Processing',
        'market.payment.redirecting': 'Redirecting',
        'market.payment.continue_to_provider': 'Continue',
      };

      return dictionary[key] ?? key;
    },
    paymentMethodLabel: (method: string) => {
      const labels: Record<string, string> = {
        ALIPAY: 'Alipay',
        WECHAT_PAY: 'WeChat Pay',
        CREDIT_CARD: 'Credit Card',
        BALANCE: 'Balance',
        POINTS: 'Points',
      };
      return labels[method] ?? method;
    },
    paymentMethodDescription: (method: string) => `desc:${method}`,
  }),
}));

describe('PaymentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const buildOrder = (): Order => ({
    uuid: 'order-1',
    orderNo: 'ORDER-1',
    type: OrderType.VIDEO_GENERATION,
    status: OrderStatus.PENDING_PAYMENT,
    title: 'Video task',
    amount: 1299,
    paidAmount: 0,
    usedPoints: 0,
    usedBalance: 0,
    paymentStatus: PaymentStatus.PENDING,
    userUuid: 'user-1',
    createdAt: '2026-04-06T00:00:00.000Z',
    updatedAt: '2026-04-06T00:00:00.000Z',
  });

  it('shows only app-api supported order payment methods', () => {
    const html = renderToStaticMarkup(
      <PaymentDialog
        order={buildOrder()}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('Alipay');
    expect(html).toContain('WeChat Pay');
    expect(html).not.toContain('Credit Card');
    expect(html).not.toContain('Balance');
    expect(html).not.toContain('Points');
    expect(html).not.toContain('market.payment.use_balance');
    expect(html).not.toContain('market.payment.use_points');
  });

  it('does not simulate a payment callback or report success while the payment is still pending', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mocks.initiatePayment.mockResolvedValueOnce({
      success: true,
      payment: {
        uuid: 'payment-1',
        paymentNo: 'PAY-1',
        orderUuid: 'order-1',
        orderNo: 'ORDER-1',
        amount: 1299,
        method: PaymentMethod.ALIPAY,
        status: PaymentStatus.PENDING,
        userUuid: 'user-1',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      },
    });

    render(
      <PaymentDialog
        order={buildOrder()}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const payButton = screen.getAllByText('Pay CNY 12.99')[0]?.closest('button');
    expect(payButton).toBeTruthy();

    await act(async () => {
      payButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await waitFor(() => expect(mocks.initiatePayment).toHaveBeenCalledTimes(1));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.simulatePaymentCallback).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps redirect payments pending for the provider callback instead of locally settling them', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mocks.initiatePayment.mockResolvedValueOnce({
      success: true,
      redirectUrl: 'https://pay.example.com/order-1',
      payment: {
        uuid: 'payment-redirect-1',
        paymentNo: 'PAY-REDIRECT-1',
        orderUuid: 'order-1',
        orderNo: 'ORDER-1',
        amount: 1299,
        method: PaymentMethod.ALIPAY,
        status: PaymentStatus.PROCESSING,
        userUuid: 'user-1',
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z',
      },
    });

    render(
      <PaymentDialog
        order={buildOrder()}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const payButton = screen.getAllByText('Pay CNY 12.99')[0]?.closest('button');
    expect(payButton).toBeTruthy();

    await act(async () => {
      payButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await waitFor(() => expect(document.body.textContent).toContain('Continue'));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.simulatePaymentCallback).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
