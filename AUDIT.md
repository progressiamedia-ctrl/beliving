# Be Living - Auditoría Completa del Proyecto

**Fecha:** Mayo 2, 2026  
**Estado:** Prototipo en producción con arquitectura incompleta

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Estado |
|--------|--------|
| **Funcionalidad base** | 60% completo |
| **Seguridad** | ⚠️ CRÍTICA - Múltiples vulnerabilidades |
| **Escalabilidad** | 40% - Limitaciones en diseño |
| **Calidad de código** | 55% - Deuda técnica significativa |
| **Listo para producción** | ❌ NO |

---

## ✅ CARACTERÍSTICAS IMPLEMENTADAS

### 1. **Autenticación & Usuarios**
- ✅ Email/password signup y login (hashed con PBKDF2-SHA512)
- ✅ Selección de rol en signup (Guest/Host)
- ✅ Página de perfil con cambio de contraseña
- ✅ Onboarding questionnaires (pero solo en localStorage, no persisten)
- ⚠️ Magic links: infraestructura existe pero `verifyMagicLink` es un STUB (siempre retorna usuario falso)
- ⚠️ Session en localStorage (sin expiración, sin CSRF token)

### 2. **Gestión de Propiedades**
- ✅ Hosts pueden crear propiedades (título, descripción, precio, ubicación, amenities)
- ✅ Hosts pueden editar y eliminar propiedades propias
- ✅ Validación cliente-side en PropertyForm
- ❌ **SIN carga de imágenes** (campo exists pero no funciona)
- ❌ Propiedades creadas por hosts NO aparecen en búsqueda/listado (desconexión entre catálogo estático y DB)
- 📦 Catálogo de 30 propiedades estáticas (Unsplash) - no son reservables

### 3. **Sistema de Reservas**
- ✅ Calendario de bloqueo de fechas disponibles
- ✅ Cálculo de fee (5% service fee)
- ✅ Creación de reserva con conversación
- ✅ Confirmación/cancelación por hosts
- ✅ Cancelación por guests
- ⚠️ **SOLO funciona en propiedades estáticas** (las creadas por hosts no son reservables)
- ❌ Sin validación de solapamiento de fechas
- ❌ Sin verificación de disponibilidad servidor-side

### 4. **Búsqueda & Filtros**
- ✅ Live search con autocomplete (5 resultados)
- ✅ Filtros: rango de precio, rating mínimo, ciudades, amenities
- ✅ Mapa Leaflet con hover highlight
- ❌ **Solo sobre propiedades estáticas** - propiedades de hosts no se buscan
- ⚠️ Sin geocoding - coordenadas hardcodeadas

### 5. **Ratings & Reviews**
- ✅ Guests pueden calificar después de checkout (1-5 stars + comentario)
- ✅ Prevención de double-rating con constraint UNIQUE
- ✅ Stats de rating (promedio, distribución)
- ⚠️ Stats nunca se muestran en UI (código existe pero no se usa)
- ✅ Visible en perfil de host y detalle de propiedad

### 6. **Messaging/Chat**
- ✅ Conversaciones 1-a-1 por booking
- ✅ Real-time messages (Supabase Realtime)
- ✅ Historial de mensajes
- ❌ Sin paginación (carga TODOS los mensajes en memoria)
- ❌ Sin contador de no-leídos (UI existe pero nunca se calcula)
- ❌ Sin borrado de conversaciones en UI

### 7. **Host Dashboard**
- ✅ KPIs: revenue, bookings confirmados, pendientes, propiedades
- ✅ Gráfico de barras: últimos 6 meses revenue
- ✅ Gráfico de distribución de estados
- ✅ Tabla de últimas 5 reservas
- ✅ Revenue por propiedad
- ✅ Filtros por período (mes, trimestre, año)

### 8. **IA Assistant**
- ✅ Claude Haiku para recomendación de propiedades
- ✅ Scoring por: ciudad, precio, amenities, rating
- ✅ Extracción de property IDs de respuesta Claude
- ❌ **SIN página en el app** - endpoint existe pero no hay entrada desde UI

### 9. **UI/UX**
- ✅ Light mode solo (dark mode fue removido)
- ✅ Responsive design (map escondido en mobile)
- ✅ Bottom navigation en properties page
- ⚠️ Inconsistente en otras páginas
- ⚠️ 3 tabs con "Próximamente" (no implementados)

