import { supabase } from './supabase'
import crypto from 'crypto'

// Hash password using PBKDF2
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [salt, hash] = hashedPassword.split(':')
    if (!salt || !hash) return false

    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex')

    return verifyHash === hash
  } catch {
    return false
  }
}

// Generate JWT token
export function generateToken(userId: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  }

  const secret = 'beliving-secret-key-2024'
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

// Verify JWT token
export function verifyToken(token: string): { sub: string } | null {
  try {
    const secret = 'beliving-secret-key-2024'
    const [encodedHeader, encodedPayload, signature] = token.split('.')

    if (!encodedHeader || !encodedPayload || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    if (signature !== expectedSignature) return null

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())

    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return { sub: payload.sub }
  } catch {
    return null
  }
}

// Sign up with hashed password
export async function signUp(email: string, password: string, role: 'host' | 'guest') {
  const hashedPassword = await hashPassword(password)
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password: hashedPassword, role }])
    .select()

  if (error) throw error
  return data[0]
}

// Sign in with password verification
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) throw new Error('Usuario no encontrado')

  const isValid = await verifyPassword(password, data.password)
  if (!isValid) throw new Error('Contraseña incorrecta')

  return data
}

// Get current user
export async function getCurrentUser() {
  const userId = localStorage.getItem('userId')
  if (!userId) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return data
}
