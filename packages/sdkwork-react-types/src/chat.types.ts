// Chat type definitions
// All chat-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

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
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
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

export interface ChatSession extends BaseEntity {
  title: string;
  modelId: string;
  isArchived: boolean;
  pinned: boolean;
  summary?: string;
  messageCount?: number;
}

// ============================================================================
// Chat Transcript (Heavy Content)
// ============================================================================

export interface ChatTranscript {
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
  id: string;
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
  id: string;
  type: 'image' | 'file' | 'audio';
  url: string;
  name: string;
  size?: number;
}
