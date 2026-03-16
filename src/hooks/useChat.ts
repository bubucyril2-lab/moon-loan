import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';

export const useChat = (otherUserId?: number) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user) return;

    const newSocket = io({
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsOnline(true);
      newSocket.emit('join', user.id);
    });

    newSocket.on('receive_message', (message: Message) => {
      if (otherUserId && (message.sender_id === otherUserId || message.receiver_id === otherUserId)) {
        setMessages((prev) => [...prev, message]);
      }
    });

    newSocket.on('message_sent', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, token, otherUserId]);

  useEffect(() => {
    if (otherUserId && token) {
      fetch(`/api/chat/history/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMessages(data));
    }
  }, [otherUserId, token]);

  const sendMessage = useCallback((message: string) => {
    if (socket && otherUserId && user) {
      socket.emit('send_message', {
        senderId: user.id,
        receiverId: otherUserId,
        message
      });
    }
  }, [socket, otherUserId, user]);

  return { messages, sendMessage, isOnline };
};
