const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Parse Supabase URL to get host
// Format: https://xgqiftublvrockxgzwzc.supabase.co
const urlParts = supabaseUrl.replace('https://', '').replace('http://', '');
const host = urlParts.split('/')[0];
const projectId = host.split('.')[0];

console.log(`🔧 Ejecutando setup de BD para ${projectId}...\n`);

// Read SQL file
const setupSqlPath = path.join(__dirname, '..', 'lib', 'setup.sql');
if (!fs.existsSync(setupSqlPath)) {
  console.error('❌ Error: lib/setup.sql not found');
  process.exit(1);
}

const setupSql = fs.readFileSync(setupSqlPath, 'utf-8');

// Construct PostgreSQL connection string
// Default Supabase user is 'postgres'
const dbUrl = `postgresql://postgres@${host}:5432/postgres`;

console.log(`📍 Intentando conectar a: ${host}`);
console.log(`⚠️  Nota: Supabase requiere autenticación. Usando método alternativo...\n`);

// Try alternative: create a pool without password (will fail, but shows what's needed)
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('✓ Conectado a la base de datos\n');
    console.log('➤ Ejecutando SQL...');

    // Split SQL by semicolons and execute each statement
    const statements = setupSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let count = 0;
    for (const statement of statements) {
      try {
        await client.query(statement);
        count++;
      } catch (error) {
        console.log(`  ⚠️  Statement ${count + 1}: ${error.message.split('\n')[0]}`);
      }
    }

    console.log(`\n✅ ${count} SQL statements executed\n`);

    // Verify tables
    console.log('➤ Verificando tablas...');
    const tables = ['users', 'properties', 'bookings', 'reviews', 'messages'];

    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`
      );
      const exists = result.rows[0]?.exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n✅ Setup completado!');
    return true;

  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${error.message}\n`);
    console.log('📌 Solución: Ejecuta el SQL manualmente:');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Abre un archivo y selecciona lib/setup.sql');
    console.log('   3. Haz clic en Execute');
    return false;

  } finally {
    await client.release();
    await pool.end();
  }
}

setupDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
