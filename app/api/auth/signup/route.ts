import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers)
    const { success, remaining } = rateLimit(clientIp)

    if (!success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos' },
        {
          status: 429,
          headers: { 'Retry-After': '900' }
        }
      )
    }

    const { email, password, user_type, referral_code, referral_type } = await request.json()

    if (!email || !password || !user_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const hashedPassword = await hashPassword(password)

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Handle referral code if provided
    let referred_by_agent_id = null
    if (referral_code && referral_type && ['host', 'guest'].includes(referral_type)) {
      const { data: agentData } = await supabase
        .from('users')
        .select('id')
        .eq('agent_referral_code', referral_code)
        .eq('agent_enabled', true)
        .single()

      if (agentData) {
        referred_by_agent_id = agentData.id
      }
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        user_type,
        verified: false,
        referred_by_agent_id,
        referral_registration_type: referral_type || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: error.message || 'Registration failed' },
        { status: 400 }
      )
    }

    // Create referral tracking record
    if (referred_by_agent_id && referral_type) {
      try {
        if (referral_type === 'host') {
          await supabase
            .from('agent_host_referrals')
            .insert({
              agent_id: referred_by_agent_id,
              host_id: data.id,
              referral_code,
              registered_at: new Date().toISOString(),
              status: 'prospect'
            })
        } else if (referral_type === 'guest') {
          await supabase
            .from('agent_guest_referrals')
            .insert({
              agent_id: referred_by_agent_id,
              guest_id: data.id,
              referral_code,
              registered_at: new Date().toISOString(),
              status: 'prospect'
            })
        }
      } catch (refError) {
        console.error('Referral tracking error:', refError)
      }
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      user_type: data.user_type
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
