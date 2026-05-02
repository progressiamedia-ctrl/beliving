/**
 * Auth utilities using Supabase Auth
 * Replaces localStorage-based auth with proper session management
 */

import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  user_type: 'guest' | 'host'
}

/**
 * Sign up with email and password
 * Automatically creates user in 'users' table via database trigger
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  userType: 'guest' | 'host'
) {
  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Error en signup')
  }

  // 2. Create user record in database
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email,
        user_type: userType,
      },
    ])
    .select()

  if (dbError) {
    // Rollback: delete auth user if DB insert fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(dbError.message)
  }

  return { user: userData[0], session: authData.session }
}

/**
 * Sign in with email and password
 * Uses Supabase Auth for session management
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Get current authenticated user
 * Uses Supabase Session (secure, server-aware)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch full user profile from database
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('id', user.id)
    .single()

  return profile || null
}

/**
 * Get current session (for client-side checks)
 */
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/**
 * Change password
 */
export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Reset password (send email)
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Update password with token (from reset email)
 */
export async function updatePasswordWithToken(
  token: string,
  newPassword: string
) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Magic Link sign in
 */
export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Verify magic link token
 */
export async function verifyMagicLink(token: string, type: 'signup' | 'magiclink') {
  const { error } = await supabase.auth.verifyOtp({
    email: '', // Will be extracted from session
    token,
    type,
  })

  if (error) {
    throw new Error(error.message)
  }
}
