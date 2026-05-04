import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { saveSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

export async function POST(request: NextRequest) {
  try {
    const { token, user_type, first_name, last_name } = await request.json()

    if (!token || !user_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find magic link
    const { data: magicLink, error: linkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check expiry
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      )
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', magicLink.email)
      .single()

    if (existingUser) {
      // Update existing user
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({ first_name, last_name })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Mark link as used
      await supabase
        .from('magic_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', magicLink.id)

      return NextResponse.json({
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        verified: true
      })
    }

    // Create new user
    const tempPassword = hashPassword(crypto.randomBytes(16).toString('hex'))

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: magicLink.email,
        password_hash: tempPassword,
        user_type: user_type || 'guest',
        first_name,
        last_name,
        verified: true
      }])
      .select()
      .single()

    if (createError) throw createError

    // Mark link as used
    await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString(), user_id: newUser.id })
      .eq('id', magicLink.id)

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      user_type: newUser.user_type,
      verified: true
    }, { status: 201 })
  } catch (error) {
    console.error('Verify magic link error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify magic link' },
      { status: 500 }
    )
  }
}
