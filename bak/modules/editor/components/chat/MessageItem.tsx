
import React from 'react';
import { ChatMessage } from '../../types';
import ChatBubble from './ChatBubble';

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return <ChatBubble message={message} />;
};

export default MessageItem;
