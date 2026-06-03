import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import { genAIService } from '@sdkwork/magic-studio-core/ai';
import {
  isMagicStudioServerClientError,
  isMagicStudioServerResourceNotFoundError,
  type MagicStudioChatSessionCreateRequest,
  type MagicStudioChatSessionsListQuery,
  type MagicStudioChatSessionUpdateRequest,
  type MagicStudioChatTranscriptUpdateRequest,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import {
  createUuid,
  deriveClientEntityUuidFromId,
  resolveEntityKey,
} from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { Result, type ServiceResult } from '@sdkwork/magic-studio-types/service';

import type { ChatMessage, ChatSession, ChatTranscript, ChatRole } from '../entities';
import {
  createChatMessage,
  createEmptyChatTranscript,
  normalizeChatMessage,
  normalizeChatTranscript,
} from './chatIdentity';
import { resolveRuntimeMagicStudioChatDirectory } from './chatStoragePaths';

const DEFAULT_PAGE_SIZE = 50;
const FALLBACK_CHAT_TITLE = 'New Chat';
const DEFAULT_MODEL_ID = 'gpt-4o';
const CHAT_NOT_FOUND_CODES = ['APP_CHAT_SESSION_NOT_FOUND'] as const;

type ChatServerClient = Pick<
  MagicStudioServerClient,
  | 'listChatSessions'
  | 'createChatSession'
  | 'readChatSession'
  | 'updateChatSession'
  | 'deleteChatSession'
  | 'readChatTranscript'
  | 'updateChatTranscript'
>;

export interface IChatService {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<ChatSession>>>;
  findById(id: string): Promise<ServiceResult<ChatSession | null>>;
  existsById(id: string): Promise<boolean>;
  findAllById(ids: string[]): Promise<ServiceResult<ChatSession[]>>;
  count(): Promise<number>;
  save(entity: Partial<ChatSession>): Promise<ServiceResult<ChatSession>>;
  saveAll(entities: Partial<ChatSession>[]): Promise<ServiceResult<ChatSession[]>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  delete(entity: ChatSession): Promise<ServiceResult<void>>;
  deleteAll(ids: string[]): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  createSession(modelId?: string): Promise<ServiceResult<ChatSession>>;
  getTranscript(sessionId: string): Promise<ServiceResult<ChatTranscript>>;
  saveTranscript(sessionId: string, messages: ChatMessage[]): Promise<ServiceResult<void>>;
  createMessage(role: ChatRole, content: string, model?: string): ChatMessage;
  streamResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: string,
    history?: ChatMessage[],
  ): Promise<void>;
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(value: unknown): string | undefined {
  const text = readText(value);
  return text || undefined;
}

function readPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return fallback;
}

function normalizePageRequest(
  pageRequest?: PageRequest,
): Required<Pick<PageRequest, 'page' | 'size'>> {
  return {
    page: Math.max(0, pageRequest?.page ?? 0),
    size: Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE),
  };
}

function toPage<T>(
  items: T[],
  meta: {
    page?: number;
    pageSize?: number;
    total?: number;
  },
  pageRequest?: PageRequest,
): Page<T> {
  const fallback = normalizePageRequest(pageRequest);
  const pageSize = readPositiveInteger(meta.pageSize, fallback.size);
  const page = Math.max(0, readPositiveInteger(meta.page, fallback.page + 1) - 1);
  const totalElements = readPositiveInteger(meta.total, items.length);
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize);

  return {
    content: items,
    pageable: {
      pageNumber: page,
      pageSize,
      offset: page * pageSize,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: totalPages === 0 ? true : page >= totalPages - 1,
    totalPages,
    totalElements,
    size: pageSize,
    number: page,
    sort: { sorted: true, unsorted: false, empty: false },
    first: page === 0,
    numberOfElements: items.length,
    empty: items.length === 0,
  };
}

