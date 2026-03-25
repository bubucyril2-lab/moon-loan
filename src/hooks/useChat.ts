import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import { storageService } from '../services/storage';

export const useChat = (otherUserId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!user || !otherUserId) return;

    const targetUserId = user.role === 'admin' ? otherUserId : user.id;
    
    // Use real-time listener instead of polling
    const unsubscribe = storageService.onChatMessages(targetUserId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [user, otherUserId]);

  const sendMessage = useCallback(async (text: string) => {
    if (otherUserId && user) {
      const targetUserId = user.role === 'admin' ? otherUserId : user.id;
      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        userId: targetUserId,
        senderId: user.id,
        text,
        isAdmin: user.role === 'admin',
        createdAt: new Date().toISOString()
      };
      await storageService.saveChatMessage(newMessage);
      setMessages(prev => [...prev, newMessage]);
    }
  }, [otherUserId, user]);

  return { messages, sendMessage, isOnline };
};
