
import { BaseEntity } from '../../../types/core';

export interface SlideElement {
    id: string;
    type: 'text' | 'image' | 'shape';
    content: string;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    width?: number; // Percentage
    height?: number; // Percentage
    style?: Record<string, any>;
}

export interface Slide {
    id: string;
    title: string;
    notes?: string;
    elements: SlideElement[];
    layout: 'title' | 'bullet-points' | 'image-left' | 'image-right' | 'blank';
    backgroundColor?: string;
}

export interface Presentation extends BaseEntity {
    // Inherited: id, createdAt, updatedAt
    title: string;
    slides: Slide[];
    theme: 'modern' | 'classic' | 'dark' | 'vibrant';
}
