
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MiniProgramNode } from './MiniProgramNode';

export const MiniProgramExtension = Node.create({
  name: 'miniProgram',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      appid: { default: '' },
      path: { default: '' },
      title: { default: '' },
      image: { default: '' },
      type: { default: 'card' },
      text: { default: '' },
      service: { default: '0' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mp-miniprogram',
        getAttrs: (node) => {
          if (typeof node === 'string') return null;
          const element = node as HTMLElement;
          return {
            type: 'card',
            appid: element.getAttribute('data-miniprogram-appid'),
            path: element.getAttribute('data-miniprogram-path'),
            title: element.getAttribute('data-miniprogram-title'),
            image: element.getAttribute('data-miniprogram-image'),
            service: element.getAttribute('data-miniprogram-service'), // Default usually empty
          };
        },
      },
      {
        // For text/image links, WeChat uses standard <a> with custom data attributes
        tag: 'a[data-miniprogram-appid]',
        getAttrs: (node) => {
          if (typeof node === 'string') return null;
          const element = node as HTMLElement;
          const img = element.querySelector('img');
          const appid = element.getAttribute('data-miniprogram-appid');
          const path = element.getAttribute('data-miniprogram-path');
          const service = element.getAttribute('data-miniprogram-service');

          if (img) {
            return {
              type: 'image',
              appid,
              path,
              service,
              image: img.getAttribute('src'),
            };
          }
          return {
            type: 'text',
            appid,
            path,
            service,
            text: element.textContent,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { type, appid, path, title, image, text } = HTMLAttributes;
    
    // Standard WeChat Attributes
    const commonAttrs = {
        'data-miniprogram-appid': appid,
        'data-miniprogram-path': path,
        'data-miniprogram-type': type, // Optional helper
        'data-miniprogram-servicetype': '' // Usually empty string for standard MP
    };

    if (type === 'card') {
      // Official Card Format: <mp-miniprogram ...attributes...></mp-miniprogram>
      return ['mp-miniprogram', mergeAttributes(commonAttrs, {
        'data-miniprogram-title': title,
        'data-miniprogram-imageurl': image, // WeChat uses imageurl for card cover
      })];
    }

    if (type === 'image') {
      // Image Link: <a ...><img src="..." /></a>
      return ['a', mergeAttributes(commonAttrs, { href: '', class: 'weapp_image_link' }), 
        ['img', { src: image, alt: 'MiniProgram', style: 'width: 100%; display: block;' }]
      ];
    }

    // Text Link: <a ...>Text</a>
    return ['a', mergeAttributes(commonAttrs, { href: '', class: 'weapp_text_link' }), text || title || 'Mini Program'];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MiniProgramNode);
  },
});