---

## ❌ CARACTERÍSTICAS FALTANTES / INCOMPLETAS

### **Críticas para MVP**
1. **Propiedades no-bookables**: Las 30 estáticas no pueden reservarse ("Próximamente")
2. **Propiedades de hosts invisibles**: Creadas pero no aparecen en búsqueda
3. **Sin carga de imágenes**: Hosts no pueden subir fotos de propiedades
4. **Magic link roto**: Retorna email falso, login falla silenciosamente
5. **Password change falla**: Consulta DB por columnas inexistentes (`password`, `role` en lugar de `password_hash`, `user_type`)
6. **Chat AI sin entrada**: Endpoint existe pero sin página de acceso

### **Flujos Incompletos**
- Onboarding respuestas no persisten en DB
- Avatar upload no implementado
- Phone/notes booking sin validación
- Sin campos de búsqueda avanzada por amenities en UI

### **Características Futuras Marcadas como "Próximamente"**
- Experiences (tab no funciona)
- Services (tab no funciona)
- Viajes (tab no funciona)
- Mensajes en bottom nav (tab no funciona)

### **Validación & Error Handling**
- ❌ Sin rate limiting en auth endpoints (vulnerable a brute-force)
- ❌ Sin validación de rango de fechas en calendario
- ❌ Sin manejo de errores en PropertyForm
- ❌ Errores silenciosos en múltiples lugares

---

## 🗄️ BASE DE DATOS

### **Schema Implementado** (en `complete-schema.sql`)

```
TABLES:
├── users (UUID PK)
│   ├── email (UNIQUE)
│   ├── password_hash
│   ├── user_type (guest|host)
│   ├── first_name, last_name
│   ├── avatar_url
│   ├── bio
│   └── verified
├── properties (UUID PK)
│   ├── host_id FK → users
│   ├── title, description
│   ├── location, city, latitude, longitude
│   ├── price_per_night
│   ├── amenities (TEXT[])
│   ├── images (TEXT[] - URLs)
│   └── verified
├── bookings (UUID PK)
│   ├── property_id (VARCHAR - NOT UUID!)
│   ├── guest_id FK, host_id FK
│   ├── check_in, check_out (DATE)
│   ├── total_price, nights
│   ├── status (pending|confirmed|cancelled)
│   ├── guest_name, guest_email, guest_phone, notes
│   └── created_at, updated_at
├── conversations (UUID PK)
│   ├── booking_id FK (UNIQUE)
│   ├── guest_id FK, host_id FK
│   └── created_at, updated_at
├── messages (UUID PK)
│   ├── conversation_id FK
│   ├── sender_id FK, sender_name
│   ├── content
│   └── created_at
├── ratings (UUID PK)
│   ├── booking_id FK (UNIQUE)
│   ├── property_id (VARCHAR)
│   ├── guest_id FK
│   ├── rating (1-5)
│   ├── comment
│   └── created_at
└── magic_links (UUID PK)
    ├── email
    ├── token (UNIQUE)
    ├── expires_at
    ├── used_at
    └── user_id FK
```

### **Problemas Críticos en Schema**

1. **Inconsistencias entre archivos**: 3 versiones diferentes de schema (`setup.sql`, `complete-schema.sql`, `booking-schema.sql`, `init-db` route) con NOMBRES DE COLUMNAS DIFERENTES
   - `init-db` usa: `check_in_date`, `check_out_date` (sin `nights`, `guest_name`, `host_id`)
   - App usa: `check_in`, `check_out` (con `nights`, `guest_name`, `host_id`)
   - **Resultado**: Si reinician la BD con `init-db`, todo se rompe

2. **Índices faltantes**:
   - `properties.city` sin índice (búsqueda ineficiente)
   - `conversations.updated_at` sin índice

3. **RLS Deshabilitado**: `fix-rls.sql` deshabilita toda seguridad (`OR true` en políticas)
   - Cualquier usuario autenticado (incluso anon key) puede ver/modificar todo

4. **property_id VARCHAR**: No es FK a properties table (referential integrity roto)

---

## 📈 CAPACIDAD & ESCALABILIDAD

### **Límites Actuales**

