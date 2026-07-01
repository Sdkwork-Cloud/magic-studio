import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioNotificationBatchDeleteRequest,
  MagicStudioNotificationCreateRequest,
  MagicStudioNotificationRecord,
  MagicStudioNotificationUnreadCount,
  MagicStudioOperationOkResult,
} from '@sdkwork/magic-studio-server';

const validNotificationCreateRequest = {
  title: 'Render finished',
  message: 'Your preview render is ready.',
  type: 'INFO',
  actionUrl: '/workspace/renders/latest',
  actionLabel: 'Open render',
} satisfies MagicStudioNotificationCreateRequest;

const validNotificationRecord = {
  id: 'notification-1',
  uuid: 'client-entity:notification-1',
  title: validNotificationCreateRequest.title,
  message: validNotificationCreateRequest.message,
  type: 'INFO',
  isRead: false,
  actionUrl: validNotificationCreateRequest.actionUrl,
  actionLabel: validNotificationCreateRequest.actionLabel,
  createdAt: '2026-04-05T12:00:00.000Z',
  updatedAt: '2026-04-05T12:00:00.000Z',
} satisfies MagicStudioNotificationRecord;

const validNotificationResponse = {
  requestId: 'req-notification-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  data: validNotificationRecord,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioNotificationRecord>;

const validNotificationListResponse = {
  requestId: 'req-notification-list-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  items: [validNotificationRecord],
  meta: {
    page: 0,
    pageSize: 20,
    total: 1,
    version: 'v1',
  },
} satisfies MagicStudioApiListEnvelope<MagicStudioNotificationRecord>;

const validUnreadCountResponse = {
  requestId: 'req-notification-count-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  data: {
    unreadCount: 3,
  },
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioNotificationUnreadCount>;

const validBatchDeleteRequest = {
  notificationIds: ['notification-1'],
} satisfies MagicStudioNotificationBatchDeleteRequest;

const validOperationResponse = {
  requestId: 'req-notification-operation-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioOperationOkResult>;

void validNotificationCreateRequest;
void validNotificationRecord;
void validNotificationResponse;
void validNotificationListResponse;
void validUnreadCountResponse;
void validBatchDeleteRequest;
void validOperationResponse;
