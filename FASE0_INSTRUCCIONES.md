# FASE 0.2 - INSTRUCCIONES DETALLADAS PARA HABILITAR RLS

## ⏱️ Tiempo estimado: 5 minutos

---

## 🎯 OBJETIVO
Ejecutar el SQL que habilita RLS (Row Level Security) en tu BD Supabase

---

## 📋 PASOS

### **PASO 1: Abre Supabase Dashboard**

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto **BELIVING**

---

### **PASO 2: Accede al SQL Editor**

1. En el menú izquierdo, haz click en **SQL Editor**
2. Haz click en **New Query**
3. Se abrirá un editor en blanco

---

### **PASO 3: Copia el SQL**

El archivo SQL ya está en tu proyecto en: `lib/enable-rls.sql`

**Copia TODO este SQL:**

```sql
-- Drop existing insecure policies (they used OR true)
DROP POLICY IF EXISTS "Public read" ON users;
DROP POLICY IF EXISTS "Users can access their own data" ON users;
DROP POLICY IF EXISTS "allow_all" ON users;
DROP POLICY IF EXISTS "allow_all" ON properties;
DROP POLICY IF EXISTS "allow_all" ON bookings;
DROP POLICY IF EXISTS "allow_all" ON conversations;
DROP POLICY IF EXISTS "allow_all" ON messages;
DROP POLICY IF EXISTS "allow_all" ON ratings;
DROP POLICY IF EXISTS "allow_all" ON magic_links;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- USERS TABLE
CREATE POLICY "users_view_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "public_host_profiles" ON users FOR SELECT USING (user_type = 'host');

-- PROPERTIES TABLE
CREATE POLICY "properties_public_read" ON properties FOR SELECT USING (true);
CREATE POLICY "properties_host_create" ON properties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "properties_host_modify" ON properties FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "properties_host_delete" ON properties FOR DELETE USING (auth.uid() = host_id);

-- BOOKINGS TABLE
CREATE POLICY "bookings_guest_read" ON bookings FOR SELECT USING (auth.uid() = guest_id);
CREATE POLICY "bookings_host_read" ON bookings FOR SELECT USING (auth.uid() = host_id);
CREATE POLICY "bookings_guest_create" ON bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);
CREATE POLICY "bookings_guest_update" ON bookings FOR UPDATE USING (auth.uid() = guest_id) WITH CHECK (auth.uid() = guest_id);
CREATE POLICY "bookings_host_update" ON bookings FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- CONVERSATIONS TABLE
CREATE POLICY "conversations_read" ON conversations FOR SELECT USING (auth.uid() IN (guest_id, host_id));
CREATE POLICY "conversations_create" ON conversations FOR INSERT WITH CHECK (true);

-- MESSAGES TABLE
CREATE POLICY "messages_read" ON messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE guest_id = auth.uid() OR host_id = auth.uid()));
CREATE POLICY "messages_create" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RATINGS TABLE
CREATE POLICY "ratings_public_read" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_guest_create" ON ratings FOR INSERT WITH CHECK (auth.uid() = guest_id);

-- MAGIC_LINKS TABLE
CREATE POLICY "magic_links_create" ON magic_links FOR INSERT WITH CHECK (true);
CREATE POLICY "magic_links_read" ON magic_links FOR SELECT USING (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

---

### **PASO 4: Pega en el Editor**

1. En el SQL Editor en blanco, haz **Ctrl+A** (select all)
2. Luego **Ctrl+V** (paste) el SQL anterior
3. O simplemente clic derecho > Paste

---

### **PASO 5: Ejecuta el SQL**

1. Haz click en el botón **RUN** (esquina superior derecha, botón azul)
2. Espera 5-10 segundos mientras se ejecuta

---

### **PASO 6: Verifica que funcionó**

Deberías ver en la consola:

```
Query executed successfully

(0 rows returned)
```

O en el área de "Results" debería no haber errores.

---

## ✅ VERIFICACIÓN

Para confirmar que RLS está habilitado correctamente:

1. En Supabase dashboard, ve a **Authentication > Policies**
2. Deberías ver ~15 policies nuevas creadas:
   - `users_view_own`
   - `properties_public_read`
   - `bookings_guest_read`
   - `conversations_read`
   - `messages_read`
   - etc.

---

## ⚠️ IMPORTANTE

Después de esto:
- Tu app va a tener problemas con login/signup
- Esto es NORMAL y lo arreglamos en FASE 1
- Por ahora, la BD está más segura

---

## 🔴 SI HAY ERRORES

**Error: "Policy already exists"**
→ Normal, significa que el SQL intentó crear una policy que ya existe. Ignora.

**Error: "Permission denied"**
→ Necesitas usar una API key con permisos admin. Verifica que estés usando la correcta.

**Error: "Table does not exist"**
→ La tabla no existe en tu BD. Verifica que tu schema está actualizado.

---

## ✨ CUANDO TERMINES

Escribe en el chat: **"✅ SQL ejecutado correctamente"**

Entonces continuaremos con:
- FASE 0.3: Sincronizar schemas
- FASE 0.4: Rate limiting
- FASE 0.5: Session expiry

---

## 💡 ALTERNATIVA: Via CLI (si tienes Supabase CLI)

```bash
supabase db push  # Actualiza BD
supabase db reset # Reset completo (DESTRUCTIVO!)
```

Pero recomendamos la versión manual (PASO 1-6) arriba.

---

**Tiempo estimado: 5 minutos ⏱️**

¡Adelante! 🚀
