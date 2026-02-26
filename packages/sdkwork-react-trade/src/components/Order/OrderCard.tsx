import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Package, CreditCard } from 'lucide-react';
import type { Order, OrderStatus, OrderType } from '../../entities';
import { OrderStatus as OrderStatusEnum, OrderType as OrderTypeEnum } from '../../entities';
import { cn, formatDate } from '@sdkwork/react-commons';

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

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      [OrderStatusEnum.PENDING_PAYMENT]: '待支付',
      [OrderStatusEnum.PAID]: '已支付',
      [OrderStatusEnum.IN_PROGRESS]: '进行中',
      [OrderStatusEnum.COMPLETED]: '已完成',
      [OrderStatusEnum.CANCELLED]: '已取消',
      [OrderStatusEnum.REFUNDED]: '已退款',
      [OrderStatusEnum.DISPUTED]: '争议中',
    };
    return labels[status];
  };

  const getTypeLabel = (type: OrderType) => {
    const labels: Record<OrderType, string> = {
      [OrderTypeEnum.VIDEO_GENERATION]: '视频生成',
      [OrderTypeEnum.IMAGE_GENERATION]: '图片生成',
      [OrderTypeEnum.AUDIO_GENERATION]: '音频生成',
      [OrderTypeEnum.MUSIC_GENERATION]: '音乐生成',
      [OrderTypeEnum.VIDEO_EDITING]: '视频编辑',
      [OrderTypeEnum.CUSTOM_SERVICE]: '定制服务',
      [OrderTypeEnum.SUBSCRIPTION]: '订阅',
      [OrderTypeEnum.CREDIT_TOPUP]: '充值',
    };
    return labels[type];
  };

  const formatAmount = (amount: number) => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  return (
    <div
      className={cn(
        'bg-[#1e1e20] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer',
        className
      )}
      onClick={() => onClick?.(order)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className="text-xs font-medium text-gray-400">{getStatusLabel(order.status)}</span>
        </div>
        <span className="text-[10px] text-gray-500">{formatDate(order.createdAt)}</span>
      </div>

      {/* Title */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white mb-1">{order.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{order.description}</p>
      </div>

      {/* Type and Amount */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-500 bg-[#2a2a2d] px-2 py-1 rounded">
          {getTypeLabel(order.type)}
        </span>
        <span className="text-sm font-bold text-white">{formatAmount(order.amount)}</span>
      </div>

      {/* Order Info */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
        <span>订单号：{order.orderNo}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {order.status === OrderStatusEnum.PENDING_PAYMENT && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPay?.(order);
              }}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <CreditCard size={12} />
              立即支付
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.(order);
              }}
              className="px-3 py-1.5 bg-[#2a2a2d] hover:bg-[#333] text-gray-400 text-xs font-medium rounded-lg transition-colors"
            >
              取消订单
            </button>
          </>
        )}
        {order.status === OrderStatusEnum.PAID && (
          <div className="text-xs text-gray-400">等待服务完成</div>
        )}
        {order.status === OrderStatusEnum.COMPLETED && (
          <div className="text-xs text-green-500">已完成</div>
        )}
        {order.status === OrderStatusEnum.CANCELLED && (
          <div className="text-xs text-red-400">已取消</div>
        )}
      </div>
    </div>
  );
};
