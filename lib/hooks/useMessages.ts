'use client';

import { useState, useCallback } from 'react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  guest_name: string;
  host_name: string;
  guest_email: string;
  host_email: string;
  property_id: string;
  property_title: string;
  created_at: string;
  updated_at: string;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (conversationData: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData)
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const newConversation = await response.json();
      setConversations([...conversations, newConversation]);
      return newConversation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [conversations]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, senderId: string, senderName: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: senderId,
          sender_name: senderName,
          content
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const newMessage = await response.json();
      setMessages([...messages, newMessage]);
      return newMessage;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [messages]);

  return {
    messages,
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
    fetchMessages,
    sendMessage
  };
}
