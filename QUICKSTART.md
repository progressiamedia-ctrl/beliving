# BELIVING - Quick Start Guide

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ (recomendado 20 LTS)
- npm o yarn
- Cuenta Supabase (configurada con RLS)
- Variables de entorno configuradas

---

## ⚙️ Setup Inicial

### 1. Clonar y instalar dependencias

```bash
cd beliving
npm install
```

### 2. Configurar variables de entorno

Crea `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

**Dónde obtenerlas:**
- Ve a tu proyecto Supabase
- Settings → API
- Copia `Project URL` y `anon public key`

### 3. Configurar RLS en Supabase

**Importante**: Las políticas de RLS deben estar en Supabase.

Opción A - Automático (si tienes acceso):
```bash
# El sistema lo hará automáticamente al conectar
```

Opción B - Manual:
1. Abre SQL Editor en Supabase Dashboard
2. Copia el contenido de `/lib/enable-rls.sql`
3. Ejecuta todas las políticas

### 4. Iniciar desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:3000`

---

## 📱 Testing la App

### Usuarios de Prueba

**Guest (Viajero):**
- Email: `guest@test.com`
- Tipo: guest

**Host (Anfitrión):**
- Email: `host@test.com`
- Tipo: host

### Flujos Principales

#### 1. **Registro / Login**
```
→ Click "Registrarse"
→ Selecciona rol (Viajero o Anfitrión)
→ Ingresa email y password
→ Acepta términos (en app)
→ Listo! Estás autenticado
```

#### 2. **Buscar Propiedades (Guest)**
```
→ /properties
→ Busca por título, ciudad o amenities
→ Filtra por precio, rating
→ Click en propiedad para ver detalles
→ Marca favoritas con ❤️
```

#### 3. **Reservar Propiedad (Guest)**
```
→ /properties/[id]
→ Selecciona fechas en calendario
→ Ingresa datos huésped
→ Confirma reserva
→ Ve a /guest/bookings para ver reservas
```

#### 4. **Crear Propiedad (Host)**
```
→ /host/properties/create
→ Completa formulario:
   - Título, descripción
   - Ubicación, ciudad
   - Precio/noche
   - Sube imágenes (drag & drop)
   - Selecciona comodidades
→ Crea propiedad
```

#### 5. **Mensajería**
```
→ Guest reserva → Se crea conversación
→ /messages - Ver todas las conversaciones
→ /messages/[id] - Chatear con contraparte
```

#### 6. **Reseñas**
```
→ Después de una reserva completada
→ /properties/[id] → Sección "Reseñas"
→ Escribe reseña (1-5 ⭐)
→ Aparece en el historial
```

---

## 🧪 Testing Features

### Testeo Manual Importante

Antes de pushear cambios:

```bash
# 1. Verifica build
npm run build

# 2. Verifica lint
npm run lint

# 3. Abre en browser
npm run dev

# 4. Prueba flows críticos:
   ✅ Registra nuevo usuario
   ✅ Login con ese usuario
   ✅ Busca propiedades
   ✅ Intenta reservar (sin pagar por ahora)
   ✅ Envía mensaje
   ✅ Crea propiedad (si host)
```

### Keyboard Navigation Testing

```
Tab        → Move between interactive elements
Shift+Tab  → Move backwards
Enter      → Activate buttons/links
Escape     → Close modals/menus
```

Todos los elementos deben ser alcanzables con teclado.

### Mobile Testing

```bash
# En browser DevTools:
Ctrl+Shift+M  # Toggle device toolbar
# Prueba en sizes: 375px (iPhone), 768px (Tablet), 1920px (Desktop)
```

---

## 🔑 Autenticación

### Magic Link Flow (Alternativa)

En desarrollo, puedes usar magic links en lugar de password:

```typescript
// En MagicLinkForm
const { sendMagicLink, verifyToken } = useMagicLink()

// 1. Envía link
await sendMagicLink('user@test.com')

// 2. Verifica token
await verifyToken(code, 'guest')
```

---

## 💾 Persistencia

### LocalStorage Keys

```javascript
// Después de login, se guardan:
localStorage.userId         // UUID del usuario
localStorage.userRole       // 'guest' o 'host'
localStorage.userEmail      // email@example.com
localStorage.sessionToken   // JWT token
localStorage.sessionExpiry  // timestamp (24h)

// Favoritos (PropertyGrid)
localStorage.favorites      // JSON array de IDs
```

**Nota**: La sesión expira automáticamente después de 24 horas.

---

## 📊 Base de Datos

### Tablas Principales

```sql
-- Usuarios
users (id, email, password_hash, user_type, created_at)

-- Propiedades
properties (id, host_id, title, price, city, images[], created_at)

-- Reservas
bookings (id, property_id, guest_id, host_id, check_in, check_out, total_price)

-- Conversaciones
conversations (id, booking_id, guest_id, host_id, property_id, created_at)

-- Mensajes
messages (id, conversation_id, sender_id, content, created_at)

-- Reseñas
ratings (id, property_id, guest_id, rating, comment, created_at)

-- Links Mágicos
magic_links (id, email, token, expires_at)
```

