'use client'

import { useState, useRef, useEffect } from 'react'
import { Property } from '@/lib/properties-data'

interface SearchBarProps {
  properties: Property[]
  onSearch: (filters: {
    searchQuery: string
    selectedCity: string
    maxPrice: string
  }) => void
  cities: string[]
}

interface ParsedQuery {
  searchQuery: string
  city: string
  price: number
}

export function SearchBar({ properties, onSearch, cities }: SearchBarProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Property[]>([])
  const [messages, setMessages] = useState<{ type: 'user' | 'ai'; text: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const parseQuery = (query: string): ParsedQuery => {
    const lowerQuery = query.toLowerCase()
    let city = ''
    let price = 0

    // Extract city
    for (const c of cities) {
      if (lowerQuery.includes(c.toLowerCase())) {
        city = c
        break
      }
    }

    // Extract price - look for patterns like "menos de 500", "máximo 300", "$200", etc.
    const priceMatch = lowerQuery.match(/(\d{2,4})\s*(dólares|usd|\$)?|menos de\s*(\d{2,4})|máximo\s*(\d{2,4})|por\s*(\d{2,4})/)
    if (priceMatch) {
      const extractedPrice = priceMatch[1] || priceMatch[3] || priceMatch[4] || priceMatch[5]
      price = extractedPrice ? parseInt(extractedPrice) : 0
    }

    return {
      searchQuery: query,
      city,
      price,
    }
  }

  const generateAIResponse = (query: string, parsed: ParsedQuery) => {
    let response = '🔍 '

    if (parsed.city) {
      response += `Buscando en ${parsed.city}`
    } else {
      response += 'Buscando en todas las ciudades'
    }

    if (parsed.price > 0) {
      response += ` con máximo $${parsed.price}/noche`
    }

    // Count results
    let filtered = properties
    if (parsed.city) {
      filtered = filtered.filter((p) => p.city === parsed.city)
    }
    if (parsed.price > 0) {
      filtered = filtered.filter((p) => p.price <= parsed.price)
    }
    if (query.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.location.toLowerCase().includes(query.toLowerCase())
      )
    }

    response += `. Encontré ${filtered.length} propiedad${filtered.length !== 1 ? 'es' : ''}.`

    return response
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { type: 'user', text: input }])

    // Parse query
    const parsed = parseQuery(input)

    // Generate AI response
    const aiResponse = generateAIResponse(input, parsed)
    setMessages((prev) => [...prev, { type: 'ai', text: aiResponse }])

    // Apply filters
    onSearch({
      searchQuery: input.trim(),
      selectedCity: parsed.city || '',
      maxPrice: parsed.price > 0 ? parsed.price.toString() : '',
    })

    setInput('')
    setSuggestions([])
  }

  const handleInputChange = (value: string) => {
    setInput(value)

    // Show suggestions while typing
    if (value.trim()) {
      const parsed = parseQuery(value)
      let filtered = properties

      if (parsed.city) {
        filtered = filtered.filter((p) => p.city === parsed.city)
      }
      if (parsed.price > 0) {
        filtered = filtered.filter((p) => p.price <= parsed.price)
      }

      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(value.toLowerCase()) ||
          p.location.toLowerCase().includes(value.toLowerCase())
      )

      setSuggestions(filtered.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (property: Property) => {
    setInput(property.title)
    setSuggestions([])
    // Trigger search
    setTimeout(() => {
      handleSubmit(new Event('submit') as any)
    }, 0)
  }

  return (
    <div className="flex flex-col h-full backdrop-blur-[40px] bg-white/10 dark:bg-black/10">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-lg font-light text-gray-900 dark:text-white mb-2">
                ¿A dónde quieres ir?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                Describe lo que buscas en una frase. Ej: "Villa en Dubai por menos de 500"
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl backdrop-blur-[30px] ${
                    msg.type === 'user'
                      ? 'bg-black/30 dark:bg-white/20 border border-white/40 text-white dark:text-white'
                      : 'bg-white/20 dark:bg-white/15 border border-white/30 text-gray-900 dark:text-white shadow-lg'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Search input area */}
      <div className="border-t border-white/20 p-4 space-y-2 backdrop-blur-[20px] bg-white/5">
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="backdrop-blur-[30px] bg-white/20 dark:bg-white/10 rounded-2xl border border-white/30 p-2 space-y-1 max-h-40 overflow-y-auto shadow-lg">
            {suggestions.map((property) => (
              <button
                key={property.id}
                onClick={() => handleSuggestionClick(property)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/15 transition"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {property.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {property.location} • ${property.price}/noche
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ej: Villa en Dubai por menos de 500..."
            className="flex-1 px-4 py-3 backdrop-blur-[30px] border border-white/40 rounded-2xl bg-white/20 dark:bg-white/15 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition shadow-lg"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-3 backdrop-blur-[30px] bg-yellow-400/80 hover:bg-yellow-400 border border-yellow-500/50 text-gray-900 rounded-2xl font-medium transition disabled:opacity-50 shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.5 1.5H3a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5V2a.5.5 0 00-.5-.5a.5.5 0 00-.5.5v12a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5h7.5a.5.5 0 000-1z" />
              <path d="M16.354 4.354l-8 8a.5.5 0 01-.708 0l-4-4a.5.5 0 01.708-.708L7.5 11.293l7.646-7.646a.5.5 0 01.708.708z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
