import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, Shield, X } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { PlanTier } from '../entities';
import { useVipStore } from '../store';

type PaymentMethod = 'wechat' | 'alipay';
type PaymentPhase = 'idle' | 'processing' | 'success' | 'failed';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: PlanTier;
  planName: string;
  price: number;
  currency: string;
  billingCycle: string;
  purchaseCycle: 'month' | 'year' | 'onetime';
}

function resolveCurrencySymbol(currency: string): string {
  const normalized = (currency || '').trim().toUpperCase();
  if (normalized === 'CNY') {
    return '¥';
  }
  if (normalized === 'USD') {
    return '$';
  }
  if (normalized === 'EUR') {
    return '€';
  }
  return normalized || '¥';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  price,
  currency,
  billingCycle,
  purchaseCycle,
}) => {
  const { t } = useTranslation();
  const { subscribe, isProcessing } = useVipStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [message, setMessage] = useState<string>(
    t('vip.payment.idle', 'Confirm to submit VIP purchase via SDK.'),
  );

  const currencySymbol = useMemo(() => resolveCurrencySymbol(currency), [currency]);
  const canConfirm = phase !== 'processing' && phase !== 'success' && !isProcessing;

  const resolveMethodLabel = (method: PaymentMethod): string =>
    method === 'wechat'
      ? t('vip.payment.wechat', 'WeChat Pay')
      : t('vip.payment.alipay', 'Alipay');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setSelectedMethod('wechat');
    setPhase('idle');
    setMessage(t('vip.payment.idle', 'Confirm to submit VIP purchase via SDK.'));
  }, [currency, isOpen, planId, planName, price, purchaseCycle, t]);

  const handleConfirmPayment = async () => {
    if (!canConfirm) {
      return;
    }
    setPhase('processing');
    setMessage(
      t('vip.payment.submitting', {
        method: resolveMethodLabel(selectedMethod),
      }),
    );
    try {
      await subscribe(planId, purchaseCycle);
      setPhase('success');
      setMessage(
        t(
          'vip.payment.success',
          'Purchase successful. VIP status has been refreshed.',
        ),
      );
    } catch (error) {
      setPhase('failed');
      setMessage(
        error instanceof Error
          ? error.message
          : t('vip.payment.failed', 'Purchase failed. Please retry.'),
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[640px] rounded-2xl border border-[#2a2a2a] bg-[#0f0f10] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#232326] px-6 py-4">
          <div className="flex items-center gap-2 text-[#e5e7eb]">
            <Shield className="h-5 w-5 text-[#22c55e]" />
            <span className="text-sm font-medium">
              {t('vip.payment.title', 'Secure VIP Purchase')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[#9ca3af] transition hover:bg-[#1f1f22] hover:text-[#ffffff]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#151518] p-4">
            <div className="text-xs uppercase tracking-[0.08em] text-[#6b7280]">
              {t('vip.payment.plan', 'Plan')}
            </div>
            <div className="mt-2 text-lg font-semibold text-[#ffffff]">{planName}</div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-base text-[#9ca3af]">{currencySymbol}</span>
              <span className="text-3xl font-bold text-[#ffffff]">{price}</span>
              <span className="pb-1 text-sm text-[#9ca3af]">/{billingCycle}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.08em] text-[#6b7280]">
              {t('vip.payment.payment_method', 'Payment Method')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMethod('wechat')}
                className={`rounded-lg border px-4 py-3 text-sm transition ${
                  selectedMethod === 'wechat'
                    ? 'border-[#22c55e] bg-[#22c55e1a] text-[#22c55e]'
                    : 'border-[#2a2a2a] bg-[#161618] text-[#d1d5db] hover:border-[#3a3a3f]'
                }`}
              >
                {t('vip.payment.wechat', 'WeChat Pay')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('alipay')}
                className={`rounded-lg border px-4 py-3 text-sm transition ${
                  selectedMethod === 'alipay'
                    ? 'border-[#3b82f6] bg-[#3b82f61a] text-[#60a5fa]'
                    : 'border-[#2a2a2a] bg-[#161618] text-[#d1d5db] hover:border-[#3a3a3f]'
                }`}
              >
                {t('vip.payment.alipay', 'Alipay')}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#2a2a2a] bg-[#131315] px-3 py-2.5 text-xs text-[#9ca3af]">
            {t(
              'vip.payment.hint',
              'This action uses the latest SDK and directly calls the backend VIP purchase API. No mock payment data is used.',
            )}
          </div>

          <div className="rounded-lg border border-[#2a2a2a] bg-[#131315] px-3 py-2.5 text-sm text-[#d1d5db]">
            {phase === 'success' ? (
              <span className="flex items-center gap-2 text-[#22c55e]">
                <CheckCircle2 size={16} />
                {message}
              </span>
            ) : phase === 'processing' ? (
              <span className="flex items-center gap-2 text-[#93c5fd]">
                <Loader2 size={16} className="animate-spin" />
                {message}
              </span>
            ) : phase === 'failed' ? (
              <span className="text-[#f87171]">{message}</span>
            ) : (
              <span>{message}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#232326] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm text-[#d1d5db] transition hover:bg-[#1f1f22]"
          >
            {t('vip.payment.close', 'Close')}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmPayment()}
            disabled={!canConfirm}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === 'processing' || isProcessing
              ? t('vip.payment.processing', 'Processing...')
              : phase === 'success'
                ? t('vip.payment.purchased', 'Purchased')
                : t('vip.payment.confirm', 'Confirm Purchase')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
