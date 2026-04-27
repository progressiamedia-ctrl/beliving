import { NextRequest, NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { properties } from '@/lib/properties-data'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as { messages: ChatMessage[] }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    let allProperties = properties

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(supabaseUrl, serviceRoleKey)

      const { data: dbProperties } = await supabase
        .from('properties')
        .select('*')
        .limit(100)

      if (dbProperties && dbProperties.length > 0) {
        allProperties = dbProperties as any
      }
    } catch (err) {
      console.log('[CHAT] Using static properties fallback')
    }

    const lastUserMessage = messages[messages.length - 1]?.content || ''
    let relevantProperties = filterProperties(allProperties, lastUserMessage)

    if (relevantProperties.length > 20) {
      relevantProperties = relevantProperties.slice(0, 20)
    }

    const propertiesContext = relevantProperties
      .map(p => `ID: ${p.id} | ${p.title} | ${p.city} | $${p.price}/noche | ${p.amenities.join(', ')} | Rating: ${p.rating}⭐`)
      .join('\n')

    const systemPrompt = `Eres el asistente de búsqueda de Be Living, una plataforma premium de alojamientos globales.
Tu trabajo es ayudar a los viajeros a encontrar la propiedad ideal según sus preferencias.

Cuando el usuario describa lo que busca:
1. Analiza sus preferencias: ciudad, presupuesto, amenidades, tipo de alojamiento, número de huéspedes
2. Recomienda las propiedades más relevantes del catálogo
3. Explica brevemente por qué cada una encaja con sus necesidades
4. SIEMPRE termina tu respuesta con esta línea exacta: [PROPERTIES: id1,id2,id3] usando los IDs de las propiedades recomendadas

Si el usuario refina su búsqueda, ajusta las recomendaciones basándote en el historial de conversación.

Sé amable, entusiasta y específico. Habla siempre en español. Sé conciso pero informativo.

CATÁLOGO DISPONIBLE (máximo ${relevantProperties.length} propiedades filtradas):
${propertiesContext}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    const propertyIdMatch = assistantMessage.match(/\[PROPERTIES:\s*([^\]]+)\]/)
    const propertyIds = propertyIdMatch
      ? propertyIdMatch[1].split(',').map(id => id.trim())
      : []

    const cleanMessage = assistantMessage.replace(/\[PROPERTIES:[^\]]*\]/g, '').trim()

    return NextResponse.json({
      reply: cleanMessage,
      propertyIds: propertyIds,
      recommendedProperties: relevantProperties.filter(p => propertyIds.includes(p.id))
    })
  } catch (error) {
    console.error('[CHAT] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat error' },
      { status: 500 }
    )
  }
}

function filterProperties(allProps: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase()

  const cities = ['dubai', 'barcelona', 'madrid', 'viña del mar', 'bali', 'cancun']
  const mentionedCities = cities.filter(city => lowerQuery.includes(city))

  const priceMatches = query.match(/\$?(\d+)/g)
  const maxPrice = priceMatches
    ? Math.max(...priceMatches.map(p => parseInt(p.replace(/\D/g, '')) || 0))
    : null

  const scored = allProps.map(prop => {
    let score = 0

    if (mentionedCities.length > 0) {
      if (mentionedCities.some(city => prop.city.toLowerCase().includes(city))) {
        score += 100
      }
    }

    if (maxPrice && prop.price <= maxPrice) {
      score += 50
    }

    const amenities = prop.amenities?.join(' ').toLowerCase() || ''
    const keywords = ['piscina', 'playa', 'lujo', 'villa', 'apartamento', 'wifi', 'gym', 'spa', 'jacuzzi', 'vistas']
    keywords.forEach(keyword => {
      if ((lowerQuery.includes(keyword) && amenities.includes(keyword)) ||
          (prop.title?.toLowerCase().includes(keyword) && lowerQuery.includes(keyword))) {
        score += 10
      }
    })

    score += prop.rating * 2

    return { ...prop, score }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 30)
}
