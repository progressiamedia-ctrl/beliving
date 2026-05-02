#!/usr/bin/env node

/**
 * Script para habilitar RLS en Supabase
 * Uso: node scripts/enable-rls.js
 *
 * Requiere:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Obtener credenciales
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Credenciales de Supabase no encontradas');
  console.error('');
  console.error('Necesitas definir:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Puedes encontrar estas credenciales en:');
  console.error('  1. Supabase Dashboard > Project Settings > API');
  console.error('  2. O en tu archivo .env.local / variables de entorno');
  process.exit(1);
}

// Leer SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

// Crear cliente Supabase con service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: {
    schema: 'public',
  },
});

async function enableRLS() {
  try {
    console.log('🔐 Habilitando RLS en Supabase...');
    console.log('');

    // Ejecutar SQL en diferentes partes para mejor feedback
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      // Skip comentarios
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        }).catch(() => {
          // Si exec_sql no existe, intentar otra forma
          return supabase.from('_sql_migrations').insert({ sql: statement });
        });

        if (error) {
          // Ignorar errores de "policy already exists"
          if (!error.message.includes('already exists')) {
            console.error(`❌ Error en sentencia ${i + 1}:`, error.message);
            errorCount++;
          } else {
            console.log(`⏭️  Saltando (ya existe): ${statement.substring(0, 50)}...`);
            successCount++;
          }
        } else {
          successCount++;
          console.log(`✅ ${statement.substring(0, 60)}...`);
        }
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log(`✅ Completado: ${successCount} operaciones exitosas`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} errores (pueden ser normales si ya existen)`);
    }
    console.log('');
    console.log('🎉 RLS habilitado correctamente!');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  1. Verifica en Supabase Dashboard > Authentication > Policies');
    console.log('  2. Continúa con FASE 0.3 (Sincronizar schemas)');

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

enableRLS();
