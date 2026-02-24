/**
 * 订单状态枚举
 */
export enum OrderStatus {
  /** 待支付 */
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  /** 已支付 */
  PAID = 'PAID',
  /** 进行中 */
  IN_PROGRESS = 'IN_PROGRESS',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
  /** 已退款 */
  REFUNDED = 'REFUNDED',
  /** 争议中 */
  DISPUTED = 'DISPUTED',
}

/**
 * 订单类型
 */
export enum OrderType {
  /** 视频生成订单 */
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  /** 图片生成订单 */
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  /** 音频生成订单 */
  AUDIO_GENERATION = 'AUDIO_GENERATION',
  /** 音乐生成订单 */
  MUSIC_GENERATION = 'MUSIC_GENERATION',
  /** 视频编辑订单 */
  VIDEO_EDITING = 'VIDEO_EDITING',
  /** 定制服务订单 */
  CUSTOM_SERVICE = 'CUSTOM_SERVICE',
  /** 订阅订单 */
  SUBSCRIPTION = 'SUBSCRIPTION',
  /** 充值订单 */
  CREDIT_TOPUP = 'CREDIT_TOPUP',
}

/**
 * 支付方式
 */
export enum PaymentMethod {
  /** 支付宝 */
  ALIPAY = 'ALIPAY',
  /** 微信支付 */
  WECHAT_PAY = 'WECHAT_PAY',
  /** 信用卡 */
  CREDIT_CARD = 'CREDIT_CARD',
  /** 余额支付 */
  BALANCE = 'BALANCE',
  /** 积分支付 */
  POINTS = 'POINTS',
  /** 混合支付 */
  MIXED = 'MIXED',
}

/**
 * 支付状态
 */
export enum PaymentStatus {
  /** 待支付 */
  PENDING = 'PENDING',
  /** 支付中 */
  PROCESSING = 'PROCESSING',
  /** 支付成功 */
  SUCCESS = 'SUCCESS',
  /** 支付失败 */
  FAILED = 'FAILED',
  /** 已退款 */
  REFUNDED = 'REFUNDED',
  /** 退款中 */
  REFUNDING = 'REFUNDING',
}

/**
 * 任务类型
 */
export enum TaskType {
  /** 文生视频 */
  TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
  /** 图生视频 */
  IMAGE_TO_VIDEO = 'IMAGE_TO_VIDEO',
  /** 视频扩展 */
  VIDEO_EXTEND = 'VIDEO_EXTEND',
  /** 视频修复 */
  VIDEO_RESTORE = 'VIDEO_RESTORE',
  /** 视频超分 */
  VIDEO_SUPER_RESOLUTION = 'VIDEO_SUPER_RESOLUTION',
  /** 视频补帧 */
  VIDEO_FRAME_INTERPOLATION = 'VIDEO_FRAME_INTERPOLATION',
  /** 视频着色 */
  VIDEO_COLORIZATION = 'VIDEO_COLORIZATION',
  /** 视频风格转换 */
  VIDEO_STYLE_TRANSFER = 'VIDEO_STYLE_TRANSFER',
  /** 数字人视频 */
  AVATAR_VIDEO = 'AVATAR_VIDEO',
  /** 口型同步 */
  LIP_SYNC = 'LIP_SYNC',
}

/**
 * 任务状态
 */
export enum TaskStatus {
  /** 等待中 */
  QUEUED = 'QUEUED',
  /** 处理中 */
  PROCESSING = 'PROCESSING',
  /** 成功 */
  SUCCESS = 'SUCCESS',
  /** 失败 */
  FAILED = 'FAILED',
  /** 取消中 */
  CANCELING = 'CANCELING',
  /** 已取消 */
  CANCELED = 'CANCELED',
}

/**
 * 基础实体接口
 */
