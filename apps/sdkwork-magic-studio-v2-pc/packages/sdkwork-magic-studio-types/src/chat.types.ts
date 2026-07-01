// Chat type definitions
// All chat-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';

// ============================================================================
// Chat Role and Status
// ============================================================================

export type ChatRole = 'user' | 'ai' | 'system';

export type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

export type ChatMode = 'AGENT' | 'PLAN';

// ============================================================================
// Chat Message
// ============================================================================

export interface ChatMessage {
  id: EntityId;
  uuid: string;
  role: ChatRole;
  content: string;
  timestamp: string | number; // ISO 8601 format or Unix timestamp
  model?: string;
  status?: MessageStatus;
  error?: string;
  metadata?: {
    tokens?: number;
    latency?: number;
    pluginUsed?: string;
  };
}

// ============================================================================
// Chat Session (Lightweight Metadata)
// ============================================================================

export interface ChatSession extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  title: string;
  modelId: string;
  isArchived: boolean;
  pinned: boolean;
  summary?: string | null;
  messageCount?: number;
}

// ============================================================================
// Chat Transcript (Heavy Content)
// ============================================================================

export interface ChatTranscript {
  id: EntityId;
  uuid: string;
  sessionId: string;
  messages: ChatMessage[];
}

// ============================================================================
// Chat Config
// ============================================================================

export interface ChatConfig {
  defaultModel: string;
  temperature: number;
  maxContext: number;
}

// ============================================================================
// Chat Agent
// ============================================================================

export interface ChatAgent {
  id: EntityId;
  uuid: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  systemPrompt?: string;
  capabilities?: string[];
}

// ============================================================================
// Chat Attachment
// ============================================================================

export interface ChatAttachment {
  id: EntityId;
  uuid: string;
  type: 'image' | 'file' | 'audio';
  url: string;
  name: string;
  size?: number;
}
