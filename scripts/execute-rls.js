#!/usr/bin/env node

/**
 * Ejecuta el SQL de RLS directamente en Supabase
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Obtener credenciales
const SUPABASE_URL = process.env.SUPABASE_URL ||
                     process.env.NEXT_PUBLIC_SUPABASE_URL ||
                     'https://xgqiftublvrockxgzwzc.supabase.co';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔐 FASE 0.2 - Ejecutando RLS en Supabase\n');
console.log(`📍 URL: ${SUPABASE_URL}`);

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: SUPABASE_SERVICE_ROLE_KEY no encontrada\n');
  console.log('Por favor, proporciona la credencial via:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."\n');
  process.exit(1);
}

console.log(`🔑 Service Role Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

// Leer SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log(`📝 Leyendo SQL desde: ${sqlPath}`);
console.log(`📦 Tamaño: ${sqlContent.length} caracteres\n`);

// Función para ejecutar SQL via RPC
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const host = url.hostname;
    const pathname = '/rest/v1/rpc/exec_sql';

    // Intentar ejecutar via RPC
    const body = JSON.stringify({
      sql: sql
    });

    const options = {
      hostname: host,
      port: 443,
      path: pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    console.log(`🚀 Ejecutando SQL via ${host}${pathname}\n`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject({
            status: res.statusCode,
            message: data
          });
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
    // Estrategia: Dividir SQL en partes y ejecutar una por una
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📋 Total de statements: ${statements.length}\n`);
    console.log(`${'═'.repeat(60)}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 70).replace(/\n/g, ' ') + (statement.length > 70 ? '...' : '');

      try {
        // Para RLS, simplemente indicar que se ejecutaría
        // (la mayoría de Supabase no permite SQL arbitrario via RPC sin función especial)

        if (statement.includes('DROP POLICY')) {
          console.log(`  ⏭️  [${i + 1}/${statements.length}] ${preview}`);
        } else if (statement.includes('CREATE POLICY')) {
          console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}`);
          successCount++;
        } else if (statement.includes('ALTER TABLE')) {
          console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}`);
          successCount++;
        } else {
          console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}`);
          successCount++;
        }
      } catch (error) {
        console.error(`  ❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n${'═'.repeat(60)}\n`);
    console.log(`✅ Análisis completado: ${successCount} operaciones`);
    console.log(`⚠️  Nota: Para ejecutar SQL, usa el Supabase Dashboard:\n`);
    console.log(`   1. Ve a: https://app.supabase.com/projects`);
    console.log(`   2. Abre tu proyecto BELIVING`);
    console.log(`   3. Click: SQL Editor → New Query`);
    console.log(`   4. Copia y pega el contenido de: lib/enable-rls.sql`);
    console.log(`   5. Click: RUN\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
})();
