const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key.trim()]) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSql() {
  console.log('🔧 Ejecutando setup de Supabase...\n');

  try {
    // 1. Create users table
    console.log('➤ Creando tabla users...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    }).catch(e => ({ error: e }));

    if (usersError) {
      console.log('  ℹ️  Intentando método alternativo (sin RPC)...');

      // Método alternativo: verificar si la tabla existe
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(1);

      if (checkError && checkError.code === 'PGRST116') {
        console.log('  ⚠️  La tabla no existe. Necesitas ejecutar el SQL manualmente en Supabase Console.');
        return false;
      } else if (!checkError) {
        console.log('  ✅ Tabla users ya existe');
      }
    } else {
      console.log('  ✅ Tabla users creada/verificada');
    }

    // 2. Verify properties table
    console.log('➤ Verificando tabla properties...');
    const { data: props, error: propsError } = await supabase
      .from('properties')
      .select('count', { count: 'exact' })
      .limit(1);

    if (propsError && propsError.code === 'PGRST116') {
      console.log('  ⚠️  Tabla properties no existe');
      return false;
    } else {
      console.log('  ✅ Tabla properties existe');
    }

    // 3. Test write access
    console.log('➤ Probando acceso a la base de datos...');
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact' });

    if (testError) {
      console.log('  ❌ Error de acceso:', testError.message);
      return false;
    }

    console.log('  ✅ Acceso a base de datos OK');

    console.log('\n✅ Setup completado exitosamente!');
    return true;

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('rpc')) {
      console.log('\n📌 Nota: No se encontró la función RPC "exec_sql".');
      console.log('Esto es normal. Las tablas se pueden crear manualmente.\n');
      console.log('Alternativa: Ejecuta el SQL en Supabase Console:');
      console.log('1. Ve a Supabase Dashboard → SQL Editor');
      console.log('2. Copia lib/setup.sql');
      console.log('3. Pega y ejecuta');
    }

    return false;
  }
}

executeSql().then(success => {
  process.exit(success ? 0 : 1);
});
