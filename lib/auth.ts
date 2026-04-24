import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export async function signUp(email: string, password: string, role: 'host' | 'guest') {
  const hashedPassword = await bcrypt.hash(password, 10)
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password: hashedPassword, role }])
    .select()

  if (error) throw error
  return data[0]
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) throw new Error('User not found')

  const isValid = await bcrypt.compare(password, data.password)
  if (!isValid) throw new Error('Invalid password')

  return data
}

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
