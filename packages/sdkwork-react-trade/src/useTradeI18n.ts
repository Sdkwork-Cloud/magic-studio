import { formatCurrency, useTranslation } from '@sdkwork/react-i18n';
import type {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TaskType,
} from './entities';
import {
  OrderStatus as OrderStatusEnum,
  OrderType as OrderTypeEnum,
  PaymentMethod as PaymentMethodEnum,
  PaymentStatus as PaymentStatusEnum,
  TaskType as TaskTypeEnum,
} from './entities';

export const formatTradeCurrency = (amountInCents: number): string => (
  formatCurrency(amountInCents / 100, 'CNY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    fallback: 'CNY 0.00',
  })
);

export const useTradeI18n = () => {
  const { t } = useTranslation();

  const orderStatusLabel = (status: OrderStatus): string => {
    const keyMap: Record<OrderStatus, string> = {
      [OrderStatusEnum.PENDING_PAYMENT]: 'market.order.status.pending_payment',
      [OrderStatusEnum.PAID]: 'market.order.status.paid',
      [OrderStatusEnum.IN_PROGRESS]: 'market.order.status.in_progress',
      [OrderStatusEnum.COMPLETED]: 'market.order.status.completed',
      [OrderStatusEnum.CANCELLED]: 'market.order.status.cancelled',
      [OrderStatusEnum.REFUNDED]: 'market.order.status.refunded',
      [OrderStatusEnum.DISPUTED]: 'market.order.status.disputed',
    };
    return t(keyMap[status], status);
  };

  const orderTypeLabel = (type: OrderType): string => {
    const keyMap: Record<OrderType, string> = {
      [OrderTypeEnum.VIDEO_GENERATION]: 'market.order.type_label.video_generation',
      [OrderTypeEnum.IMAGE_GENERATION]: 'market.order.type_label.image_generation',
      [OrderTypeEnum.AUDIO_GENERATION]: 'market.order.type_label.audio_generation',
      [OrderTypeEnum.MUSIC_GENERATION]: 'market.order.type_label.music_generation',
      [OrderTypeEnum.VIDEO_EDITING]: 'market.order.type_label.video_editing',
      [OrderTypeEnum.CUSTOM_SERVICE]: 'market.order.type_label.custom_service',
      [OrderTypeEnum.SUBSCRIPTION]: 'market.order.type_label.subscription',
      [OrderTypeEnum.CREDIT_TOPUP]: 'market.order.type_label.credit_topup',
    };
    return t(keyMap[type], type);
  };

  const paymentMethodLabel = (method: PaymentMethod): string => {
    const keyMap: Record<PaymentMethod, string> = {
      [PaymentMethodEnum.ALIPAY]: 'market.payment.method_label.alipay',
      [PaymentMethodEnum.WECHAT_PAY]: 'market.payment.method_label.wechat',
      [PaymentMethodEnum.CREDIT_CARD]: 'market.payment.method_label.card',
      [PaymentMethodEnum.BALANCE]: 'market.payment.method_label.balance',
      [PaymentMethodEnum.POINTS]: 'market.payment.method_label.points',
      [PaymentMethodEnum.MIXED]: 'market.payment.method_label.balance',
    };
    return t(keyMap[method], method);
  };

  const paymentMethodDescription = (method: PaymentMethod): string => {
    const keyMap: Partial<Record<PaymentMethod, string>> = {
      [PaymentMethodEnum.ALIPAY]: 'market.payment.method_desc.alipay',
      [PaymentMethodEnum.WECHAT_PAY]: 'market.payment.method_desc.wechat',
      [PaymentMethodEnum.CREDIT_CARD]: 'market.payment.method_desc.card',
      [PaymentMethodEnum.BALANCE]: 'market.payment.method_desc.balance',
      [PaymentMethodEnum.POINTS]: 'market.payment.method_desc.points',
      [PaymentMethodEnum.MIXED]: 'market.payment.method_desc.balance',
    };
    return t(keyMap[method] || 'market.common.details');
  };

  const paymentStatusLabel = (status: PaymentStatus | string): string => {
    const keyMap: Partial<Record<PaymentStatus, string>> = {
      [PaymentStatusEnum.PENDING]: 'market.payment.status.pending',
      [PaymentStatusEnum.PROCESSING]: 'market.payment.status.processing',
      [PaymentStatusEnum.SUCCESS]: 'market.payment.status.success',
      [PaymentStatusEnum.FAILED]: 'market.payment.status.failed',
      [PaymentStatusEnum.REFUNDED]: 'market.payment.status.refunded',
      [PaymentStatusEnum.REFUNDING]: 'market.payment.status.refunding',
    };
    return t(keyMap[status as PaymentStatus] || '', typeof status === 'string' ? status : 'N/A');
  };

  const taskTypeLabel = (type: TaskType): string => {
    const keyMap: Record<TaskType, string> = {
      [TaskTypeEnum.TEXT_TO_VIDEO]: 'market.task.type.text_to_video',
      [TaskTypeEnum.IMAGE_TO_VIDEO]: 'market.task.type.image_to_video',
      [TaskTypeEnum.VIDEO_EXTEND]: 'market.task.type.video_extend',
      [TaskTypeEnum.VIDEO_RESTORE]: 'market.task.type.video_restore',
      [TaskTypeEnum.VIDEO_SUPER_RESOLUTION]: 'market.task.type.video_super_resolution',
      [TaskTypeEnum.VIDEO_FRAME_INTERPOLATION]: 'market.task.type.video_frame_interpolation',
      [TaskTypeEnum.VIDEO_COLORIZATION]: 'market.task.type.video_colorization',
      [TaskTypeEnum.VIDEO_STYLE_TRANSFER]: 'market.task.type.video_style_transfer',
      [TaskTypeEnum.AVATAR_VIDEO]: 'market.task.type.avatar_video',
      [TaskTypeEnum.LIP_SYNC]: 'market.task.type.lip_sync',
    };
    return t(keyMap[type], type);
  };

  const difficultyLabel = (difficulty: string): string => {
    const normalized = difficulty.toUpperCase();
    if (normalized === 'EASY') return t('market.task.difficulty.easy');
    if (normalized === 'MEDIUM') return t('market.task.difficulty.medium');
    if (normalized === 'HARD') return t('market.task.difficulty.hard');
    if (normalized === 'EXPERT') return t('market.task.difficulty.expert');
    return difficulty;
  };

  return {
    t,
    formatTradeCurrency,
    orderStatusLabel,
    orderTypeLabel,
    paymentMethodLabel,
    paymentMethodDescription,
    paymentStatusLabel,
    taskTypeLabel,
    difficultyLabel,
  };
};
