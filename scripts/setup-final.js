const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];
const projectId = 'xgqiftublvrockxgzwzc';
const host = `${projectId}.db.supabase.co`;

console.log('🔧 Configurando base de datos Be Living...\n');

// Read SQL file
const sqlPath = path.join(__dirname, '..', 'lib', 'setup.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// Parse SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s.length > 10);

const client = new Client({
  user: 'postgres',
  password: password,
  host: host,
  port: 5432,
  database: 'postgres',
  ssl: 'require'
});

async function setup() {
  try {
    console.log(`📍 Conectando a: ${host}\n`);
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    console.log('⏳ Ejecutando SQL...\n');
    let executed = 0;
    let tables = ['users', 'properties', 'bookings', 'reviews', 'messages'];

    for (const statement of statements) {
      try {
        await client.query(statement);
        executed++;
      } catch (error) {
        // Ignore some warnings but continue
        if (!error.message.includes('already exists')) {
          console.log(`  ⚠️  ${error.message.split('\n')[0]}`);
        }
      }
    }

    console.log(`✅ ${executed} statements ejecutados\n`);

    // Verify tables
    console.log('✓ Verificando tablas creadas:');
    for (const table of tables) {
      const res = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      const exists = res.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\nLa plataforma está lista en: https://beliving-alpha.vercel.app');

    return true;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

setup().then(success => {
  process.exit(success ? 0 : 1);
});
