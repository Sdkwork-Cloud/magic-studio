import React from 'react';
import { AlertCircle, CheckCircle, Clock, CreditCard, Package, XCircle } from 'lucide-react';
import { cn, formatDate } from '@sdkwork/react-commons';
import type { Order, OrderStatus } from '../../entities';
import { OrderStatus as OrderStatusEnum } from '../../entities';
import { formatTradeCurrency, useTradeI18n } from '../../useTradeI18n';

interface OrderCardProps {
  order: Order;
  onClick?: (order: Order) => void;
  onPay?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onClick,
  onPay,
  onCancel,
  className = '',
}) => {
  const { t, orderStatusLabel, orderTypeLabel } = useTradeI18n();

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatusEnum.PENDING_PAYMENT:
        return <Clock size={16} className="text-yellow-500" />;
      case OrderStatusEnum.PAID:
      case OrderStatusEnum.COMPLETED:
        return <CheckCircle size={16} className="text-green-500" />;
      case OrderStatusEnum.CANCELLED:
      case OrderStatusEnum.REFUNDED:
        return <XCircle size={16} className="text-red-500" />;
      case OrderStatusEnum.IN_PROGRESS:
        return <Package size={16} className="text-blue-500" />;
      case OrderStatusEnum.DISPUTED:
        return <AlertCircle size={16} className="text-orange-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <div
      className={cn(
        'bg-[#1e1e20] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer',
        className,
      )}
      onClick={() => onClick?.(order)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className="text-xs font-medium text-gray-400">{orderStatusLabel(order.status)}</span>
        </div>
        <span className="text-[10px] text-gray-500">{formatDate(order.createdAt)}</span>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white mb-1">{order.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{order.description}</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-500 bg-[#2a2a2d] px-2 py-1 rounded">
          {orderTypeLabel(order.type)}
        </span>
        <span className="text-sm font-bold text-white">{formatTradeCurrency(order.amount)}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
        <span>{t('market.order.order_no')}: {order.orderNo}</span>
      </div>

      <div className="flex items-center gap-2">
        {order.status === OrderStatusEnum.PENDING_PAYMENT && (
          <>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onPay?.(order);
              }}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <CreditCard size={12} />
              {t('market.order.actions.pay_now')}
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onCancel?.(order);
              }}
              className="px-3 py-1.5 bg-[#2a2a2d] hover:bg-[#333] text-gray-400 text-xs font-medium rounded-lg transition-colors"
            >
              {t('market.order.actions.cancel_order')}
            </button>
          </>
        )}
        {order.status === OrderStatusEnum.PAID && (
          <div className="text-xs text-gray-400">{t('market.order.waiting_for_service')}</div>
        )}
        {order.status === OrderStatusEnum.COMPLETED && (
          <div className="text-xs text-green-500">{t('market.order.status.completed')}</div>
        )}
        {order.status === OrderStatusEnum.CANCELLED && (
          <div className="text-xs text-red-400">{t('market.order.status.cancelled')}</div>
        )}
      </div>
    </div>
  );
};
