
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MiniProgramNode } from './MiniProgramNode';
import { ParserNodeInput, toHtmlElement } from './nodeAttrs';

const createMiniProgramImageAssetAttributes = (
  attrs: Record<string, unknown>
): Record<string, string> => {
  const optionalEntries: Array<[string, unknown]> = [
    ['data-miniprogram-image-asset-id', attrs.imageAssetId],
    ['data-miniprogram-image-asset-uuid', attrs.imageAssetUuid],
    ['data-miniprogram-image-primary-resource-id', attrs.imagePrimaryResourceId],
    ['data-miniprogram-image-primary-resource-uuid', attrs.imagePrimaryResourceUuid],
    ['data-miniprogram-image-resource-view-id', attrs.imageResourceViewId],
    ['data-miniprogram-image-resource-view-uuid', attrs.imageResourceViewUuid],
  ];

  return Object.fromEntries(
    optionalEntries.filter(([, value]) => typeof value === 'string' && value.trim().length > 0) as Array<[string, string]>
  );
};

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
      imageAssetId: { default: null },
      imageAssetUuid: { default: null },
      imagePrimaryResourceId: { default: null },
      imagePrimaryResourceUuid: { default: null },
      imageResourceViewId: { default: null },
      imageResourceViewUuid: { default: null },
      type: { default: 'card' },
      text: { default: '' },
      service: { default: '0' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mp-miniprogram',
        getAttrs: (node: ParserNodeInput) => {
          const element = toHtmlElement(node);
          if (!element) return null;
          return {
            type: 'card',
            appid: element.getAttribute('data-miniprogram-appid'),
            path: element.getAttribute('data-miniprogram-path'),
            title: element.getAttribute('data-miniprogram-title'),
            image:
              element.getAttribute('data-miniprogram-image') ||
              element.getAttribute('data-miniprogram-imageurl'),
            imageAssetId: element.getAttribute('data-miniprogram-image-asset-id'),
            imageAssetUuid: element.getAttribute('data-miniprogram-image-asset-uuid'),
            imagePrimaryResourceId: element.getAttribute('data-miniprogram-image-primary-resource-id'),
            imagePrimaryResourceUuid: element.getAttribute('data-miniprogram-image-primary-resource-uuid'),
            imageResourceViewId: element.getAttribute('data-miniprogram-image-resource-view-id'),
            imageResourceViewUuid: element.getAttribute('data-miniprogram-image-resource-view-uuid'),
            service: element.getAttribute('data-miniprogram-service'), // Default usually empty
          };
        },
      },
      {
        // For text/image links, WeChat uses standard <a> with custom data attributes
        tag: 'a[data-miniprogram-appid]',
        getAttrs: (node: ParserNodeInput) => {
          const element = toHtmlElement(node);
          if (!element) return null;
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
              imageAssetId: element.getAttribute('data-miniprogram-image-asset-id'),
              imageAssetUuid: element.getAttribute('data-miniprogram-image-asset-uuid'),
              imagePrimaryResourceId: element.getAttribute('data-miniprogram-image-primary-resource-id'),
              imagePrimaryResourceUuid: element.getAttribute('data-miniprogram-image-primary-resource-uuid'),
              imageResourceViewId: element.getAttribute('data-miniprogram-image-resource-view-id'),
              imageResourceViewUuid: element.getAttribute('data-miniprogram-image-resource-view-uuid'),
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
    const imageAssetAttrs = createMiniProgramImageAssetAttributes(HTMLAttributes as Record<string, unknown>);

    if (type === 'card') {
      // Official Card Format: <mp-miniprogram ...attributes...></mp-miniprogram>
      return ['mp-miniprogram', mergeAttributes(commonAttrs, imageAssetAttrs, {
        'data-miniprogram-title': title,
        'data-miniprogram-imageurl': image, // WeChat uses imageurl for card cover
      })];
    }

    if (type === 'image') {
      // Image Link: <a ...><img src="..." /></a>
      return ['a', mergeAttributes(commonAttrs, imageAssetAttrs, { href: '', class: 'weapp_image_link' }), 
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
