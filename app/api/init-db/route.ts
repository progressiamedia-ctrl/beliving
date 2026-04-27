import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Database init endpoint ready. Use POST to initialize.'
  })
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')

  if (auth !== 'Bearer init-db-secret-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[INIT-DB] Starting initialization...')

    const password = 'Beproperty1236.'
    const host = 'xgqiftublvrockxgzwzc.db.supabase.co'

    // Use dynamic import
    let pg: any
    try {
      pg = await import('pg')
    } catch {
      pg = require('pg')
    }

    const { Client } = pg
    const client = new Client({
      user: 'postgres',
      password: password,
      host: host,
      port: 5432,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    })

    console.log('[INIT-DB] Connecting...')
    await client.connect()
    console.log('[INIT-DB] Connected!')

    // SQL statements
    const sql = [
      'DROP TABLE IF EXISTS messages CASCADE',
      'DROP TABLE IF EXISTS reviews CASCADE',
      'DROP TABLE IF EXISTS bookings CASCADE',
      'DROP TABLE IF EXISTS properties CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      `CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        user_type VARCHAR CHECK (user_type IN ('guest', 'host')) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        first_name VARCHAR,
        last_name VARCHAR,
        avatar_url VARCHAR,
        bio TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_users_user_type ON users(user_type)',
      `CREATE TABLE properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        description TEXT,
        location VARCHAR NOT NULL,
        city VARCHAR NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        amenities TEXT[] DEFAULT '{}',
        images TEXT[] DEFAULT '{}',
        rating DECIMAL(3, 2) DEFAULT 5.0,
        verified BOOLEAN DEFAULT FALSE,
        available BOOLEAN DEFAULT TRUE,
        max_guests INTEGER DEFAULT 2,
        bedrooms INTEGER DEFAULT 1,
        bathrooms INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      'CREATE INDEX idx_properties_host_id ON properties(host_id)',
      'CREATE INDEX idx_properties_city ON properties(city)',
      'CREATE INDEX idx_properties_available ON properties(available)',
      `CREATE TABLE bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      'CREATE INDEX idx_bookings_property_id ON bookings(property_id)',
      'CREATE INDEX idx_bookings_guest_id ON bookings(guest_id)',
      'CREATE INDEX idx_bookings_status ON bookings(status)',
      `CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      'CREATE INDEX idx_reviews_property_id ON reviews(property_id)',
      'CREATE INDEX idx_reviews_guest_id ON reviews(guest_id)',
      `CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      'CREATE INDEX idx_messages_sender_id ON messages(sender_id)',
      'CREATE INDEX idx_messages_recipient_id ON messages(recipient_id)',
      'CREATE INDEX idx_messages_created_at ON messages(created_at)'
    ]

    let executed = 0
    for (const statement of sql) {
      try {
        await client.query(statement)
        executed++
      } catch (e: any) {
        console.log(`[INIT-DB] ${e.message}`)
      }
    }

    // Verify
    const tables = ['users', 'properties', 'bookings', 'reviews', 'messages']
    const verification: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        const res = await client.query(
          'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
          [table]
        )
        verification[table] = res.rows[0]?.exists || false
      } catch {
        verification[table] = false
      }
    }

    await client.end()

    return NextResponse.json({
      status: 'success',
      executed,
      tables: verification
    })

  } catch (error: any) {
    console.error('[INIT-DB]', error?.message)
    return NextResponse.json(
      {
        status: 'error',
        error: error?.message || 'Database initialization failed'
      },
      { status: 500 }
    )
  }
}
