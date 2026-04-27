'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const sqlContent = `-- Be Living Database Setup
-- Copia todo esto y pégalo en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

CREATE TABLE IF NOT EXISTS properties (
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

CREATE INDEX IF NOT EXISTS idx_properties_host_id ON properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);

CREATE TABLE IF NOT EXISTS bookings (
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

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_guest_id ON reviews(guest_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlContent)
      setMessage('✅ SQL copiado al portapapeles')
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('❌ Error al copiar')
    }
  }

  const handleVerify = async () => {
    setStatus('checking')
    setMessage('Verificando tablas...')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'authorization': `Bearer setup-key-123`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('✅ ¡Todas las tablas existen! La plataforma está lista.')
      } else {
        setStatus('error')
        setMessage(`⚠️ ${data.message}. Por favor, ejecuta el SQL abajo.`)
      }
    } catch (error) {
      setStatus('error')
      setMessage('❌ Error al verificar. Asegúrate de haber ejecutado el SQL.')
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">🔧 Setup Be Living</h1>
        <p className="text-gray-400 text-center mb-8">Configura la base de datos ejecutando el SQL abajo</p>

        {/* Steps */}
        <div className="space-y-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-3">📋 Pasos:</h2>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside">
              <li>Copia el SQL abajo (botón "Copiar SQL")</li>
              <li>Abre <a href="https://app.supabase.com/projects" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300">Supabase Dashboard</a></li>
              <li>Ve a tu proyecto → <strong>SQL Editor</strong></li>
              <li>Haz clic en <strong>+ New Query</strong></li>
              <li>Pega el SQL</li>
              <li>Haz clic en <strong>Execute</strong></li>
              <li>Vuelve aquí y haz clic en "Verificar"</li>
            </ol>
          </div>

          {/* SQL Editor */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-3">📝 SQL para ejecutar:</h2>
            <div className="bg-black p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
              <pre className="text-gray-300 text-sm font-mono">{sqlContent}</pre>
            </div>
            <button
              onClick={handleCopy}
              className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition"
            >
              📋 Copiar SQL
            </button>
          </div>

          {/* Verify Status */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-3">✅ Verificar Setup</h2>
            <p className="text-gray-400 text-sm mb-4">Después de ejecutar el SQL en Supabase, haz clic abajo para verificar:</p>
            <button
              onClick={handleVerify}
              disabled={status === 'checking'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              {status === 'checking' ? '⏳ Verificando...' : '🔍 Verificar Tablas'}
            </button>

            {message && (
              <p className={`mt-4 p-3 rounded-lg text-sm ${
                status === 'success'
                  ? 'bg-green-900/30 text-green-300'
                  : status === 'error'
                  ? 'bg-red-900/30 text-red-300'
                  : 'bg-blue-900/30 text-blue-300'
              }`}>
                {message}
              </p>
            )}
          </div>

          {/* Status */}
          {status === 'success' && (
            <div className="bg-green-900/30 border border-green-700 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-green-300 mb-2">🎉 ¡Listo!</h3>
              <p className="text-green-200">Las tablas están creadas. La plataforma está completamente funcional.</p>
              <p className="text-green-200 mt-2"><a href="/properties" className="text-yellow-400 hover:text-yellow-300 font-semibold">Ir a la plataforma →</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
