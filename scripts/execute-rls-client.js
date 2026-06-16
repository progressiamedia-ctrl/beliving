#!/usr/bin/env node

/**
 * Ejecuta RLS usando el cliente de Supabase
 */

const { createClient } = require('@supabase/supabase-js');
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

// Crear cliente con service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: {
    schema: 'public',
  },
});

// Leer SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log(`📝 SQL: ${sqlPath}`);
console.log(`📦 Tamaño: ${sqlContent.length} caracteres\n`);

// Dividir en statements
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

console.log(`📋 Total statements: ${statements.length}\n`);
console.log(`${'═'.repeat(70)}\n`);

// Ejecutar cada statement
(async () => {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 65).replace(/\n/g, ' ');
    const progress = `[${(i + 1).toString().padStart(2)}/${statements.length}]`;

    try {
      // Ejecutar el statement
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement
      });

      if (error) {
        console.log(`  ⚠️  ${progress} ${preview}...`);
        console.log(`       Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ ${progress} ${preview}...`);
        successCount++;
      }
    } catch (err) {
      console.log(`  ❌ ${progress} ${preview}...`);
      console.log(`       Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'═'.repeat(70)}\n`);
  console.log(`✅ Completado: ${successCount}/${statements.length} statements`);
  if (errorCount > 0) {
    console.log(`⚠️  Errores: ${errorCount}`);
  }
  console.log(`\n📊 Próximos pasos:`);
  console.log(`  1. Verifica en: https://app.supabase.com`);
  console.log(`  2. Authentication > Policies`);
  console.log(`  3. Deberías ver ~15 nuevas policies\n`);
})();
