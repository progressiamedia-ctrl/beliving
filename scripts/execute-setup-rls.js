#!/usr/bin/env node

/**
 * Crea y ejecuta función setup_rls() en Supabase
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

// Función para hacer requests HTTPS
async function makeRequest(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);

    const body = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/setup_rls',
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
        resolve({ status: res.statusCode, data });
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
    console.log('🚀 Ejecutando setup_rls()...\n');

    // Llamar la función RPC
    const result = await makeRequest('SELECT setup_rls()');

    if (result.status >= 200 && result.status < 300) {
      console.log(`✅ RLS configurado exitosamente\n`);
    } else {
      console.log(`⚠️  Estado: ${result.status}`);
      if (result.data) console.log(`Respuesta: ${result.data}\n`);
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
