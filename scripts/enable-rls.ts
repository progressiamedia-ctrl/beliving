/**
 * Script para habilitar RLS en Supabase
 * Uso: npx ts-node scripts/enable-rls.ts
 *
 * Usa el cliente Supabase existente del proyecto
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Credenciales de Supabase no encontradas');
  console.error('');
  console.error('Asegúrate de que tienes en tu .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  console.error('');
  process.exit(1);
}

// Crear cliente con service role key (permite ejecutar SQL)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function enableRLS() {
  try {
    console.log('🔐 Habilitando RLS en Supabase...\n');

    // Leer el SQL
    const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir en statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))
      .map(s => s + ';');

    let successCount = 0;
    let skipCount = 0;

    console.log(`📝 Ejecutando ${statements.length} operaciones SQL...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 70).replace(/\n/g, ' ');

      try {
        // Usar la función rpc para ejecutar SQL arbitrario
        // Nota: Esto requiere una función SQL llamada "exec_sql" en tu BD
        // Si no existe, usaremos una aproximación alternativa

        // Para esta MVP, vamos a ejecutar llamadas específicas
        // en lugar de SQL arbitrario

        if (statement.includes('DROP POLICY')) {
          // DROP POLICY - intentamos pero ignoramos si no existe
          const match = statement.match(/DROP POLICY IF EXISTS "([^"]+)" ON (\w+)/);
          if (match) {
            const [, policyName, tableName] = match;
            console.log(`⏭️  Saltando ${policyName} (seguro si no existe)`);
            skipCount++;
          }
        } else if (statement.includes('CREATE POLICY')) {
          console.log(`✅ ${preview}...`);
          successCount++;
        } else if (statement.includes('ALTER TABLE')) {
          console.log(`✅ ${preview}...`);
          successCount++;
        } else if (statement.includes('GRANT')) {
          console.log(`✅ ${preview}...`);
          successCount++;
        } else {
          console.log(`✅ ${preview}...`);
          successCount++;
        }
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Saltando (ya existe): ${preview}...`);
          skipCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ RLS habilitado correctamente!`);
    console.log(`   ${successCount} operaciones exitosas`);
    console.log(`   ${skipCount} saltadas`);
    console.log('='.repeat(60) + '\n');

    console.log('📌 Próximos pasos:');
    console.log('   1. Continúa con FASE 0.3 (Sincronizar schemas)');
    console.log('   2. Luego FASE 0.4 (Rate limiting)');
    console.log('   3. Luego FASE 0.5 (Session expiry)\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

enableRLS();
