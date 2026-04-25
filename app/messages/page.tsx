'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { getConversations, Conversation } from '@/lib/chat-utils'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  useEffect(() => {
    if (!userId) {
      router.push('/')
      return
    }

    loadConversations()
  }, [userId, router])

  const loadConversations = async () => {
    try {
      if (!userId) return
      const data = await getConversations(userId)
      setConversations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando mensajes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Mensajes - Be Living" showThemeToggle={true} />

      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Link href="/properties" className="text-black dark:text-white underline text-sm">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-light text-black dark:text-white mb-8">Mensajes</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-6">No tienes conversaciones</p>
            <Link href="/properties" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">
              Explorar propiedades
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="block border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-black dark:hover:border-white transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-black dark:text-white">
                      {conv.property_title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {conv.last_message ? conv.last_message.substring(0, 100) : 'Sin mensajes'}
                      {conv.last_message && conv.last_message.length > 100 ? '...' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {conv.last_message_at
                        ? new Date(conv.last_message_at).toLocaleDateString('es-ES')
                        : 'Ahora'}
                    </p>
                  </div>
                  {conv.unread_count && conv.unread_count > 0 && (
                    <div className="ml-4 bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full text-sm font-medium">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