export interface TradeEntity {
  /** UUID */
  uuid: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 订单详情
 */
export interface Order extends TradeEntity {
  /** 订单号 */
  orderNo: string;
  /** 订单类型 */
  type: OrderType;
  /** 订单状态 */
  status: OrderStatus;
  /** 订单标题 */
  title: string;
  /** 订单描述 */
  description?: string;
  /** 订单金额 (分) */
  amount: number;
  /** 实付金额 (分) */
  paidAmount: number;
  /** 使用的积分 */
  usedPoints: number;
  /** 使用的余额 (分) */
  usedBalance: number;
  /** 支付方式 */
  paymentMethod?: PaymentMethod;
  /** 支付状态 */
  paymentStatus: PaymentStatus;
  /** 关联的任务 UUID */
  taskUuid?: string;
  /** 任务类型 */
  taskType?: TaskType;
  /** 任务参数 */
  taskParams?: Record<string, unknown>;
  /** 生成的资源 UUID 列表 */
  resourceUuids?: string[];
  /** 用户 UUID */
  userUuid: string;
  /** 工作区 UUID */
  workspaceUuid?: string;
  /** 项目 UUID */
  projectUuid?: string;
  /** 备注 */
  remark?: string;
  /** 取消原因 */
  cancelReason?: string;
  /** 失败原因 */
  failureReason?: string;
  /** 支付时间 */
  paidAt?: string;
  /** 完成时间 */
  completedAt?: string;
  /** 取消时间 */
  cancelledAt?: string;
  /** 过期时间 */
  expiresAt?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 支付记录
 */
export interface Payment extends TradeEntity {
  /** 支付流水号 */
  paymentNo: string;
  /** 关联的订单 UUID */
  orderUuid: string;
  /** 关联的订单号 */
  orderNo: string;
  /** 支付金额 (分) */
  amount: number;
  /** 支付方式 */
  method: PaymentMethod;
  /** 支付状态 */
  status: PaymentStatus;
  /** 用户 UUID */
  userUuid: string;
  /** 第三方支付流水号 */
  transactionId?: string;
  /** 支付渠道 */
  channel?: string;
  /** 支付错误信息 */
  errorMessage?: string;
  /** 支付时间 */
  paidAt?: string;
  /** 退款时间 */
  refundedAt?: string;
  /** 退款金额 (分) */
  refundAmount?: number;
  /** 退款原因 */
  refundReason?: string;
  /** 支付凭证 URL */
  receiptUrl?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 任务详情
 */
export interface TradeTask extends TradeEntity {
  /** 任务编号 */
  taskNo: string;
  /** 任务类型 */
  type: TaskType;
  /** 任务状态 */
  status: TaskStatus;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description?: string;
  /** 提示词 */
  prompt?: string;
  /** 负向提示词 */
  negativePrompt?: string;
  /** 输入资源 UUID 列表 */
  inputResourceUuids?: string[];
  /** 输出资源 UUID 列表 */
  outputResourceUuids?: string[];
  /** 关联的订单 UUID */
  orderUuid?: string;
  /** 用户 UUID */
  userUuid: string;
  /** 进度 (0-100) */
  progress: number;
  /** 进度描述 */
  progressMessage?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 开始时间 */
  startedAt?: string;
  /** 完成时间 */
  completedAt?: string;
  /** 参数配置 */
  config?: Record<string, unknown>;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 接单任务 (可被领取的任务)
 */
export interface AvailableTask extends TradeEntity {
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description: string;
  /** 任务类型 */
  type: TaskType;
  /** 任务要求 */
  requirements: string[];
  /** 预算金额 (分) */
  budget: number;
  /** 截止日期 */
  deadline: string;
  /** 发布人 UUID */
  publisherUuid: string;
  /** 发布人名称 */
  publisherName: string;
  /** 当前状态 */
  status: 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  /** 已接单人 UUID */
  acceptorUuid?: string;
  /** 已接单人名称 */
  acceptorName?: string;
  /** 接单时间 */
  acceptedAt?: string;
  /** 提交时间 */
  submittedAt?: string;
  /** 验收时间 */
  approvedAt?: string;
  /** 附件资源 UUID 列表 */
  attachmentResourceUuids?: string[];
  /** 交付资源 UUID 列表 */
  deliveryResourceUuids?: string[];
  /** 标签 */
  tags: string[];
  /** 难度等级 */
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  /** 预计耗时 (分钟) */
  estimatedDuration: number;
}

/**
 * 钱包信息
 */
export interface Wallet extends TradeEntity {
  /** 用户 UUID */
  userUuid: string;
  /** 余额 (分) */
  balance: number;
  /** 冻结金额 (分) */
  frozenBalance: number;
  /** 积分 */
  points: number;
  /** 累计充值金额 (分) */
  totalRecharged: number;
  /** 累计消费金额 (分) */
  totalSpent: number;
  /** 累计获得积分 */
  totalEarnedPoints: number;
  /** 累计使用积分 */
  totalUsedPoints: number;
}

/**
 * 交易流水
 */
export interface Transaction extends TradeEntity {
  /** 流水号 */
  transactionNo: string;
  /** 交易类型 */
  type: 'RECHARGE' | 'CONSUME' | 'REFUND' | 'TRANSFER' | 'REWARD' | 'WITHDRAW';
  /** 交易金额 (分) */
  amount: number;
  /** 交易前余额 (分) */
  balanceBefore: number;
  /** 交易后余额 (分) */
  balanceAfter: number;
  /** 积分变化 */
  pointsChange: number;
  /** 关联的订单 UUID */
  orderUuid?: string;
  /** 关联的支付 UUID */
  paymentUuid?: string;
  /** 用户 UUID */
  userUuid: string;
  /** 交易描述 */
  description: string;
  /** 备注 */
  remark?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 分页请求参数
 */
export interface TradePageRequest {
  /** 页码 (从 1 开始) */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 搜索关键词 */
  keyword?: string;
  /** 状态过滤 */
  status?: string;
  /** 类型过滤 */
  type?: string;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
}

/**
 * 分页响应
 */
export interface TradePageResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 当前页码 */
  currentPage: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 订单统计信息
 */
export interface OrderStatistics {
  /** 总订单数 */
  totalOrders: number;
  /** 待支付订单数 */
  pendingPaymentOrders: number;
  /** 进行中订单数 */
  inProgressOrders: number;
  /** 已完成订单数 */
  completedOrders: number;
  /** 总消费金额 (分) */
  totalSpent: number;
  /** 本月消费金额 (分) */
  monthSpent: number;
}
