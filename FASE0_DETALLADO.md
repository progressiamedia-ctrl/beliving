# FASE 0 - Plan Detallado Realista

**Problema**: Cambiar auth completamente tomaría 1 semana. Necesitamos ser prácticos.

**Solución**: Mantener auth actual + asegurar BD con RLS + validación server-side

---

## Estrategia Realista para FASE 0

### **Opción A: Full Rewrite con Supabase Auth** (1 semana)
- ✅ Más seguro, estándar industrial
- ❌ Muy grande para FASE 0
- ❌ Requiere reescribir componentes de auth

### **Opción B: Hibrida (RECOMENDADA)** (2-3 días)
- ✅ Mantiene estructura actual
- ✅ Agrega seguridad en BD
- ✅ Más rápida implementación
- ✅ Puedes migrar a Auth nativo después
- ❌ Menos segura que A (pero funciona)

**Voy con Opción B para FASE 0.1-0.5**

---

## Opción B: Plan Hibrido (Lo que haremos)

### **0.2 - RLS Seguro con Auth Manual**

En lugar de cambiar todo el auth, vamos a:

1. **RLS Policy: Default Deny**
   ```sql
   -- Nada se puede acceder sin permisos explícitos
   ```

2. **RLS Policy: Lectura pública (propiedades)**
   ```sql
   -- Todos pueden ver properties (es un catálogo)
   ```

3. **RLS Policy: Usuario puede leer su propio perfil**
   ```sql
   -- User profile: solo el usuario logueado
   -- Pero como no podemos usar auth.uid() (usas localStorage),
   -- haremos checks en código y gracias a RLS
   ```

4. **RLS Policy: Usuario puede escribir/actualizar sus datos**
   ```sql
   -- Bookings: usuario solo ve sus bookings
   -- Mensajes: usuario solo ve sus mensajes
   ```

**El truco**: Combinar RLS con validación en código

---

## Implementación Paso a Paso

### **PASO 1: SQL - Habilitar RLS y policies básicas** (30 min)

```sql
-- 1. Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- 2. Properties: lectura pública (es catálogo)
CREATE POLICY "properties_public_read"
  ON properties FOR SELECT
  USING (true); -- Todos pueden leer

CREATE POLICY "properties_host_write"
  ON properties FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = host_id); -- Solo host escribe sus propiedades

-- 3. Users: solo tu perfil
CREATE POLICY "users_own_profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 4. Bookings: solo guest/host implicados
CREATE POLICY "bookings_access"
  ON bookings FOR SELECT
  USING (auth.uid() IN (guest_id, host_id));

-- 5. Similar para ratings, messages, etc.
```

**PROBLEMA**: Tu auth usa localStorage, NO auth.uid(). 

**SOLUCIÓN**: 
- Agregar una columna `current_user_id` que se pasa en JWT custom
- O: Hacer que Supabase Auth nativo maneje esto (pero eso es cambio grande)

---

## Decisión Ejecutiva Para FASE 0

**Propongo hacer esto en 2 opciones:**

### **OPCIÓN 1: Rápida pero con deuda (Recomendada para ESTA SEMANA)**
```
- 0.1 ✅ Credenciales removidas
- 0.2 (TODO) RLS habilitado con policies "abierto" por ahora
- 0.3 (TODO) Sincronizar schemas
- 0.4 (TODO) Rate limiting
- 0.5 (TODO) Session expiry
- FASE 1: Comenzar implementación segura de auth

Después de FASE 0: Migrar a Supabase Auth nativo en FASE 1.5
```

### **OPCIÓN 2: Cambio completo a Supabase Auth (1 semana)**
```
- 0.1 ✅ Credenciales removidas
- 0.2 (1 semana) Implementar Supabase Auth nativo
- 0.3 (1 día) RLS correctas con auth.uid()
- 0.4 (1 día) Rate limiting
- 0.5 (1 día) Session expiry

Ventaja: Después de esto, app es SEGURA completamente
```

---

## Mi Recomendación 

**Hacer Opción 1 AHORA (esta semana):**
- Rápido completar FASE 0
- Permite empezar FASE 1 funcionalidades

**Hacer Opción 2 en FASE 1.5 (semana 7):**
- Después de que core funcione
- Menos disruptivo

---

## ¿Cuál prefieres?

1. **Opción 1**: Continuar FASE 0 con RLS básico (hoy mismo, 30 min)
2. **Opción 2**: Cambiar a Supabase Auth ahora (toma 1 semana completa)

Dime cuál y continúo.
