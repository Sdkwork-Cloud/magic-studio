export type MagicStudioTradeTaskType =
  | 'TEXT_TO_VIDEO'
  | 'IMAGE_TO_VIDEO'
  | 'VIDEO_EXTEND'
  | 'VIDEO_RESTORE'
  | 'VIDEO_SUPER_RESOLUTION'
  | 'VIDEO_FRAME_INTERPOLATION'
  | 'VIDEO_COLORIZATION'
  | 'VIDEO_STYLE_TRANSFER'
  | 'AVATAR_VIDEO'
  | 'LIP_SYNC';

export type MagicStudioTradeTaskStatus =
  | 'AVAILABLE'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MagicStudioTradeTaskDifficulty =
  | 'EASY'
  | 'MEDIUM'
  | 'HARD'
  | 'EXPERT';

export type MagicStudioTradeTaskSortBy = 'latest' | 'budget' | 'difficulty';

export type MagicStudioTradeTaskSortOrder = 'asc' | 'desc';

export interface MagicStudioTradeTaskListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: MagicStudioTradeTaskSortBy;
  sortOrder?: MagicStudioTradeTaskSortOrder;
  keyword?: string;
  status?: MagicStudioTradeTaskStatus;
  type?: MagicStudioTradeTaskType;
  difficulty?: MagicStudioTradeTaskDifficulty;
  startTime?: string;
  endTime?: string;
}

export interface MagicStudioTradeMarketplaceTask {
  id: string;
  uuid: string;
  title: string;
  description: string;
  type: MagicStudioTradeTaskType;
  requirements: string[];
  budget: number;
  deadline: string;
  publisherUuid: string;
  publisherName: string;
  status: MagicStudioTradeTaskStatus;
  acceptorUuid?: string | null;
  acceptorName?: string | null;
  acceptedAt?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  attachmentResourceUuids: string[];
  deliveryResourceUuids: string[];
  tags: string[];
  difficulty: MagicStudioTradeTaskDifficulty;
  estimatedDuration: number;
  acceptMessage?: string | null;
  submissionDescription?: string | null;
  approvalFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioTradeTaskAcceptRequest {
  message?: string;
}

export interface MagicStudioTradeTaskSubmitRequest {
  deliveryResourceUuids?: string[];
  description?: string;
}

export interface MagicStudioTradeTaskApproveRequest {
  approved: boolean;
  feedback?: string;
}

export type MagicStudioTradeOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDING'
  | 'REFUNDED'
  | 'DISPUTED';

export type MagicStudioTradeOrderType =
  | 'GOODS'
  | 'VIRTUAL'
  | 'MEMBER'
  | 'POINTS'
  | 'IM_GROUP'
  | 'BOOKING'
  | 'SERVICE'
  | 'VIDEO_GENERATION'
  | 'IMAGE_GENERATION'
  | 'AUDIO_GENERATION'
  | 'MUSIC_GENERATION'
  | 'VIDEO_EDITING'
  | 'CUSTOM_SERVICE'
  | 'SUBSCRIPTION'
  | 'CREDIT_TOPUP';

export type MagicStudioTradePaymentMethod =
  | 'ALIPAY'
  | 'WECHAT_PAY'
  | 'CREDIT_CARD'
  | 'BALANCE'
  | 'POINTS'
  | 'MIXED';

export type MagicStudioTradePaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'REFUNDING';

export type MagicStudioTradeTransactionType =
  | 'RECHARGE'
  | 'CONSUME'
  | 'REFUND'
  | 'TRANSFER'
  | 'REWARD'
  | 'WITHDRAW';

export type MagicStudioTradeOrderSortBy = 'latest' | 'amount' | 'status';
export type MagicStudioTradePaymentSortBy = 'latest' | 'amount' | 'status';
export type MagicStudioTradeTransactionSortBy = 'latest' | 'amount' | 'type';
export type MagicStudioTradeSortOrder = 'asc' | 'desc';

export interface MagicStudioTradeOrderListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: MagicStudioTradeOrderSortBy;
  sortOrder?: MagicStudioTradeSortOrder;
  keyword?: string;
  status?: MagicStudioTradeOrderStatus;
  type?: MagicStudioTradeOrderType;
  startTime?: string;
  endTime?: string;
}

export interface MagicStudioTradePaymentListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: MagicStudioTradePaymentSortBy;
  sortOrder?: MagicStudioTradeSortOrder;
  keyword?: string;
  status?: MagicStudioTradePaymentStatus;
  method?: MagicStudioTradePaymentMethod;
  startTime?: string;
  endTime?: string;
}

export interface MagicStudioTradeTransactionListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: MagicStudioTradeTransactionSortBy;
  sortOrder?: MagicStudioTradeSortOrder;
  keyword?: string;
  type?: MagicStudioTradeTransactionType;
  startTime?: string;
  endTime?: string;
}

export interface MagicStudioTradeOrder {
  uuid: string;
  orderNo: string;
  type: MagicStudioTradeOrderType;
  status: MagicStudioTradeOrderStatus;
  title: string;
  description?: string | null;
  amount: number;
  paidAmount: number;
  usedPoints: number;
  usedBalance: number;
  paymentMethod?: MagicStudioTradePaymentMethod | null;
  paymentStatus: MagicStudioTradePaymentStatus;
  taskUuid?: string | null;
  taskType?: MagicStudioTradeTaskType | null;
  taskParams?: Record<string, unknown> | null;
  resourceUuids?: string[] | null;
  userUuid: string;
  workspaceUuid?: string | null;
  projectUuid?: string | null;
  remark?: string | null;
  cancelReason?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioTradePayment {
  uuid: string;
  paymentNo: string;
  orderUuid: string;
  orderNo: string;
  amount: number;
  method: MagicStudioTradePaymentMethod;
  status: MagicStudioTradePaymentStatus;
  userUuid: string;
  transactionId?: string | null;
  channel?: string | null;
  errorMessage?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  receiptUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioTradeWallet {
  uuid: string;
  userUuid: string;
  balance: number;
  frozenBalance: number;
  points: number;
  totalRecharged: number;
  totalSpent: number;
  totalEarnedPoints: number;
  totalUsedPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioTradeTransaction {
  uuid: string;
  transactionNo: string;
  type: MagicStudioTradeTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pointsChange: number;
  orderUuid?: string | null;
  paymentUuid?: string | null;
  userUuid: string;
  description: string;
  remark?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioTradeOrderStatistics {
  totalOrders: number;
  pendingPaymentOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalSpent: number;
  monthSpent: number;
}

export interface MagicStudioTradePaymentActionResult {
  success: boolean;
  payment?: MagicStudioTradePayment | null;
  errorMessage?: string | null;
  redirectUrl?: string | null;
  transactionId?: string | null;
}

export interface MagicStudioTradeOrderCreateRequest {
  type: MagicStudioTradeOrderType;
  title: string;
  description?: string;
  amount: number;
  productId?: string;
  contentId?: string;
  taskType?: MagicStudioTradeTaskType;
  taskParams?: Record<string, unknown>;
  workspaceUuid?: string;
  projectUuid?: string;
  remark?: string;
  expireInMinutes?: number;
}

export interface MagicStudioTradeOrderCancelRequest {
  reason?: string;
}

export interface MagicStudioTradeOrderStatusUpdateRequest {
  status: MagicStudioTradeOrderStatus;
}

export interface MagicStudioTradePaymentCreateRequest {
  orderUuid: string;
  method: MagicStudioTradePaymentMethod;
  useBalance?: number;
  usePoints?: number;
}

export interface MagicStudioTradePaymentRefundRequest {
  amount?: number;
  reason: string;
}

export interface MagicStudioTradePaymentRechargeRequest {
  amount: number;
  method: MagicStudioTradePaymentMethod;
  remark?: string;
}
