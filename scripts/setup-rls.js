#!/usr/bin/env node

/**
 * Setup RLS - Ejecuta SQL de RLS en Supabase
 *
 * Uso:
 *   npx ts-node scripts/setup-rls.js
 *
 * O si tienes las credenciales:
 *   SUPABASE_SERVICE_ROLE_KEY="..." node scripts/setup-rls.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
};

console.log('\n' + '═'.repeat(60));
console.log(`${colors.blue}🔐 FASE 0.2 - Habilitar RLS en Supabase${colors.reset}`);
console.log('═'.repeat(60) + '\n');

// Leer SQL
const sqlPath = path.join(__dirname, '..', 'lib', 'enable-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

log.info(`SQL cargado: ${sqlPath}`);
log.info(`Tamaño: ${sqlContent.length} caracteres`);

// Contar statements
const statementCount = sqlContent.split(';').filter(s => s.trim() && !s.trim().startsWith('--')).length;
log.info(`Total statements: ${statementCount}\n`);

// Mostrar instrucciones
console.log(`${colors.yellow}📋 INSTRUCCIONES:${colors.reset}\n`);
console.log('1. Ve a: https://app.supabase.com/projects');
console.log('2. Abre tu proyecto: BELIVING');
console.log('3. Click: SQL Editor → New Query');
console.log('4. Copia y pega TODO este SQL:\n');

console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}`);
console.log(sqlContent);
console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}\n`);

console.log('5. Click: RUN (botón azul)');
console.log('6. Espera a que termine\n');

log.success('Copia el SQL anterior y pégalo en Supabase Dashboard');
log.success('Luego escribe en el chat: "✅ SQL ejecutado"\n');

console.log('═'.repeat(60) + '\n');
