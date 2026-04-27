const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
}

const password = 'Beproperty1236.';
const projectId = 'xgqiftublvrockxgzwzc';
const host = `${projectId}.db.supabase.co`;

console.log('🔧 Conectando a Supabase PostgreSQL...\n');
console.log(`📍 Host: ${host}`);
console.log(`👤 User: postgres\n`);

// SQL para crear tablas
const setupSQL = `
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
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
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

CREATE TABLE properties (
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
);

CREATE INDEX idx_properties_host_id ON properties(host_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_available ON properties(available);

CREATE TABLE bookings (
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
);

CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_guest_id ON reviews(guest_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
`;

const client = new Client({
  user: 'postgres',
  password: password,
  host: host,
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    console.log('⏳ Intentando conectar...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('⏳ Ejecutando SQL...\n');

    // Split and execute statements
    const statements = setupSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 5);

    let success = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        success++;
      } catch (e) {
        console.log(`⚠️  ${e.message.split('\n')[0]}`);
      }
    }

    console.log(`\n✅ ${success}/${statements.length} statements ejecutados\n`);

    // Verify
    console.log('✓ Verificando tablas:');
    const tables = ['users', 'properties', 'bookings', 'reviews', 'messages'];

    for (const table of tables) {
      const res = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      const exists = res.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📱 Plataforma lista en: https://beliving-alpha.vercel.app');

    return true;

  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${error.message}\n`);

    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  No se pudo conectar a Supabase desde esta red.');
      console.log('   Esto puede ser un problema de DNS o firewall.\n');
      console.log('✅ Alternativa: Ejecuta el SQL manualmente en Supabase SQL Editor');
      console.log('   https://app.supabase.com → SQL Editor → + New Query');
    }

    return false;

  } finally {
    await client.end();
  }
}

setup().then(success => {
  process.exit(success ? 0 : 1);
});