---

## 🐛 Debugging

### Ver Errores

```javascript
// En DevTools Console:
// Errores de API
window.localStorage.getItem('userId')  // Verifica sesión
fetch('/api/properties').then(r => r.json()).then(console.log)

// Errores de componentes
// Abre React DevTools para inspeccionar props/state
```

### Endpoints Útiles para Testing

```bash
# Listar propiedades
curl http://localhost:3000/api/properties

# Listar propiedades en Madrid
curl "http://localhost:3000/api/properties?city=Madrid"

# Crear usuario (POST)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","user_type":"guest"}'
```

---

## 📦 Build para Producción

```bash
# Build optimizado
npm run build

# Verificar que no hay errores
npm run lint

# Servir localmente
npm start
```

---

## 🚀 Deployar a Vercel

```bash
# 1. Push a GitHub
git add .
git commit -m "feat: complete FASE 1C and PHASE 3"
git push

# 2. Ve a Vercel.com
# 3. Conecta tu repo GitHub
# 4. Configura variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY

# 5. Deploy!
```

**O con CLI:**

```bash
npm i -g vercel
vercel login
vercel deploy
```

---

## 📝 Estructura de la Sesión

### ¿Qué se hizo en esta sesión?

1. **FASE 1C Completada**: 6 componentes React
   - PropertyForm, BookingForm, ChatComponent, PropertyGrid
   - MagicLinkForm, ConversationsList

2. **PHASE 3 Completada**: Accesibilidad WCAG 2.1 AA
   - Labels en inputs
   - ARIA roles en modales, buttons, menus
   - Keyboard navigation (Tab, Escape)
   - Focus management
   - Screen reader support

3. **Documentación Completa**:
   - FASE1C_COMPONENTS.md
   - PHASE3_ACCESSIBILITY.md
   - PROJECT_STATUS.md (este archivo)

### Archivos Principales

```
Componentes:
├── components/forms/PropertyForm.tsx
├── components/forms/BookingForm.tsx
├── components/forms/MagicLinkForm.tsx (NUEVO)
├── components/PropertyGrid.tsx
├── components/ChatComponent.tsx
└── components/ConversationsList.tsx (NUEVO)

Hooks:
├── lib/hooks/useProperties.ts
├── lib/hooks/useBookings.ts
├── lib/hooks/useMessages.ts
├── lib/hooks/useMagicLink.ts
├── lib/hooks/useUpload.ts
└── lib/hooks/useRatings.ts

Documentación:
├── FASE1C_COMPONENTS.md
├── PHASE3_ACCESSIBILITY.md
├── PROJECT_STATUS.md
└── QUICKSTART.md (este)
```

---

## ⚡ Performance Tips

### Optimizaciones Implementadas

- ✅ Next.js lazy loading en dynamic imports
- ✅ Optimistic updates (favoritos en localStorage)
- ✅ Polling (no WebSocket por ahora)
- ✅ Error boundaries (React error catching)

### Optimizaciones Futuras

- [ ] Replace polling con Supabase Realtime
- [ ] Image optimization (next/image)
- [ ] Code splitting automático
- [ ] Redis caching en API
- [ ] CDN para imágenes

---

## 🎓 Próximos Pasos de Aprendizaje

### Si quieres entender mejor el proyecto:

1. **Lee FASE1_ENDPOINTS.md** - Entiende la API
2. **Lee FASE1B_HOOKS.md** - Aprende los hooks
3. **Lee PHASE3_ACCESSIBILITY.md** - Entiende a11y
4. **Explora components/** - Ve cómo se usan los hooks
5. **Prueba en el browser** - Entiende los flows

### Si quieres contribuir:

1. Lee `/CLAUDE.md` para entender preferencias
2. Crea una rama feature
3. Sigue el PR review workflow
4. Pushea cambios y abre PR

---

## ❓ FAQ

**P: ¿Cómo reseteo mi sesión?**
```javascript
localStorage.clear()  // Limpia todo
// O específicamente:
localStorage.removeItem('userId')
localStorage.removeItem('sessionToken')
```

**P: ¿Las imágenes se suben dónde?**
R: A Supabase Storage, bucket `properties/` o `conversations/`

**P: ¿Cuánto dura una sesión?**
R: 24 horas. Después hace logout automático.

**P: ¿Puedo cambiar el tema a dark mode?**
R: El tema es automático según preferencia del SO. En componentes usa `dark:` classes.

**P: ¿Dónde agrego más comodidades?**
R: En `components/forms/PropertyForm.tsx`, array `amenitiesOptions`

---

## 📞 Soporte

Para reportar bugs o preguntas:

1. Revisa los `.md` en la raíz del proyecto
2. Lee los comentarios en el código
3. Abre un issue en GitHub con:
   - Qué intentaste hacer
   - Qué error viste
   - Pasos para reproducir

---

**¡Listo! Ya puedes empezar a desarrollar en BELIVING.** 🚀

Para ver todos los detalles, lee `/PROJECT_STATUS.md`
