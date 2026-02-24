
import { BaseEntity } from '../../../types/core';

export type ChatRole = 'user' | 'ai' | 'system';
export type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  model?: string;
  status?: MessageStatus;
  error?: string;
  metadata?: {
    tokens?: number;
    latency?: number;
    pluginUsed?: string;
  };
}

/**
 * Lightweight Metadata for Lists
 * Stored in main index (LocalStorage / DB Table)
 */
export interface ChatSession extends BaseEntity {
  // Inherited: id, uuid, createdAt, updatedAt
  title: string;
  modelId: string;
  isArchived: boolean;
  pinned: boolean;
  summary?: string;
  messageCount?: number; // Cache count for UI
}

/**
 * Heavy Content
 * Stored in individual files (Filesystem / Blob)
 */
export interface ChatTranscript {
  sessionId: string;
  messages: ChatMessage[];
}

export interface ChatConfig {
  defaultModel: string;
  temperature: number;
  maxContext: number;
}
