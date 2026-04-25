'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { ChatWindow } from '@/components/ChatWindow'
import { getConversation, getMessages, sendMessage, Message, Conversation } from '@/lib/chat-utils'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userEmail')?.split('@')[0] : 'Usuario'

  useEffect(() => {
    if (!userId) {
      router.push('/')
      return
    }

    loadData()
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [userId, conversationId, router])

  const loadData = async () => {
    try {
      if (!userId) return

      const conv = await getConversation(conversationId)
      setConversation(conv)

      const msgs = await getMessages(conversationId)
      setMessages(msgs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversación')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const msgs = await getMessages(conversationId)
      setMessages(msgs)
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!userId || !conversation || !userName) return

    try {
      const newMessage = await sendMessage(conversationId, userId, userName, content)
      setMessages([...messages, newMessage])
    } catch (err) {
      throw err
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando conversación...</p>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header title="Mensajes - Be Living" showThemeToggle={true} />

        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-red-600 dark:text-red-400 mb-6">{error || 'Conversación no encontrada'}</p>
          <Link href="/messages" className="text-black dark:text-white underline">
            Volver a mensajes
          </Link>
        </div>
      </div>
    )
  }

  const otherUser =
    userId === conversation.guest_id ? conversation.host_name : conversation.guest_name

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title={`Chat - ${conversation.property_title}`} showThemeToggle={true} />

      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/messages" className="text-black dark:text-white underline text-sm">
            ← Volver a mensajes
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Property Info */}
        <div className="mb-8 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">{conversation.property_title}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Propiedad</p>
              <p className="text-black dark:text-white font-medium">{conversation.property_title}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Chat con</p>
              <p className="text-black dark:text-white font-medium">{otherUser}</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <ChatWindow
          messages={messages}
          currentUserId={userId || ''}
          otherUserName={otherUser}
          onSendMessage={handleSendMessage}
          isLoading={loading}
        />
      </div>
    </div>
  )
}
