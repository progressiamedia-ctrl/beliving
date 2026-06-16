'use client';

import { useState, useEffect } from 'react';
import { useMessages } from '@/lib/hooks';
import Link from 'next/link';

interface ConversationsListProps {
  userId: string;
}

export function ConversationsList({ userId }: ConversationsListProps) {
  const { conversations, loading, error, fetchConversations } = useMessages();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations(userId);
  }, [userId, fetchConversations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Cargando conversaciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error al cargar conversaciones: {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="mb-2">No hay conversaciones aún</p>
          <p className="text-sm">Las conversaciones aparecerán aquí cuando hagas una reserva</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col backdrop-blur-[40px] bg-white/20 dark:bg-white/10 rounded-2xl border border-white/40 shadow-lg">
      <div className="flex-1 overflow-y-auto border-r border-white/30">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
          >
            <div
              onClick={() => setSelectedConversationId(conversation.id)}
              className={`p-4 border-b border-white/20 cursor-pointer transition ${
                selectedConversationId === conversation.id
                  ? 'backdrop-blur-[30px] bg-yellow-400/30 border-yellow-300/50'
                  : 'hover:bg-white/20 dark:hover:bg-white/15'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {conversation.property_title}
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                Con: {conversation.guest_id === userId ? conversation.host_name : conversation.guest_name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
