import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Wallet, Coins, Loader2 } from 'lucide-react';
import type { Order, PaymentMethod } from '../../entities';
import { PaymentMethod as PaymentMethodEnum } from '../../entities';
import { paymentService } from '../../services/paymentService';
import { cn } from '@sdkwork/react-commons';

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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethodEnum.ALIPAY);
  const [useBalance, setUseBalance] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: PaymentMethodEnum.ALIPAY,
      name: '支付宝',
      description: '推荐使用',
      icon: Smartphone,
      enabled: true,
    },
    {
      id: PaymentMethodEnum.WECHAT_PAY,
      name: '微信支付',
      description: '扫码支付',
      icon: Smartphone,
      enabled: true,
    },
    {
      id: PaymentMethodEnum.CREDIT_CARD,
      name: '信用卡',
      description: '支持 Visa/Master',
      icon: CreditCard,
      enabled: true,
    },
    {
      id: PaymentMethodEnum.BALANCE,
      name: '余额支付',
      description: '账户余额',
      icon: Wallet,
      enabled: true,
    },
    {
      id: PaymentMethodEnum.POINTS,
      name: '积分支付',
      description: '100 积分=1 元',
      icon: Coins,
      enabled: true,
    },
  ];

  const formatAmount = (amount: number) => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const result = await paymentService.initiatePayment({
        orderUuid: order.uuid,
        method: selectedMethod,
        useBalance: useBalance ? order.amount : undefined,
        usePoints: usePoints ? 10000 : undefined, // 示例：使用 10000 积分
      });

      if (result.success) {
        if (result.redirectUrl) {
          // 第三方支付，跳转
          setRedirectUrl(result.redirectUrl);
          // 模拟支付回调 (实际场景中应该等待回调)
          setTimeout(() => {
            paymentService.simulatePaymentCallback(result.payment!.uuid, true);
            onSuccess?.();
            onClose();
          }, 3000);
        } else {
          // 余额/积分支付，直接成功
          onSuccess?.();
          onClose();
        }
      } else {
        alert(result.errorMessage || '支付失败');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('支付失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">确认支付</h2>
            <p className="text-xs text-gray-500">{order.orderNo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center py-4">
            <div className="text-sm text-gray-400 mb-1">支付金额</div>
            <div className="text-3xl font-bold text-white">{formatAmount(order.amount)}</div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">支付方式</h3>
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
                      !method.enabled && 'opacity-50 cursor-not-allowed'
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

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-[#2a2a2d] rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">使用余额</span>
              </div>
              <input
                type="checkbox"
                checked={useBalance}
                onChange={(e) => setUseBalance(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[#2a2a2d] rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">使用积分</span>
              </div>
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {redirectUrl && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <div className="text-sm text-blue-400 mb-2">正在跳转支付...</div>
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CreditCard size={16} />
                前往支付页面
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handlePay}
            disabled={processing || !!redirectUrl}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              processing && 'bg-blue-500'
            )}
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <CreditCard size={16} />
                确认支付 {formatAmount(order.amount)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
