
import { Mark, mergeAttributes } from '@tiptap/core';
import { ParserNodeInput, toHtmlElement } from './nodeAttrs';

export interface TextColorOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const TextColorExtension = Mark.create<TextColorOptions>({
  name: 'textColor',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element: ParserNodeInput) => {
          // Only match spans that actually have a color style set
          return toHtmlElement(element)?.style.color ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: ParserNodeInput) => toHtmlElement(element)?.style.color,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `color: ${attributes.color}`,
          };
        },
      },
    };
  },
});
