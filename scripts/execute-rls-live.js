#!/usr/bin/env node

/**
 * Ejecuta el SQL de RLS directamente en Supabase via API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xgqiftublvrockxgzwzc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: SUPABASE_SERVICE_ROLE_KEY no definida\n');
  process.exit(1);
}

console.log('\n🔐 FASE 0.2 - Ejecutando RLS en Supabase\n');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

// Leer el SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log(`📝 SQL: ${sqlPath}`);
console.log(`📦 Tamaño: ${sqlContent.length} caracteres\n`);

// Función para ejecutar SQL completo
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);

    const body = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SERVICE_ROLE_KEY,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Ejecutar
(async () => {
  try {
    console.log(`${'═'.repeat(70)}`);
    console.log('🚀 Ejecutando SQL...\n');

    const result = await executeSql(sqlContent);

    if (result.success) {
      console.log(`✅ SQL ejecutado exitosamente (Status: ${result.status})\n`);
    } else {
      console.log(`⚠️  Estado: ${result.status}`);
      if (result.error) console.log(`Error: ${result.error}\n`);
    }

    console.log(`${'═'.repeat(70)}\n`);
    console.log('📊 Próximos pasos:');
    console.log('  1. Verifica en: https://app.supabase.com');
    console.log('  2. Authentication > Policies');
    console.log('  3. Deberías ver ~15 nuevas policies\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
})();
