
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FileAttachmentNode } from './FileAttachmentNode';
import { createNoteAssetReferenceAttributeDefinitions } from './mediaAssetAttrs';

export const FileAttachmentExtension = Node.create({
  name: 'fileAttachment',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: 'file' },
      size: { default: 0 },
      mime: { default: 'application/octet-stream' },
      ...createNoteAssetReferenceAttributeDefinitions(),
    };
  },

  parseHTML() {
    return [
      {
        tag: 'file-attachment',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['file-attachment', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentNode);
  },
});
