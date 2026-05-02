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

// DEPRECATED: Removed generateToken and verifyToken functions
// - These functions had hardcoded secrets which pose a security risk
// - They are not used anywhere in the application
// - Use Supabase Auth or implement proper JWT signing with env variables instead

// Sign up with hashed password
export async function signUp(email: string, password: string, user_type: 'host' | 'guest') {
  const hashedPassword = await hashPassword(password)
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password_hash: hashedPassword, user_type }])
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

  const isValid = await verifyPassword(password, data.password_hash)
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
