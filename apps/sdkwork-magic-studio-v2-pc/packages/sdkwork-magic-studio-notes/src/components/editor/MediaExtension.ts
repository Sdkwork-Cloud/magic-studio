
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MediaNode } from './MediaNode';
import { createNoteAssetReferenceAttributeDefinitions } from './mediaAssetAttrs';

export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      style: { 
        default: 'width: 100%; height: auto; aspect-ratio: 16/9; border-radius: 8px; background: #000; object-fit: contain; margin: 1rem 0; display: block;' 
      },
      ...createNoteAssetReferenceAttributeDefinitions(),
    };
  },

  parseHTML() {
    return [{ tag: 'video' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaNode);
  },
});

export const AudioExtension = Node.create({
  name: 'audio',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      style: { default: 'width: 100%; margin-top: 10px; margin-bottom: 10px;' },
      ...createNoteAssetReferenceAttributeDefinitions(),
    };
  },

  parseHTML() {
    return [{ tag: 'audio' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaNode);
  },
});
