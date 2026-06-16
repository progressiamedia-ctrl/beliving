#!/usr/bin/env node

/**
 * Ejecuta RLS conectando directamente a PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const host = 'xgqiftublvrockxgzwzc.db.supabase.co';
const user = 'postgres';
const password = 'Beproperty1236.';

console.log('\n🔐 FASE 0.2 - Ejecutando RLS en Supabase (via PostgreSQL)\n');
console.log(`📍 Host: ${host}`);
console.log(`👤 User: ${user}\n`);

// Leer SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log(`📝 SQL: ${sqlPath}`);
console.log(`📦 Tamaño: ${sqlContent.length} caracteres\n`);

// Crear cliente PostgreSQL
const client = new Client({
  user: user,
  password: password,
  host: host,
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Ejecutar
(async () => {
  try {
    console.log('⏳ Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Dividir en statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📋 Total statements: ${statements.length}\n`);
    console.log(`${'═'.repeat(70)}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 65).replace(/\n/g, ' ');
      const progress = `[${(i + 1).toString().padStart(2)}/${statements.length}]`;

      try {
        await client.query(statement);
        console.log(`  ✅ ${progress} ${preview}...`);
        successCount++;
      } catch (error) {
        // Algunos errores son normales (política ya existe)
        if (error.message.includes('already exists')) {
          console.log(`  ⏭️  ${progress} ${preview}... (ya existe)`);
        } else {
          console.log(`  ⚠️  ${progress} ${preview}...`);
          console.log(`      Error: ${error.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }

    console.log(`\n${'═'.repeat(70)}\n`);
    console.log(`✅ Completado: ${successCount}/${statements.length} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Errores: ${errorCount} (algunos son normales)\n`);
    }

    console.log(`📊 Próximos pasos:`);
    console.log(`  1. Verifica en: https://app.supabase.com`);
    console.log(`  2. Authentication > Policies`);
    console.log(`  3. Deberías ver ~15 nuevas policies\n`);

  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${error.message}\n`);

    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  No se pudo conectar a Supabase desde esta red.');
      console.log('   Esto puede ser un problema de DNS o firewall.\n');
    }

    process.exit(1);

  } finally {
    await client.end();
  }
})();
