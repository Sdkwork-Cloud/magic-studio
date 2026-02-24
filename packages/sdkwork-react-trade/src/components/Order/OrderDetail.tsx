import React from 'react';
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { Order, OrderStatus, OrderType } from '../../entities';
import { OrderStatus as OrderStatusEnum, OrderType as OrderTypeEnum } from '../../entities';
import { cn, formatDate } from 'sdkwork-react-commons';

interface OrderDetailProps {
  order: Order;
  onClose: () => void;
  onPay?: (order: Order) => void;
  onCancel?: (order: Order) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onClose,
  onPay,
  onCancel,
}) => {
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatusEnum.PENDING_PAYMENT:
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case OrderStatusEnum.PAID:
      case OrderStatusEnum.COMPLETED:
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
      case OrderStatusEnum.CANCELLED:
      case OrderStatusEnum.REFUNDED:
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case OrderStatusEnum.IN_PROGRESS:
        return { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case OrderStatusEnum.DISPUTED:
        return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10' };
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

  const statusInfo = getStatusIcon(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">订单详情</h2>
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
          {/* Status Banner */}
          <div className={cn('flex items-center gap-3 p-4 rounded-xl', statusInfo.bg)}>
            <StatusIcon size={24} className={statusInfo.color} />
            <div>
              <div className="text-sm font-semibold text-white">{getStatusLabel(order.status)}</div>
              {order.paymentStatus && order.paymentStatus !== 'PENDING' && (
                <div className="text-xs text-gray-400 mt-0.5">
                  支付状态：{order.paymentStatus}
                </div>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-2">{order.title}</h3>
              {order.description && (
                <p className="text-sm text-gray-400">{order.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                icon={Package}
                label="订单类型"
                value={getTypeLabel(order.type)}
              />
              <InfoItem
                icon={DollarSign}
                label="订单金额"
                value={formatAmount(order.amount)}
                valueClass="text-lg font-bold text-white"
              />
              <InfoItem
                icon={Calendar}
                label="创建时间"
                value={formatDate(order.createdAt)}
              />
              {order.paidAt && (
                <InfoItem
                  icon={CheckCircle}
                  label="支付时间"
                  value={formatDate(order.paidAt)}
                />
              )}
              {order.completedAt && (
                <InfoItem
                  icon={CheckCircle}
                  label="完成时间"
                  value={formatDate(order.completedAt)}
                />
              )}
              {order.expiresAt && (
                <InfoItem
                  icon={Clock}
                  label="过期时间"
                  value={formatDate(order.expiresAt)}
                  valueClass="text-red-400"
                />
              )}
            </div>

            {order.taskType && (
              <div className="bg-[#2a2a2d] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  任务信息
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">任务类型</span>
                    <span className="text-white">{order.taskType}</span>
                  </div>
                  {order.taskParams && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">参数配置</span>
                      <span className="text-gray-400 text-xs">
                        {Object.keys(order.taskParams).length} 项配置
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.remark && (
              <div className="bg-[#2a2a2d] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">备注</h4>
                <p className="text-sm text-gray-300">{order.remark}</p>
              </div>
            )}

            {order.cancelReason && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle size={14} />
                  取消原因
                </h4>
                <p className="text-sm text-red-300">{order.cancelReason}</p>
              </div>
            )}

            {order.failureReason && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <AlertCircle size={14} />
                  失败原因
                </h4>
                <p className="text-sm text-orange-300">{order.failureReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-white/10">
          {order.status === OrderStatusEnum.PENDING_PAYMENT && onPay && (
            <button
              onClick={() => onPay(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <CreditCard size={16} />
              立即支付
            </button>
          )}
          {order.status === OrderStatusEnum.PENDING_PAYMENT && onCancel && (
            <button
              onClick={() => onCancel(order)}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-colors"
            >
              取消订单
            </button>
          )}
          {order.status !== OrderStatusEnum.PENDING_PAYMENT && (
            <div className="flex-1 text-center text-sm text-gray-500">
              {order.status === OrderStatusEnum.COMPLETED
                ? '交易已完成'
                : `当前状态：${getStatusLabel(order.status)}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon: Icon,
  label,
  value,
  valueClass = 'text-white',
}) => (
  <div className="bg-[#2a2a2d] rounded-xl p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={14} className="text-gray-500" />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <div className={cn('text-sm', valueClass)}>{value}</div>
  </div>
);
