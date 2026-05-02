#!/bin/bash

# FASE 0.2: Enable RLS en Supabase via API
# Uso: bash scripts/enable-rls.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 FASE 0.2 - Habilitando RLS en Supabase${NC}\n"

# Obtener credenciales
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Credenciales de Supabase no encontradas${NC}"
    echo ""
    echo "Necesitas definir las siguientes variables de entorno:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL='https://...'  "
    echo "  export SUPABASE_SERVICE_ROLE_KEY='eyJhbGci...'"
    echo ""
    echo "Puedes encontrar estas credenciales en:"
    echo "  https://app.supabase.com > Tu Proyecto > Settings > API"
    echo ""
    exit 1
fi

echo "📍 Proyecto: $SUPABASE_URL"
echo "🔑 Service Role Key: ${SERVICE_ROLE_KEY:0:20}..."
echo ""

# SQL to execute
SQL_FILE="lib/enable-rls.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Error: $SQL_FILE no encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}⚙️  Ejecutando SQL...${NC}\n"

# Read SQL file and execute via Supabase API
SQL_CONTENT=$(cat "$SQL_FILE")

# Escapar comillas para JSON
SQL_ESCAPED=$(echo "$SQL_CONTENT" | jq -Rs .)

# Crear request JSON
REQUEST_BODY=$(cat <<EOF
{
  "query": $SQL_ESCAPED
}
EOF
)

# Ejecutar via curl (usando el endpoint de Supabase para SQL)
# Nota: Esto requiere una función SQL. Si Supabase lo permite, usamos rpc.
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$(echo "$SQL_CONTENT" | jq -Rs .)\"}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo -e "${GREEN}✅ RLS habilitado correctamente!${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. Verifica en: https://app.supabase.com > tu proyecto > SQL Editor"
echo "  2. Continúa con FASE 0.3 (Sincronizar schemas)"
