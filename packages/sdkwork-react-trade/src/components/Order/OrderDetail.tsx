import React from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  X,
} from 'lucide-react';
import { cn, formatDate } from '@sdkwork/react-commons';
import type { Order, OrderStatus } from '../../entities';
import { OrderStatus as OrderStatusEnum } from '../../entities';
import { formatTradeCurrency, useTradeI18n } from '../../useTradeI18n';

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
  const { t, orderStatusLabel, orderTypeLabel, paymentStatusLabel } = useTradeI18n();

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

  const statusInfo = getStatusIcon(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">{t('market.order.details')}</h2>
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
          <div className={cn('flex items-center gap-3 p-4 rounded-xl', statusInfo.bg)}>
            <StatusIcon size={24} className={statusInfo.color} />
            <div>
              <div className="text-sm font-semibold text-white">{orderStatusLabel(order.status)}</div>
              {order.paymentStatus && order.paymentStatus !== 'PENDING' && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {t('market.order.payment_state', { status: paymentStatusLabel(order.paymentStatus) })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-2">{order.title}</h3>
              {order.description && <p className="text-sm text-gray-400">{order.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Package} label={t('market.order.type')} value={orderTypeLabel(order.type)} />
              <InfoItem
                icon={DollarSign}
                label={t('market.order.amount')}
                value={formatTradeCurrency(order.amount)}
                valueClass="text-lg font-bold text-white"
              />
              <InfoItem icon={Calendar} label={t('market.order.created_at')} value={formatDate(order.createdAt)} />
              {order.paidAt && <InfoItem icon={CheckCircle} label={t('market.order.paid_at')} value={formatDate(order.paidAt)} />}
              {order.completedAt && (
                <InfoItem icon={CheckCircle} label={t('market.order.completed_at')} value={formatDate(order.completedAt)} />
              )}
              {order.expiresAt && (
                <InfoItem
                  icon={Clock}
                  label={t('market.order.expires_at')}
                  value={formatDate(order.expiresAt)}
                  valueClass="text-red-400"
                />
              )}
            </div>

            {order.taskType && (
              <div className="bg-[#2a2a2d] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  {t('market.order.task_info')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('market.order.task_type')}</span>
                    <span className="text-white">{String(order.taskType)}</span>
                  </div>
                  {order.taskParams && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('market.order.task_params')}</span>
                      <span className="text-gray-400 text-xs">
                        {t('market.order.param_count', { count: String(Object.keys(order.taskParams).length) })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.remark && (
              <div className="bg-[#2a2a2d] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">{t('market.order.remark')}</h4>
                <p className="text-sm text-gray-300">{order.remark}</p>
              </div>
            )}

            {order.cancelReason && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle size={14} />
                  {t('market.order.cancel_reason')}
                </h4>
                <p className="text-sm text-red-300">{order.cancelReason}</p>
              </div>
            )}

            {order.failureReason && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <AlertCircle size={14} />
                  {t('market.order.failure_reason')}
                </h4>
                <p className="text-sm text-orange-300">{order.failureReason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 border-t border-white/10">
          {order.status === OrderStatusEnum.PENDING_PAYMENT && onPay && (
            <button
              onClick={() => onPay(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <CreditCard size={16} />
              {t('market.order.actions.pay_now')}
            </button>
          )}
          {order.status === OrderStatusEnum.PENDING_PAYMENT && onCancel && (
            <button
              onClick={() => onCancel(order)}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-colors"
            >
              {t('market.order.actions.cancel_order')}
            </button>
          )}
          {order.status !== OrderStatusEnum.PENDING_PAYMENT && (
            <div className="flex-1 text-center text-sm text-gray-500">
              {order.status === OrderStatusEnum.COMPLETED
                ? t('market.order.status.completed')
                : t('market.order.current_state', { status: orderStatusLabel(order.status) })}
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
