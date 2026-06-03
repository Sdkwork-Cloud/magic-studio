
import { ReactRenderer } from '@tiptap/react';
import createPopup from './popup';
import { MentionList, MentionListRef } from './components/MentionList';
import { InputAttachment } from './types';

const buildSuggestionConfig = (getAttachments: () => InputAttachment[]) => ({
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

        popup = createPopup('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
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

export const getSuggestionConfig = buildSuggestionConfig;

export interface SuggestionConfigSource {
  config: ReturnType<typeof buildSuggestionConfig>;
  setAttachments: (attachments: InputAttachment[]) => void;
}

export const createSuggestionConfigSource = (
  initialAttachments: InputAttachment[]
): SuggestionConfigSource => {
  let attachments = initialAttachments;

  return {
    config: buildSuggestionConfig(() => attachments),
    setAttachments(nextAttachments) {
      attachments = nextAttachments;
    },
  };
};