function isNotFoundError(error: unknown): boolean {
  return isMagicStudioServerResourceNotFoundError(error, CHAT_NOT_FOUND_CODES);
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (isMagicStudioServerClientError(error)) {
    return error.message || error.detail || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

function resolveSessionIdentity(entity: Partial<ChatSession>): string | null {
  const id = readOptionalText(entity.id);
  if (id) {
    return id;
  }

  const uuid = readOptionalText(entity.uuid);
  return uuid || null;
}

function normalizeChatSessionRecord(session: ChatSession): ChatSession {
  const id = readOptionalText(session.id) ?? null;
  const uuid = readText(session.uuid) || (id ? deriveClientEntityUuidFromId(id) : createUuid());
  return {
    ...session,
    id,
    uuid,
    title: readText(session.title) || FALLBACK_CHAT_TITLE,
    modelId: readText(session.modelId) || DEFAULT_MODEL_ID,
    isArchived: Boolean(session.isArchived),
    pinned: Boolean(session.pinned),
    summary: readOptionalText(session.summary),
    messageCount:
      typeof session.messageCount === 'number' && Number.isFinite(session.messageCount)
        ? session.messageCount
        : 0,
    createdAt: session.createdAt ?? Date.now(),
    updatedAt: session.updatedAt ?? session.createdAt ?? Date.now(),
    deletedAt: session.deletedAt ?? undefined,
  };
}

function toListQuery(pageRequest?: PageRequest): MagicStudioChatSessionsListQuery {
  const normalized = normalizePageRequest(pageRequest);
  return {
    keyword: readOptionalText(pageRequest?.keyword),
    page: normalized.page + 1,
    pageSize: normalized.size,
  };
}

function toCreateRequest(entity: Partial<ChatSession>): MagicStudioChatSessionCreateRequest {
  return {
    modelId: readOptionalText(entity.modelId) || DEFAULT_MODEL_ID,
    title: readOptionalText(entity.title),
  };
}

function toUpdateRequest(entity: Partial<ChatSession>): MagicStudioChatSessionUpdateRequest | null {
  const payload: MagicStudioChatSessionUpdateRequest = {};

  if (entity.title !== undefined) {
    payload.title = readText(entity.title) || FALLBACK_CHAT_TITLE;
  }

  if (entity.modelId !== undefined) {
    payload.modelId = readText(entity.modelId) || DEFAULT_MODEL_ID;
  }

  if (entity.isArchived !== undefined) {
    payload.isArchived = Boolean(entity.isArchived);
  }

  if (entity.pinned !== undefined) {
    payload.pinned = Boolean(entity.pinned);
  }

  if (entity.summary !== undefined) {
    payload.summary = entity.summary === null ? null : (readOptionalText(entity.summary) ?? null);
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

export class ChatService implements IChatService {
  private readonly serverClient?: ChatServerClient;
  private cachedServerClient?: ChatServerClient;

  constructor(serverClient?: ChatServerClient) {
    this.serverClient = serverClient;
  }

  private getServerClient(): ChatServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('ChatService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[ChatService] Chat persistence requires the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  private async resolveTranscriptDirectory(): Promise<string> {
    const runtime = readDefaultPlatformRuntime('ChatService');
    return resolveRuntimeMagicStudioChatDirectory(runtime);
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<ChatSession>>> {
    try {
      const response = await this.getServerClient().listChatSessions(toListQuery(pageRequest));
      return Result.success(
        toPage(
          response.items.map(normalizeChatSessionRecord),
          response.meta,
          pageRequest,
        ),
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query chat sessions'));
    }
  }

  async findById(id: string): Promise<ServiceResult<ChatSession | null>> {
    const sessionId = readText(id);
    if (!sessionId) {
      return Result.error('Chat session id is required');
    }

    try {
      const response = await this.getServerClient().readChatSession(sessionId);
      return Result.success(normalizeChatSessionRecord(response.data));
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return Result.success(null);
      }
      return Result.error(toErrorMessage(error, 'Failed to load chat session'));
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return Boolean(result.success && result.data);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<ChatSession[]>> {
    const found: ChatSession[] = [];
    for (const id of ids) {
      const result = await this.findById(id);
      if (!result.success || !result.data) {
        continue;
      }
      found.push(result.data);
    }
    return Result.success(found);
  }

  async count(): Promise<number> {
    const result = await this.findAll({ page: 0, size: 1 });
    if (!result.success || !result.data) {
      return 0;
    }
    return result.data.totalElements;
  }

  async save(entity: Partial<ChatSession>): Promise<ServiceResult<ChatSession>> {
    try {
      const client = this.getServerClient();
      const sessionKey = resolveSessionIdentity(entity);

      if (!sessionKey) {
        const createdResponse = await client.createChatSession(toCreateRequest(entity));
        const createdSession = normalizeChatSessionRecord(createdResponse.data);
        const createOnlyKeys = new Set(['title', 'modelId']);
        const updatePayload = toUpdateRequest(entity);

        if (
          updatePayload &&
          Object.keys(updatePayload).some((key) => !createOnlyKeys.has(key))
        ) {
          const updatedResponse = await client.updateChatSession(
            resolveEntityKey(createdSession),
            updatePayload,
          );
          return Result.success(normalizeChatSessionRecord(updatedResponse.data));
        }

        return Result.success(createdSession);
      }

      const payload = toUpdateRequest(entity);
      if (payload) {
        const response = await client.updateChatSession(sessionKey, payload);
        return Result.success(normalizeChatSessionRecord(response.data));
      }

      const existing = await client.readChatSession(sessionKey);
      return Result.success(normalizeChatSessionRecord(existing.data));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to save chat session'));
    }
  }

  async saveAll(entities: Partial<ChatSession>[]): Promise<ServiceResult<ChatSession[]>> {
    const saved: ChatSession[] = [];
    for (const entity of entities) {
      const result = await this.save(entity);
      if (!result.success || !result.data) {
        return Result.error(result.message || 'Failed to save chat sessions');
      }
      saved.push(result.data);
    }
    return Result.success(saved);
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    const sessionId = readText(id);
    if (!sessionId) {
      return Result.error('Chat session id is required');
    }

    try {
      await this.getServerClient().deleteChatSession(sessionId);
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete chat session'));
    }
  }

  async delete(entity: ChatSession): Promise<ServiceResult<void>> {
    return this.deleteById(resolveEntityKey(entity));
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      const result = await this.deleteById(id);
      if (!result.success) {
        return Result.error(result.message || 'Failed to delete chat sessions');
      }
    }
    return Result.success(undefined);
  }

  async clear(): Promise<ServiceResult<void>> {
    const sessions = await this.findAll({ page: 0, size: 1000 });
    if (!sessions.success || !sessions.data) {
      return Result.error(sessions.message || 'Failed to clear chat sessions');
    }

    return this.deleteAll(sessions.data.content.map(resolveEntityKey));
  }

  async createSession(modelId: string = DEFAULT_MODEL_ID): Promise<ServiceResult<ChatSession>> {
    try {
      const response = await this.getServerClient().createChatSession({
        modelId: readText(modelId) || DEFAULT_MODEL_ID,
      });
      return Result.success(normalizeChatSessionRecord(response.data));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to create chat session'));
    }
  }

  async getTranscript(sessionId: string): Promise<ServiceResult<ChatTranscript>> {
    const normalizedSessionId = readText(sessionId);
    if (!normalizedSessionId) {
      return Result.error('Chat session id is required');
    }

    try {
      await this.resolveTranscriptDirectory();
      const response = await this.getServerClient().readChatTranscript(normalizedSessionId);
      return Result.success(
        normalizeChatTranscript(normalizedSessionId, response.data),
      );
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return Result.success(createEmptyChatTranscript(normalizedSessionId));
      }
      return Result.error(toErrorMessage(error, 'Failed to load chat transcript'));
    }
  }

  async saveTranscript(sessionId: string, messages: ChatMessage[]): Promise<ServiceResult<void>> {
    const normalizedSessionId = readText(sessionId);
    if (!normalizedSessionId) {
      return Result.error('Chat session id is required');
    }

    const payload: MagicStudioChatTranscriptUpdateRequest = {
      messages: messages.map(normalizeChatMessage),
    };

    try {
      await this.resolveTranscriptDirectory();
      await this.getServerClient().updateChatTranscript(normalizedSessionId, payload);
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to save chat transcript'));
    }
  }

  createMessage(role: ChatRole, content: string, model?: string): ChatMessage {
    return createChatMessage(role, content, model);
  }

  async streamResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: string,
    history?: ChatMessage[],
  ): Promise<void> {
    const normalizedPrompt = readText(prompt);
    const historyFormat = (history || []).map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      text: message.content,
    })) as { role: 'user' | 'model'; text: string }[];

    if (normalizedPrompt) {
      const lastMessage = historyFormat.at(-1);
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.text !== normalizedPrompt) {
        historyFormat.push({
          role: 'user',
          text: normalizedPrompt,
        });
      }
    }

    if (genAIService.isConfigured()) {
      try {
        await genAIService.streamChat(historyFormat, context || '', onChunk);
      } catch (error) {
        console.error('[ChatService] AI service error', error);
        throw error;
      }
      return;
    }

    throw new Error('Chat AI service is not configured');
  }
}

export const chatService = new ChatService();
