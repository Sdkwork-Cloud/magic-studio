import React, { useState } from 'react';
import { Coins, CreditCard, Loader2, Smartphone, Wallet, X } from 'lucide-react';
import { cn } from '@sdkwork/react-commons';
import type { Order, PaymentMethod } from '../../entities';
import { PaymentMethod as PaymentMethodEnum } from '../../entities';
import { tradeBusinessService } from '../../services';
import { formatTradeCurrency, useTradeI18n } from '../../useTradeI18n';

interface PaymentDialogProps {
  order: Order;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const { t, paymentMethodLabel, paymentMethodDescription } = useTradeI18n();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethodEnum.ALIPAY);
  const [useBalance, setUseBalance] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const paymentMethods: PaymentMethodOption[] = [
    { id: PaymentMethodEnum.ALIPAY, name: paymentMethodLabel(PaymentMethodEnum.ALIPAY), description: paymentMethodDescription(PaymentMethodEnum.ALIPAY), icon: Smartphone, enabled: true },
    { id: PaymentMethodEnum.WECHAT_PAY, name: paymentMethodLabel(PaymentMethodEnum.WECHAT_PAY), description: paymentMethodDescription(PaymentMethodEnum.WECHAT_PAY), icon: Smartphone, enabled: true },
    { id: PaymentMethodEnum.CREDIT_CARD, name: paymentMethodLabel(PaymentMethodEnum.CREDIT_CARD), description: paymentMethodDescription(PaymentMethodEnum.CREDIT_CARD), icon: CreditCard, enabled: true },
    { id: PaymentMethodEnum.BALANCE, name: paymentMethodLabel(PaymentMethodEnum.BALANCE), description: paymentMethodDescription(PaymentMethodEnum.BALANCE), icon: Wallet, enabled: true },
    { id: PaymentMethodEnum.POINTS, name: paymentMethodLabel(PaymentMethodEnum.POINTS), description: paymentMethodDescription(PaymentMethodEnum.POINTS), icon: Coins, enabled: true },
  ];

  const handlePay = async () => {
    setProcessing(true);
    try {
      const result = await tradeBusinessService.paymentService.initiatePayment({
        orderUuid: order.uuid,
        method: selectedMethod,
        useBalance: useBalance ? order.amount : undefined,
        usePoints: usePoints ? 10000 : undefined,
      });

      if (result.success) {
        if (result.redirectUrl) {
          setRedirectUrl(result.redirectUrl);
          setTimeout(() => {
            if (result.payment) {
              void tradeBusinessService.paymentService.simulatePaymentCallback(result.payment.uuid, true);
            }
            onSuccess?.();
            onClose();
          }, 3000);
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        alert(result.errorMessage || t('market.payment.failed'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(t('market.payment.retry_failed'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">{t('market.payment.title')}</h2>
            <p className="text-xs text-gray-500">{order.orderNo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="text-sm text-gray-400 mb-1">{t('market.payment.amount')}</div>
            <div className="text-3xl font-bold text-white">{formatTradeCurrency(order.amount)}</div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t('market.payment.method')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;

                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={!method.enabled}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/50'
                        : 'bg-[#2a2a2d] border-white/10 hover:border-white/20',
                      !method.enabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <Icon size={24} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{method.name}</div>
                      <div className="text-[10px] text-gray-500">{method.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-[#2a2a2d] rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">{t('market.payment.use_balance')}</span>
              </div>
              <input
                type="checkbox"
                checked={useBalance}
                onChange={(event) => setUseBalance(event.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[#2a2a2d] rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">{t('market.payment.use_points')}</span>
              </div>
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(event) => setUsePoints(event.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {redirectUrl && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <div className="text-sm text-blue-400 mb-2">{t('market.payment.redirecting')}</div>
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CreditCard size={16} />
                {t('market.payment.continue_to_provider')}
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {t('market.common.cancel')}
          </button>
          <button
            onClick={() => void handlePay()}
            disabled={processing || !!redirectUrl}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              processing && 'bg-blue-500',
            )}
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('market.payment.processing')}
              </>
            ) : (
              <>
                <CreditCard size={16} />
                {t('market.payment.confirm', { amount: formatTradeCurrency(order.amount) })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
