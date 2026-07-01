import ImageExtension from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { ImageNode } from './ImageNode';
import { createNoteAssetReferenceAttributeDefinitions } from './mediaAssetAttrs';

export const NoteImageExtension = ImageExtension.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      ...createNoteAssetReferenceAttributeDefinitions(),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
}).configure({
  inline: true,
  allowBase64: true,
});
