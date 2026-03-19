export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export enum OrderType {
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  AUDIO_GENERATION = 'AUDIO_GENERATION',
  MUSIC_GENERATION = 'MUSIC_GENERATION',
  VIDEO_EDITING = 'VIDEO_EDITING',
  CUSTOM_SERVICE = 'CUSTOM_SERVICE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CREDIT_TOPUP = 'CREDIT_TOPUP',
}

export enum PaymentMethod {
  ALIPAY = 'ALIPAY',
  WECHAT_PAY = 'WECHAT_PAY',
  CREDIT_CARD = 'CREDIT_CARD',
  BALANCE = 'BALANCE',
  POINTS = 'POINTS',
  MIXED = 'MIXED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REFUNDING = 'REFUNDING',
}

export enum TaskType {
  TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
  IMAGE_TO_VIDEO = 'IMAGE_TO_VIDEO',
  VIDEO_EXTEND = 'VIDEO_EXTEND',
  VIDEO_RESTORE = 'VIDEO_RESTORE',
  VIDEO_SUPER_RESOLUTION = 'VIDEO_SUPER_RESOLUTION',
  VIDEO_FRAME_INTERPOLATION = 'VIDEO_FRAME_INTERPOLATION',
  VIDEO_COLORIZATION = 'VIDEO_COLORIZATION',
  VIDEO_STYLE_TRANSFER = 'VIDEO_STYLE_TRANSFER',
  AVATAR_VIDEO = 'AVATAR_VIDEO',
  LIP_SYNC = 'LIP_SYNC',
}

export enum TaskStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELING = 'CANCELING',
  CANCELED = 'CANCELED',
}

export interface TradeEntity {
  uuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order extends TradeEntity {
  orderNo: string;
  type: OrderType;
  status: OrderStatus;
  title: string;
  description?: string;
  amount: number;
  paidAmount: number;
  usedPoints: number;
  usedBalance: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  taskUuid?: string;
  taskType?: TaskType;
  taskParams?: Record<string, unknown>;
  resourceUuids?: string[];
  userUuid: string;
  workspaceUuid?: string;
  projectUuid?: string;
  remark?: string;
  cancelReason?: string;
  failureReason?: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface Payment extends TradeEntity {
  paymentNo: string;
  orderUuid: string;
  orderNo: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  userUuid: string;
  transactionId?: string;
  channel?: string;
  errorMessage?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface TradeTask extends TradeEntity {
  taskNo: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description?: string;
  prompt?: string;
  negativePrompt?: string;
  inputResourceUuids?: string[];
  outputResourceUuids?: string[];
  orderUuid?: string;
  userUuid: string;
  progress: number;
  progressMessage?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AvailableTask extends TradeEntity {
  title: string;
  description: string;
  type: TaskType;
  requirements: string[];
  budget: number;
  deadline: string;
  publisherUuid: string;
  publisherName: string;
  status: 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  acceptorUuid?: string;
  acceptorName?: string;
  acceptedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  attachmentResourceUuids?: string[];
  deliveryResourceUuids?: string[];
  tags: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedDuration: number;
}

export interface Wallet extends TradeEntity {
  userUuid: string;
  balance: number;
  frozenBalance: number;
  points: number;
  totalRecharged: number;
  totalSpent: number;
  totalEarnedPoints: number;
  totalUsedPoints: number;
}

export interface Transaction extends TradeEntity {
  transactionNo: string;
  type: 'RECHARGE' | 'CONSUME' | 'REFUND' | 'TRANSFER' | 'REWARD' | 'WITHDRAW';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pointsChange: number;
  orderUuid?: string;
  paymentUuid?: string;
  userUuid: string;
  description: string;
  remark?: string;
  metadata?: Record<string, unknown>;
}

export interface TradePageRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  status?: string;
  type?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  startTime?: string;
  endTime?: string;
}

export interface TradePageResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface OrderStatistics {
  totalOrders: number;
  pendingPaymentOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalSpent: number;
  monthSpent: number;
}
