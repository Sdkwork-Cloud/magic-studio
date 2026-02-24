
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList, MentionListRef } from './components/MentionList';
import { InputAttachment } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SuggestionProps {
    items: InputAttachment[];
}

export const getSuggestionConfig = (getAttachments: () => InputAttachment[]) => ({
  items: ({ query }: { query: string }) => {
    const attachments = getAttachments();
    return attachments
      .filter(item => item.name.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null;
    let popup: any | null = null;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.[0].hide();
          return true;
        }

        return component?.ref?.onKeyDown(props) || false;
      },

      onExit() {
        popup?.[0].destroy();
        component?.destroy();
      },
    };
  },
});