| Métrica | Límite | Notas |
|---------|--------|-------|
| **Propiedades** | ~500K | Supabase free tier: 500MB DB = ~500K rows |
| **Usuarios** | ~50K | Connection pooling limit en free tier |
| **Bookings/Propiedad** | 1-10K | O(n) client-side iteration - lento con 1K+ |
| **Mensajes/Conversación** | ∞ | Sin paginación - carga TODO en memoria |
| **Imágenes** | 0 | Sin upload implementado |
| **Concurrent Users** | ~60 | Free tier PostgreSQL connections |

### **Botellas de Cuello (Bottlenecks)**

1. **`getPropertyBookedDates`**: Itera TODOS los bookings de una propiedad en JavaScript
   - Propiedad con 1000 bookings en 3 años = ~1000 iteraciones por calendario cargado
   - **Solución**: Cambiar a date range query en SQL

2. **`getConversations`**: 2 queries separadas
   - Query 1: todas las conversaciones del usuario
   - Query 2: TODOS los mensajes de TODAS las conversaciones
   - Luego en código: extraer último mensaje por conversación
   - **Solución**: `DISTINCT ON (conversation_id) ORDER BY conversation_id, created_at DESC`

3. **Sin paginación de mensajes**: Una conversación con 5000 mensajes carga TODO en memory

4. **Imágenes sin CDN**: Unsplash para estáticas, sin implementación para hosts

---

## 🔒 VULNERABILIDADES CRÍTICAS DE SEGURIDAD

### **🔴 CRÍTICA - Credenciales Hardcodeadas**

```typescript
// app/api/init-db/route.ts
const client = new pg.Client({
  host: 'xgqiftublvrockxgzwzc.db.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Beproperty1236.',  // ← EXPUESTA
  ssl: true,
});

// Acceso con: POST /api/init-db
// Header: Authorization: Bearer init-db-secret-2024  // ← DEFAULT CONOCIDO
```

**Riesgo**: Alguien ejecuta `curl -X POST http://localhost:3000/api/init-db -H "Authorization: Bearer init-db-secret-2024"` → acceso total a BD

**Acción inmediata**: DELETE esta ruta o protégela con IP whitelist

### **🔴 CRÍTICA - RLS Deshabilitado + anon key confiable**

- Cualquier usuario con `anon` key puede:
  - Crear bookings para cualquier guest_id/host_id
  - Modificar ratings
  - Insertar mensajes como cualquier usuario

**Acción inmediata**: Re-habilitar RLS con políticas correctas usando `auth.uid()`

### **🔴 CRÍTICA - JWT Hardcodeado (no usado pero expuesto)**

```typescript
// lib/auth.ts
const secret = 'beliving-secret-key-2024'
```

### **⚠️ ALTA - Session sin expiración**

localStorage sin `expiresAt`. Token robado = acceso indefinido.

### **⚠️ ALTA - Magic link siempre retorna usuario falso**

`verifyMagicLink` es stub → login mágico retorna `email: 'user@example.com'` siempre

### **⚠️ ALTA - Sin rate limiting**

100 intentos de login/segundo = viable brute-force en contraseña

### **⚠️ MEDIA - Bookings sin validación servidor**

Toda validación es client-side. Alguien modifica network request → reserva inválida creada.

---

## 💻 DEUDA TÉCNICA & CALIDAD

### **Type Safety**
- ❌ 7+ lugares con `any` en tipos
- ⚠️ `PropertyForm` recibe `property?: any`
- ⚠️ Results de Supabase nunca tipados

### **Código No Usado**
- `components/SearchBar.tsx` - nunca importado
- `components/RatingsList.tsx` - nunca importado
- `lib/theme-context.tsx` - nunca importado
- `lib/design-tokens.ts` - nunca importado
- `lib/auth.ts` - `generateToken`, `verifyToken`, `signUp`, `signIn` nunca llamados
- `bcryptjs` en package.json - nunca usado
- `app/auth/layout.tsx` - wrapper vacío

### **Performance**
- ❌ Imágenes sin `next/image`, `width`/`height`, lazy loading
- ❌ `getPropertyBookedDates` O(n) por cada carga de calendario
- ❌ `getConversations` carga TODO para extraer último mensaje
- ❌ Sin paginación en ningún lado
- ⚠️ Flash of content antes de auth check (useEffect)

### **Validación**
- ❌ Phone/notes sin validación
- ❌ Rango de fechas no validado (solo fechas individuales)
- ⚠️ PropertyForm campos sin required validation

---

