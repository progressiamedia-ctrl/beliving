'use client';

import { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/lib/hooks';

interface ChatComponentProps {
  conversationId: string;
  userId: string;
  userName: string;
}

export function ChatComponent({ conversationId, userId, userName }: ChatComponentProps) {
  const { messages, loading, fetchMessages, sendMessage } = useMessages();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar mensajes al inicializar
    fetchMessages(conversationId);

    // Poll para nuevos mensajes cada 3 segundos
    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    const success = await sendMessage(
      conversationId,
      userId,
      userName,
      messageText
    );

    if (success) {
      setMessageText('');
    }

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No hay mensajes aún. ¡Empieza la conversación!
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender_id === userId
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black'
                }`}
              >
                {message.sender_id !== userId && (
                  <p className="text-sm font-semibold mb-1">{message.sender_name}</p>
                )}
                <p className="break-words">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isSending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {isSending ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
