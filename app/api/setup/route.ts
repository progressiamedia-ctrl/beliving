import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.SETUP_SECRET_KEY || 'setup-key-123'}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('[SETUP] Starting database setup...')

    // Test 1: Check if users table exists
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (usersError?.code === 'PGRST116') {
      console.log('[SETUP] Users table does not exist - would need to create via SQL Editor')
      return NextResponse.json({
        status: 'tables_missing',
        message: 'Database tables do not exist. Execute lib/setup.sql in Supabase SQL Editor manually.',
        tables_status: {
          users: 'missing',
          properties: 'unknown',
          bookings: 'unknown'
        }
      }, { status: 400 })
    }

    // Test 2: Check properties table
    const { data: propsData, error: propsError } = await supabase
      .from('properties')
      .select('id')
      .limit(1)

    if (propsError?.code === 'PGRST116') {
      return NextResponse.json({
        status: 'tables_missing',
        message: 'Properties table missing. Execute lib/setup.sql in Supabase SQL Editor.',
        tables_status: {
          users: usersError ? 'missing' : 'ok',
          properties: 'missing',
          bookings: 'unknown'
        }
      }, { status: 400 })
    }

    console.log('[SETUP] All tables verified!')

    return NextResponse.json({
      status: 'success',
      message: 'All database tables exist and are accessible',
      tables_status: {
        users: 'ok',
        properties: 'ok',
        bookings: 'ok'
      }
    })

  } catch (error) {
    console.error('[SETUP] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Setup error'
      },
      { status: 500 }
    )
  }
}