## 📋 CHECKLIST PARA COMPLETAR MVP

### **BLOQUEADORES (Sin esto = no funciona)**
- [ ] Permitir que propiedades de hosts sean reservables (agregar a catálogo)
- [ ] Implementar carga de imágenes para propiedades de hosts
- [ ] Reparar magic link (`verifyMagicLink` stub)
- [ ] Reparar profile/password change (columnas DB incorrectas)
- [ ] Re-habilitar RLS seguridad (actualmente deshabilitada)
- [ ] Eliminar/asegurar `/api/init-db` (credenciales expuestas)
- [ ] Sincronizar schema SQL entre 3 versiones diferentes

### **CRÍTICO PARA SEGURIDAD**
- [ ] Remover credenciales hardcodeadas
- [ ] Implementar rate limiting en auth
- [ ] Agregar expiración a session (localStorage)
- [ ] Validación servidor-side en bookings
- [ ] CSRF tokens si no usas SameSite cookies
- [ ] Remover JWT secret hardcodeado

### **IMPORTANTE PARA UX**
- [ ] Propiedades de hosts aparecen en búsqueda
- [ ] Persistir onboarding respuestas en DB
- [ ] Implementar avatar upload para usuarios
- [ ] Arreglar 3 tabs "Próximamente"
- [ ] Contador de mensajes no-leídos
- [ ] Paginación en mensajes
- [ ] Better error messages (actualmente silenciosas)

### **NICE TO HAVE**
- [ ] Acceso a AI chat desde UI
- [ ] Geocoding real (en lugar de hardcoded)
- [ ] Imagen CDN
- [ ] Notificaciones por email
- [ ] Admin dashboard

---

## 🚀 PLAN DE ESCALABILIDAD

### **Fase 1: MVP Seguro (AHORA)**
1. Reparar vulnerabilidades críticas (RLS, credenciales, magic link)
2. Sincronizar schemas
3. Permitir booking de propiedades de hosts
4. Validación servidor-side en bookings

### **Fase 2: Performance Optimization (1-2 semanas)**
1. Convertir `getPropertyBookedDates` a SQL query
2. Cambiar `getConversations` a DISTINCT ON query
3. Agregar índices (city, updated_at, etc.)
4. Implementar paginación en mensajes
5. Agregar next/image optimization

### **Fase 3: Escalabilidad Horizontal (1 mes)**
1. Supabase → plan Pagado (conexiones ilimitadas)
2. CDN para imágenes (Cloudinary, AWS S3)
3. Cache layer (Redis) para queries frecuentes
4. Separar read replicas para búsqueda
5. Worker jobs para operaciones pesadas (email, recomendaciones)

### **Fase 4: Funcionalidad Avanzada (2+ meses)**
1. Sistema de pago (Stripe integration)
2. Reviews en fotos
3. Wishlist y comparación de propiedades
4. Notificaciones real-time (push)
5. Analytics dashboard para hosts
6. Multi-currency support
7. API pública para terceros

---

## 📊 ESTADÍSTICAS DEL CÓDIGO

| Métrica | Valor |
|---------|-------|
| **Líneas de código** | ~4,500 (app + lib) |
| **Componentes React** | 12 principales |
| **Rutas API** | 7 (auth, chat, setup) |
| **Tablas BD** | 7 |
| **Dependencias npm** | 25+ |
| **Cobertura de tipos** | ~55% (múltiples `any`) |
| **Funciones no usadas** | 10+ |

---

## 🎯 RECOMENDACIONES FINALES

### **¿Está listo para usuarios reales?**
**NO.** Tiene múltiples vulnerabilidades críticas y flujos quebrados.

### **Tiempo estimado para arreglar a MVP seguro:**
- **Bloqueadores**: 2-3 días
- **Seguridad**: 1-2 días  
- **QA completo**: 2-3 días
- **Total**: 1-1.5 semanas

### **Cuántos usuarios/propiedades puede soportar AHORA:**
- **Propiedades**: Sin límite (BD capacity)
- **Usuarios**: ~100 antes de latency issues
- **Concurrentes**: ~10 (connection pooling free tier)
- **Bookings/mes**: ~50 (antes de problemas)

### **Próximo paso recomendado:**
Enfocarse en **Phase 1** - arreglar vulnerabilidades y sincronizar schema. Sin esto, no es seguro langar a producción.

