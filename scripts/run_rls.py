#!/usr/bin/env python3

"""
Ejecuta RLS SQL en Supabase directamente
"""

import requests
import json
import os
from pathlib import Path

# Credenciales conocidas
SUPABASE_URL = "https://xgqiftublvrockxgzwzc.supabase.co"
SUPABASE_HOST = "xgqiftublvrockxgzwzc.supabase.co"

# Intentar obtener credenciales
SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
ANON_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

print("\n🔐 FASE 0.2 - Ejecutando RLS en Supabase\n")
print(f"📍 Proyecto: {SUPABASE_URL}")

# Leer SQL
sql_path = Path(__file__).parent.parent / "lib" / "enable-rls.sql"
with open(sql_path, 'r') as f:
    sql_content = f.read()

# Separar statements
statements = [
    s.strip() + ";"
    for s in sql_content.split(';')
    if s.strip() and not s.strip().startswith('--') and not s.strip().startswith('/*')
]

print(f"📝 SQL: {sql_path}")
print(f"📦 Size: {len(sql_content) / 1024:.2f} KB")
print(f"📋 Statements: {len(statements)}\n")

# Funciones para ejecutar SQL
def execute_via_rpc(sql, key):
    """Ejecuta via RPC endpoint"""
    headers = {
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
    }

    data = json.dumps({'query': sql})

    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            data=data,
            timeout=10
        )
        return response.status_code < 400
    except Exception as e:
        print(f"  ❌ Error: {str(e)[:50]}")
        return False

def execute_via_webhook(sql, key):
    """Ejecuta via GraphQL o custom function"""
    headers = {
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
    }

    # Intentar via GraphQL
    data = json.dumps({
        'query': f'mutation {{ executeSql(sql: "{sql}") {{ success }} }}'
    })

    try:
        response = requests.post(
            f"{SUPABASE_URL}/graphql/v1",
            headers=headers,
            data=data,
            timeout=10
        )
        return response.status_code < 400
    except:
        return False

# Ejecutar
if not SERVICE_ROLE_KEY and not ANON_KEY:
    print("⚠️  Sin credenciales de Supabase en variables de entorno\n")
    print("Para ejecutar automáticamente, necesito:")
    print("  export SUPABASE_SERVICE_ROLE_KEY='eyJhbGci...'\n")
    print("O para ejecución manual, usa el SQL de: lib/enable-rls.sql\n")
    exit(1)

print(f"🚀 Ejecutando {len(statements)} statements...\n")

key = SERVICE_ROLE_KEY or ANON_KEY
success_count = 0
error_count = 0

for i, statement in enumerate(statements, 1):
    preview = statement[:60].replace('\n', ' ') + ('...' if len(statement) > 60 else '')
    progress = f"[{i:2d}/{len(statements)}]"

    try:
        # Intentar RPC primero
        if execute_via_rpc(statement, key):
            print(f"  ✅ {progress} {preview}")
            success_count += 1
        else:
            # Luego webhook
            if execute_via_webhook(statement, key):
                print(f"  ✅ {progress} {preview}")
                success_count += 1
            else:
                print(f"  ⚠️  {progress} {preview}")
                error_count += 1
    except Exception as e:
        print(f"  ❌ {progress} Error: {str(e)[:30]}")
        error_count += 1

print(f"\n{'═'*70}")
print(f"✅ Completado: {success_count}/{len(statements)} statements")

if error_count > 0:
    print(f"⚠️  {error_count} errores (pueden ser normales)")

print(f"\n📊 Próximos pasos:")
print(f"  1. Verifica en: https://app.supabase.com > Authentication > Policies")
print(f"  2. Continúa con FASE 0.3 (Sincronizar schemas)\n")
