
import React from 'react';

export type PortalTab = 'short_drama' | 'video' | 'image' | 'one_click' | 'human' | 'music' | 'speech';

export interface InputAttachment {
    id: string;
    name: string;
    url?: string;
    type: 'image' | 'video' | 'file' | 'script' | 'audio';
    size?: number;
}

export interface CreationChatInputProps {
    // --- Core Data ---
    value: string;
    onChange: (value: string) => void;
    
    // --- Actions ---
    onGenerate: () => void;
    onStop?: () => void;
    isGenerating?: boolean;
    
    // --- Attachments ---
    attachments?: InputAttachment[];
    onRemoveAttachment?: (id: string) => void;
    /** 
     * Modified to accept source type.
     * 'local' triggers file picker, 'asset' triggers asset modal.
     */
    onUpload?: (source: 'local' | 'asset') => void;
    
    // --- Customization ---
    /** Content to render above the input (e.g. Tabs) */
    header?: React.ReactNode;
    
    /** Content to render in the bottom left (e.g. Settings, Model Selectors) */
    footerControls?: React.ReactNode;

    /** Content to render in the bottom right, before the send button (e.g. Batch Size) */
    rightControls?: React.ReactNode;
    
    /** Primary action button override (defaults to Generate) */
    actionButton?: React.ReactNode;
    
    /** Estimated cost to display next to the button */
    cost?: number;
    
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
    textareaClassName?: string;
    
    /** Optional gradient style for Hero visual (CSS class) */
    glowClassName?: string;

    /** Custom width for the input container */
    width?: string | number;

    /** Custom minimum height for the text area (in pixels) */
    minHeight?: number;

    /** Custom maximum height for the text area (in pixels) */
    maxHeight?: number;

    /** Visual variant of the input */
    variant?: 'default' | 'compact' | 'hero';

    /** Reference to access the underlying Tiptap editor instance */
    editorInstanceRef?: React.MutableRefObject<any | null>;
}
