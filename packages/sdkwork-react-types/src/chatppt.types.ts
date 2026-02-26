// ChatPPT type definitions
// All presentation-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Slide Element Types
// ============================================================================

export type SlideElementType = 'text' | 'image' | 'shape' | 'chart' | 'table' | 'video';

// ============================================================================
// Slide Element
// ============================================================================

export interface SlideElement {
  id: string;
  type: SlideElementType;
  content: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width?: number; // Percentage
  height?: number; // Percentage
  style?: Record<string, any>;
}

// ============================================================================
// Slide Layout
// ============================================================================

export type SlideLayout =
  | 'title'
  | 'bullet-points'
  | 'image-left'
  | 'image-right'
  | 'two-column'
  | 'blank'
  | 'title-content'
  | 'comparison';

// ============================================================================
// Slide Theme
// ============================================================================

export type SlideTheme = 'modern' | 'classic' | 'dark' | 'vibrant' | 'minimal' | 'corporate';

// ============================================================================
// Slide
// ============================================================================

export interface Slide {
  id: string;
  title: string;
  notes?: string;
  elements: SlideElement[];
  layout: SlideLayout;
  backgroundColor?: string;
  backgroundImage?: string;
  transition?: string;
}

// ============================================================================
// Presentation
// ============================================================================

export interface Presentation extends BaseEntity {
  title: string;
  slides: Slide[];
  theme: SlideTheme;
  settings?: PresentationSettings;
}

export interface PresentationSettings {
  aspectRatio?: '16:9' | '4:3' | '1:1';
  defaultFont?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// ============================================================================
// Presentation Template
// ============================================================================

export interface PresentationTemplate extends BaseEntity {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  theme: SlideTheme;
  slideCount: number;
  category?: string;
  tags?: string[];
}

// ============================================================================
// Presentation Generation
// ============================================================================

export interface PresentationGenerationConfig {
  topic: string;
  slideCount: number;
  theme?: SlideTheme;
  language?: string;
  tone?: 'professional' | 'casual' | 'academic' | 'creative';
  includeImages?: boolean;
}

export interface PresentationTask extends BaseEntity {
  config: PresentationGenerationConfig;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  result?: Presentation;
  error?: string;
  progress?: number;
}
