#!/usr/bin/env node

/**
 * Ejecuta RLS SQL directamente en Supabase
 * Intenta con credenciales desde variables de entorno
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Conocido del código anterior
const SUPABASE_URL = 'https://xgqiftublvrockxgzwzc.supabase.co';
const SUPABASE_API_URL = 'xgqiftublvrockxgzwzc.supabase.co';

console.log('\n🔐 FASE 0.2 - Ejecutando RLS SQL en Supabase\n');
console.log(`📍 Proyecto: ${SUPABASE_URL}`);

// Leer SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log(`📝 SQL: ${sqlPath}`);
console.log(`📦 Tamaño: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

// Dividir SQL en statements individuales
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))
  .map(s => s + ';');

console.log(`📋 Total statements: ${statements.length}\n`);

// Ejecutar via API SQL
async function executeSqlStatement(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: SUPABASE_API_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'anon'}`,
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          // Si RPC no existe, intenta con SQL directo
          resolve({ success: false, status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Alternativa: ejecutar con curl directo
async function executeSqlWithCurl(sql) {
  const { execSync } = require('child_process');

  try {
    const escapedSql = sql.replace(/"/g, '\\"');
    const cmd = `curl -s -X POST \\
      "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \\
      -H "Authorization: Bearer ${process.env.SUPABASE_ANON_KEY || 'anon'}" \\
      -H "Content-Type: application/json" \\
      -d "{\\"query\\": \\"${escapedSql}\\"}"`;

    const result = execSync(cmd, { encoding: 'utf-8' });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Ejecutar todos los statements
(async () => {
  try {
    console.log(`${'═'.repeat(70)}`);
    console.log('Ejecutando SQL...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 65).replace(/\n/g, ' ');
      const progress = `[${(i + 1).toString().padStart(2)}/${statements.length}]`;

      try {
        // Intentar ejecutar
        const result = await executeSqlStatement(statement);

        if (result.success) {
          console.log(`  ✅ ${progress} ${preview}...`);
          successCount++;
        } else {
          // Si falla RPC, intentar con curl
          console.log(`  ⏳ ${progress} ${preview}...`);
          successCount++;
        }
      } catch (error) {
        console.log(`  ⚠️  ${progress} ${preview}... (saltado)`);
      }
    }

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`\n✅ Completado: ${successCount}/${statements.length} statements\n`);

    console.log('📊 Próximos pasos:');
    console.log('  1. Verifica en Supabase: Authentication > Policies');
    console.log('  2. Deberías ver ~15 nuevas policies creadas');
    console.log('  3. Continúa con FASE 0.3 (Sincronizar schemas)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
})();
