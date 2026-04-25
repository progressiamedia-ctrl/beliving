import { supabase } from './supabase'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  booking_id: string
  guest_id: string
  host_id: string
  guest_name: string
  host_name: string
  guest_email: string
  host_email: string
  property_id: string
  property_title: string
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

export async function getOrCreateConversation(
  bookingId: string,
  guestId: string,
  hostId: string,
  guestName: string,
  hostName: string,
  guestEmail: string,
  hostEmail: string,
  propertyId: string,
  propertyTitle: string
) {
  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('booking_id', bookingId)
    .single()

  if (existing) {
    return existing
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      {
        booking_id: bookingId,
        guest_id: guestId,
        host_id: hostId,
        guest_name: guestName,
        host_name: hostName,
        guest_email: guestEmail,
        host_email: hostEmail,
        property_id: propertyId,
        property_title: propertyTitle,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as Conversation[]) || []
}

export async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error) throw error
  return data as Conversation
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as Message[]) || []
}

export async function sendMessage(conversationId: string, senderId: string, senderName: string, content: string) {
  const { error, data } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        content,
      },
    ])
    .select()
    .single()

  if (error) throw error

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data
}

export async function deleteConversation(conversationId: string) {
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)

  if (messagesError) throw messagesError

  const { error } = await supabase.from('conversations').delete().eq('id', conversationId)

  if (error) throw error
}
