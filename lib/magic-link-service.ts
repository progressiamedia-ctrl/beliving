import { supabase } from './supabase'
import crypto from 'crypto'

const MAGIC_LINK_EXPIRY_MINUTES = 15

export async function generateMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000)

  // First, delete any existing unused links for this email
  await supabase.from('magic_links').delete().eq('email', email).is('used_at', null)

  // Create new magic link
  const { error } = await supabase.from('magic_links').insert([
    {
      email,
      token,
      expires_at: expiresAt.toISOString(),
    },
  ])

  if (error) throw error

  return token
}

export async function verifyMagicLink(
  token: string
): Promise<{ email: string; userId?: string } | null> {
  const { data, error } = await supabase
    .from('magic_links')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !data) return null

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return null
  }

  // Check if already used
  if (data.used_at) {
    return null
  }

  // Mark as used
  await supabase
    .from('magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id)

  // If user_id is set, return it
  if (data.user_id) {
    return { email: data.email, userId: data.user_id }
  }

  return { email: data.email }
}

export async function getMagicLinkForEmail(email: string) {
  const { data } = await supabase
    .from('magic_links')
    .select('token, expires_at')
    .eq('email', email)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}

export async function linkMagicLinkToUser(token: string, userId: string) {
  const { error } = await supabase
    .from('magic_links')
    .update({ user_id: userId })
    .eq('token', token)

  if (error) throw error
}

export function getMagicLinkURL(token: string): string {
  const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${baseURL}/auth/magic-link?token=${token}`
}
