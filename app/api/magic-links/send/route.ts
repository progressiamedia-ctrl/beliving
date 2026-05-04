import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { error } = await supabase
      .from('magic_links')
      .insert([{
        email,
        token,
        expires_at: expiresAt.toISOString()
      }])

    if (error) throw error

    // In production, send email with link
    const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/magic-link?token=${token}`

    console.log(`Magic link for ${email}: ${magicLink}`)

    return NextResponse.json({
      success: true,
      message: 'Magic link sent',
      // For development only - remove in production
      link: process.env.NODE_ENV === 'development' ? magicLink : undefined
    })
  } catch (error) {
    console.error('Send magic link error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
