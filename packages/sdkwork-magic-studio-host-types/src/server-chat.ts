import type {
  ChatMessage,
  ChatSession,
  ChatTranscript,
} from '@sdkwork/magic-studio-types/chat';

export interface MagicStudioChatSessionsListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface MagicStudioChatSessionCreateRequest {
  title?: string;
  modelId?: ChatSession['modelId'];
}

export interface MagicStudioChatSessionUpdateRequest {
  title?: ChatSession['title'];
  modelId?: ChatSession['modelId'];
  isArchived?: ChatSession['isArchived'];
  pinned?: ChatSession['pinned'];
  summary?: ChatSession['summary'];
}

export interface MagicStudioChatTranscriptUpdateRequest {
  messages: ChatMessage[];
}

export type MagicStudioChatSessionRecord = ChatSession;
export type MagicStudioChatTranscriptRecord = ChatTranscript;
