import React from 'react';
import { CreditCard, Smartphone, Wallet, Coins, Check, Loader2 } from 'lucide-react';
import type { PaymentMethod } from '../../entities';
import { PaymentMethod as PaymentMethodEnum } from '../../entities';
import { cn } from 'sdkwork-react-commons';

interface PaymentMethodSelectorProps {
  value?: PaymentMethod;
  onChange?: (method: PaymentMethod) => void;
  className?: string;
  disabled?: boolean;
}

interface MethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const methods: MethodOption[] = [
    {
      id: PaymentMethodEnum.ALIPAY,
      name: '支付宝',
      description: '快捷支付',
      icon: Smartphone,
      color: 'text-blue-500',
    },
    {
      id: PaymentMethodEnum.WECHAT_PAY,
      name: '微信支付',
      description: '扫码支付',
      icon: Smartphone,
      color: 'text-green-500',
    },
    {
      id: PaymentMethodEnum.CREDIT_CARD,
      name: '信用卡',
      description: 'Visa/Master',
      icon: CreditCard,
      color: 'text-purple-500',
    },
    {
      id: PaymentMethodEnum.BALANCE,
      name: '余额',
      description: '账户余额',
      icon: Wallet,
      color: 'text-yellow-500',
    },
    {
      id: PaymentMethodEnum.POINTS,
      name: '积分',
      description: '100 积分=1 元',
      icon: Coins,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = value === method.id;

        return (
          <button
            key={method.id}
            onClick={() => onChange?.(method.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
              isSelected
                ? 'bg-blue-600/10 border-blue-500/50'
                : 'bg-[#2a2a2d] border-white/10 hover:border-white/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check size={14} className="text-blue-500" />
              </div>
            )}
            <Icon size={24} className={cn(method.color, isSelected && 'opacity-100')} />
            <div className="text-center">
              <div className="text-sm font-medium text-white">{method.name}</div>
              <div className="text-[10px] text-gray-500">{method.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config: Record<string, { label: string; color: string; icon?: React.ElementType }> = {
    PENDING: { label: '待支付', color: 'bg-yellow-500/10 text-yellow-500', icon: Loader2 },
    PROCESSING: { label: '支付中', color: 'bg-blue-500/10 text-blue-500', icon: Loader2 },
    SUCCESS: { label: '支付成功', color: 'bg-green-500/10 text-green-500' },
    FAILED: { label: '支付失败', color: 'bg-red-500/10 text-red-500' },
    REFUNDED: { label: '已退款', color: 'bg-gray-500/10 text-gray-500' },
    REFUNDING: { label: '退款中', color: 'bg-orange-500/10 text-orange-500', icon: Loader2 },
  };

  const info = config[status] || { label: status, color: 'bg-gray-500/10 text-gray-500' };
  const Icon = info.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        info.color,
        className
      )}
    >
      {Icon && <Icon size={10} className="animate-spin" />}
      {info.label}
    </span>
  );
};
