
import React from 'react';
import { ChatMessage } from '../../types';

interface MessageContentProps {
  message: ChatMessage;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  return (
    <div className="whitespace-pre-wrap break-words">
        {message.content}
    </div>
  );
};

export default MessageContent;
