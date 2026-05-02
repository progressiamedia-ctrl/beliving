# Be Living - Roadmap Priorizado & Plan de Escalabilidad a 100K Usuarios

**Objetivo Final**: Plataforma lista para producción, escalable a 100,000 usuarios (guests) simultáneos  
**Estimación Total**: 6-8 semanas  
**Costo Infraestructura**: $500-2000/mes en Supabase + CDN + aplicación

---

## 🎯 FASES PRIORIZADAS (Orden de Ejecución)

### **FASE 0: CRÍTICA - Fix Vulnerabilidades (1 Semana) ⚠️ HACER PRIMERO**

Sin esto, no puedes tener usuarios reales. **Es el bloqueador #1.**

#### **0.1 - Remover/Asegurar Credenciales Expuestas (1 día)**

**Problema**: `app/api/init-db/route.ts` expone credenciales BD

**Tareas**:
- [ ] Eliminar completamente `/app/api/init-db/route.ts` (3 min)
- [ ] Eliminar `/app/api/setup/route.ts` también (1 min)
- [ ] Remover JWT secret hardcodeado de `lib/auth.ts` (5 min)
- [ ] Crear script SQL para setup manual (solo para dev) (30 min)
- [ ] Documentar cómo re-crear BD desde SQL si es necesario (30 min)
- [ ] Rotar Supabase API keys/secrets (genera nuevas en Supabase dashboard) (10 min)
- [ ] Commit & deploy (5 min)

**Después**: Solo tú puedes ejecutar operaciones de BD (vía Supabase dashboard)

---

#### **0.2 - Re-habilitar RLS (Row Level Security) (2 días)**

**Problema**: Cualquiera puede ver/modificar todo

**Tareas**:
- [ ] Cambiar autenticación de localStorage a Supabase Auth (crítico)
  - Usar `@supabase/auth-js`
  - Reemplazar `localStorage.userId` con `session.user.id`
  - Esto permite que RLS use `auth.uid()` nativo de Supabase

- [ ] Implementar políticas RLS correctas:
  ```sql
  -- Users table: cada user solo ve su propio perfil
  CREATE POLICY "Users can see own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);
  
  -- Properties: public read, solo host puede escribir
  CREATE POLICY "Properties are public read"
  ON properties FOR SELECT
  USING (true);
  
  CREATE POLICY "Only host can write own properties"
  ON properties FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = host_id);
  
  -- Bookings: guest ve sus reservas, host ve sus reservas
  CREATE POLICY "Users see own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = host_id);
  
  -- Similar para ratings, messages, etc.
  ```

- [ ] Hacer que Supabase Auth de verdad funcione (30 líneas de código)
- [ ] Re-habilitar todas las políticas RLS en `fix-rls.sql`
- [ ] Test: intenta modificar booking de otro usuario → debe fallar
- [ ] Commit & deploy

**Después**: Acceso a datos asegurado en nivel BD

---

#### **0.3 - Sincronizar Schemas SQL (1 día)**

**Problema**: 3 versiones diferentes de schema

**Tareas**:
- [ ] Comparar `setup.sql` vs `complete-schema.sql` vs `booking-schema.sql` vs `/api/init-db` route
- [ ] Decidir CUÁL es la única fuente de verdad (usa `complete-schema.sql`)
- [ ] Actualizar `complete-schema.sql` para que coincida con lo que el código espera:
  - `check_in`, `check_out` (no `check_in_date`, `check_out_date`)
  - `nights`, `guest_name`, `guest_email`, `host_id` en bookings
  - Todos los indexes (city, updated_at, etc.)
  
- [ ] Documentar schema en README con diagrama ER
- [ ] Eliminar los otros 2 archivos de schema
- [ ] Commit

**Después**: Única fuente de verdad para BD

---

#### **0.4 - Rate Limiting en Auth (1 día)**

**Problema**: Brute-force attacks posibles

**Tareas**:
- [ ] Instalar `express-rate-limit` (npm install)
- [ ] Aplicar a `/api/auth/signin` y `/api/auth/signup`:
  ```typescript
  // 5 intentos por 15 minutos por IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de inicio de sesión'
  });
  
  app.post('/api/auth/signin', limiter, handler)
  ```
- [ ] Test: hacer 6 requests rápidamente → 6to rechazado
- [ ] Commit & deploy

**Después**: Imposible brute-force contraseñas

---

#### **0.5 - Session Expiry (1 día)**

**Problema**: Token robado = acceso indefinido

**Tareas**:
- [ ] Cambiar de localStorage a Supabase Session (viene con expiry automático)
- [ ] Si usas localStorage: agregar `expiresAt` al token
- [ ] Verificar expiración en cada página protegida
- [ ] Logout automático en expiry + toast notification
- [ ] Commit & deploy

---

**HITO FIN FASE 0**: ✅ Aplicación segura para usuarios reales

---

### **FASE 1: FUNCIONALIDAD CORE (2 Semanas)**

Arreglar funcionalidades quebradas para que MVP sea usable.

#### **1.1 - Magic Link Real (2 días)**

**Problema**: Retorna usuario falso, login falla

**Tareas**:
- [ ] Reemplazar stub en `app/auth/magic-link/page.tsx`:
  ```typescript
  const token = searchParams.get('token')
  const { data, error } = await supabase
    .from('magic_links')
    .select('email, user_id, used_at, expires_at')
    .eq('token', token)
    .single()
  
  if (error || !data || data.used_at || new Date(data.expires_at) < new Date()) {
    setStatus('error')
    return
  }
  
  // Mark as used
  await supabase.from('magic_links')
    .update({ used_at: new Date() })
    .eq('token', token)
  
  // Login user
  const { error: signError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: 'magic-link-placeholder' // o usar session ID
  })
  ```

- [ ] Test: envía magic link real, click en email → login funciona
- [ ] Commit & deploy

---

#### **1.2 - Propiedades de Hosts Reservables (3 días)**

**Problema**: Se crean pero no aparecen en búsqueda, no se pueden reservar

**Tareas**:
- [ ] Cambiar `lib/properties-data.ts` para cargar propiedades de BD TAMBIÉN:
  ```typescript
  export async function getAllProperties() {
    // 1. Cargar DB properties
    const { data: dbProps } = await supabase
      .from('properties')
      .select('*')
    
    // 2. Combinar con estáticas
    return [...STATIC_PROPERTIES, ...(dbProps || [])]
  }
  ```

- [ ] Actualizar `/properties` page para usar esta función
- [ ] Actualizar search y filters para incluir properties de BD
- [ ] Actualizar PropertyCard para soportar ambos tipos
- [ ] Verificar que bookings funciona en ambos tipos:
  - Propiedad estática: `property_id` = hardcoded UUID
  - Propiedad BD: `property_id` = UUID de la BD
  
- [ ] Test: host crea propiedad → aparece en búsqueda → se puede reservar
- [ ] Commit & deploy

---

#### **1.3 - Carga de Imágenes para Propiedades (3 días)**

**Problema**: PropertyForm tiene campo de imágenes pero no funciona

**Tareas**:
- [ ] Crear bucket en Supabase Storage: `property-images`
- [ ] Implementar upload en PropertyForm:
  ```typescript
  const uploadImages = async (files: File[]) => {
    const urls = []
    for (const file of files) {
      const { data, error } = await supabase
        .storage
        .from('property-images')
        .upload(`${propertyId}/${file.name}`, file)
      
      if (data) {
        const publicUrl = supabase
          .storage
          .from('property-images')
          .getPublicUrl(data.path).data.publicUrl
        urls.push(publicUrl)
      }
    }
    return urls
  }
  ```

- [ ] Mostrar preview de imágenes antes de guardar
- [ ] Guardar URLs en `properties.images` array
- [ ] Mostrar imágenes en property detail y cards
- [ ] Validar: máximo 5 imágenes, máximo 5MB cada una (client-side)
- [ ] Test: carga 3 imágenes → aparecen en propiedad
- [ ] Commit & deploy

---

#### **1.4 - Reparar Password Change (1 día)**

**Problema**: Consulta BD por columnas que no existen

**Tareas**:
- [ ] Reemplazar query en `app/profile/page.tsx`:
  ```typescript
  // ANTES (roto):
  const password = userData.password // ← no existe
  
  // DESPUÉS (correcto):
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single()
  
  // Verificar password actual antes de cambiar
  const isValid = await verifyPassword(currentPassword, user.password_hash)
  if (!isValid) {
    setError('Contraseña actual incorrecta')
    return
  }
  
  // Actualizar
  const newHash = await hashPassword(newPassword)
  await supabase.from('users')
    .update({ password_hash: newHash })
    .eq('id', userId)
  ```

- [ ] Test: cambiar contraseña → login con nueva contraseña funciona
- [ ] Commit & deploy

---

#### **1.5 - Propiedades en Búsqueda con Imágenes (1 día)**

**Tareas**:
- [ ] PropertyCard: mostrar primera imagen del array
- [ ] Usar `next/image` con optimización
- [ ] Fallback si no hay imagen (placeholder gris)
- [ ] Test: buscar propiedad de host con imagen → se ve correctamente
- [ ] Commit & deploy

---

#### **1.6 - Arreglar AI Chat UI (1 día)**

**Problema**: Endpoint existe pero sin entrada en UI

**Tareas**:
- [ ] Crear `/app/chat/page.tsx` con `ChatWindow` component
- [ ] Agregar link en header o navbar para acceder
- [ ] Test: navegas a /chat → puedes hacer preguntas → Claude responde
- [ ] Commit & deploy

---

**HITO FIN FASE 1**: ✅ MVP Funcional - todas las características core funcionan

---

### **FASE 2: VALIDACIÓN & ERROR HANDLING (1 Semana)**

Hacer que la app sea robusta para usuarios reales.

#### **2.1 - Validación Server-Side en Bookings (2 días)**

**Problema**: Toda validación es client-side, vulnerable a manipulation

**Tareas**:
- [ ] Crear función server en `lib/booking-utils.ts`:
  ```typescript
  export async function validateBooking(
    propertyId: string,
    guestId: string,
    checkIn: Date,
    checkOut: Date
  ) {
    // 1. Propiedad existe
    const { data: prop } = await supabase
      .from('properties')
      .select('price_per_night')
      .eq('id', propertyId)
      .single()
    
    if (!prop) throw new Error('Propiedad no existe')
    
    // 2. Fechas válidas
    if (checkIn >= checkOut) throw new Error('check_out debe ser después de check_in')
    if (checkIn < new Date()) throw new Error('check_in no puede ser en el pasado')
    
    // 3. Disponibilidad - RANGO COMPLETO, no solo fechas individuales
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', propertyId)
      .eq('status', 'confirmed')
      .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`) // overlap query
    
    if (conflicts?.length > 0) throw new Error('Fechas no disponibles')
    
    // 4. Guest existe
    const { data: guest } = await supabase
      .from('users')
      .select('id')
      .eq('id', guestId)
      .single()
    
    if (!guest) throw new Error('Usuario no existe')
    
    return true
  }
  ```

- [ ] Llamar a esta función en endpoint POST de booking
- [ ] Retornar errores claros al cliente
- [ ] Test: intenta hacer booking con fechas solapadas → falla con error claro
- [ ] Commit & deploy

---

#### **2.2 - Validación en Calendario (1 día)**

**Problema**: Calendario valida fechas individuales, no rangos

**Tareas**:
- [ ] `BookingCalendar`: cambiar lógica para bloquear RANGOS:
  ```typescript
  // ANTES: solo marca fechas individuales como no disponibles
  const bookedDates = new Set([...])
  
  // DESPUÉS: bloquea range completo
  const isDateBlocked = (date: Date) => {
    // No puede empezar en fecha booked
    if (bookedDates.has(dateToString(date))) return true
    
    // No puede empezar N días antes de fecha booked
    for (let i = 0; i < MAX_STAY_DAYS; i++) {
      const checkDate = addDays(date, i)
      if (bookedDates.has(dateToString(checkDate))) {
        return true // check_out sería durante booking existente
      }
    }
    
    return false
  }
  ```

- [ ] Test: ves calendarios con eventos, no puedes seleccionar rangos que se solapan
- [ ] Commit & deploy

---

#### **2.3 - Error Handling Consistente (2 días)**

**Problema**: Muchos errores silenciosos

**Tareas**:
- [ ] Crear `lib/error-handler.ts`:
  ```typescript
  export function getUserFriendlyError(error: any): string {
    if (error.message.includes('password')) return 'Contraseña incorrecta'
    if (error.message.includes('email')) return 'Email no registrado'
    if (error.message.includes('duplicate')) return 'Este email ya está registrado'
    return 'Algo salió mal. Intenta nuevamente.'
  }
  ```

- [ ] Envolver operaciones críticas en try-catch con toasts
- [ ] Especialmente: login, signup, crear booking, crear propiedad
- [ ] Test: intenta crear propiedad sin título → ve error claro
- [ ] Commit & deploy

---

#### **2.4 - Validación de Formularios (2 días)**

**Tareas**:
- [ ] PropertyForm:
  - [ ] Validar campos required (título, precio, ubicación)
  - [ ] Precio debe ser número > 0
  - [ ] Descripción mínimo 50 caracteres
  - [ ] Ubicación: validar geocoding o al menos longitud mínima

- [ ] BookingForm:
  - [ ] guest_name: no vacío, mínimo 2 caracteres
  - [ ] guest_email: formato email válido
  - [ ] guest_phone: formato teléfono válido (usar regex)
  - [ ] notes: máximo 500 caracteres

- [ ] RatingForm:
  - [ ] rating: 1-5 (obligatorio)
  - [ ] comment: mínimo 10 caracteres, máximo 1000

- [ ] Input component:
  - [ ] error prop para mostrar mensaje
  - [ ] required asterisk
  - [ ] aria-invalid para accessibility

- [ ] Test: completa formulario incorrecto → ves errores específicos
- [ ] Commit & deploy

---

**HITO FIN FASE 2**: ✅ App robusta - manejo de errores correcto, imposible data inválida

---

### **FASE 3: PERFORMANCE & ESCALABILIDAD (1 Semana)**

Preparar para 100K usuarios.

#### **3.1 - Optimizar Queries (2 días)**

**Problema**: Queries O(n) con iteración en JavaScript

**Tareas**:
- [ ] `getPropertyBookedDates`: cambiar a date range query en SQL
  ```typescript
  // ANTES: O(n) en JS
  const bookings = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
  
  const dates = new Set()
  bookings.forEach(b => {
    for (let d = b.check_in; d < b.check_out; d += 1 day) {
      dates.add(dateToString(d))
    }
  })
  
  // DESPUÉS: O(1) en SQL
  const { data } = await supabase.from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .eq('status', 'confirmed')
  
  // Retornar crudo - cliente lo itera (eficiente)
  return data
  ```

- [ ] `getConversations`: cambiar a DISTINCT ON query
  ```sql
  -- ANTES: 2 queries + iteración en JS
  -- Query 1: conversaciones
  -- Query 2: todos los mensajes
  -- JS: extraer último mensaje por conversation
  
  -- DESPUÉS: 1 query eficiente
  SELECT DISTINCT ON (c.id)
    c.*, m.content as last_message, m.created_at as last_message_at
  FROM conversations c
  LEFT JOIN messages m ON c.id = m.conversation_id
  WHERE c.guest_id = $1 OR c.host_id = $1
  ORDER BY c.id, m.created_at DESC
  ```

- [ ] Agregar índices:
  ```sql
  CREATE INDEX idx_properties_city ON properties(city);
  CREATE INDEX idx_bookings_property_status ON bookings(property_id, status);
  CREATE INDEX idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
  ```

- [ ] Verificar explain plan: queries no deben hacer full table scans
- [ ] Test: cargar propiedad con 1000 bookings → no lag
- [ ] Commit & deploy

---

#### **3.2 - Paginación en Mensajes (2 días)**

**Problema**: Carga TODOS los mensajes en memory

**Tareas**:
- [ ] Cambiar `ChatWindow` para cargar mensajes en batches:
  ```typescript
  const [messages, setMessages] = useState([])
  const [pageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const loadOlderMessages = async () => {
    const offset = (page - 1) * pageSize
    const { data, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)
    
    setMessages([...data.reverse(), ...messages])
    setPage(page + 1)
    setHasMore(count > offset + pageSize)
  }
  
  return (
    <>
      {hasMore && <button onClick={loadOlderMessages}>Cargar más</button>}
      {messages.map(m => <Message key={m.id} message={m} />)}
    </>
  )
  ```

- [ ] Test: conversación con 5000 mensajes → carga rápido, cargas paginas al scroll
- [ ] Commit & deploy

---

#### **3.3 - Optimizar Imágenes (1 día)**

**Problema**: Imágenes sin optimización

**Tareas**:
- [ ] Usar `next/image` en PropertyCard y detail:
  ```typescript
  import Image from 'next/image'
  
  <Image
    src={property.images[0]}
    alt={property.title}
    width={400}
    height={300}
    loading="lazy"
    placeholder="blur"
    blurDataURL="data:image/svg+xml..." // placeholder pequeño
  />
  ```

- [ ] Crear srcSet para responsive
- [ ] Test: carga property detail → imágenes cargan rápido, blur placeholder visible
- [ ] Commit & deploy

---

#### **3.4 - Caché en Cliente (2 días)**

**Problema**: Queries repetidas sin caché

**Tareas**:
- [ ] Instalar `react-query` o usar Supabase cache nativo
- [ ] Cachear:
  - Listado de propiedades (revalidate cada 5 min)
  - Propiedades por ID (revalidate cada 10 min)
  - Conversaciones del usuario (revalidate cada 1 min)
  - Perfil del usuario (revalidate cada 30 min)

- [ ] Ejemplo con Supabase:
  ```typescript
  // Supabase realtime para invalidate automático
  const subscription = supabase
    .from('properties')
    .on('*', payload => {
      queryClient.invalidateQueries(['properties'])
    })
    .subscribe()
  ```

- [ ] Test: recarga página → no ve peticiones de red duplicadas
- [ ] Commit & deploy

---

**HITO FIN FASE 3**: ✅ App performante - escalable a miles de usuarios

---

### **FASE 4: INFRAESTRUCTURA ESCALABLE (1.5 Semanas)**

Preparar para 100K usuarios con baja latencia.

#### **4.1 - Supabase a Plan Pagado (1 día)**

**Cambios**:
- [ ] Upgrade a plan "Pro" o "Team" en Supabase ($25-100/mes)
  - ✅ Unlimited databases
  - ✅ Unlimited realtime connections (estabas limitado a ~60)
  - ✅ Better performance
  - ✅ Priority support
  - ✅ Backups automáticos

- [ ] Configurar backups automáticos (diarios)
- [ ] Configurar alertas de uptime
- [ ] Documentar acceso a BD (para emergencias)

---

#### **4.2 - CDN para Imágenes (2 días)**

**Problema**: Imágenes desde Supabase pueden ser lentas globalmente

**Opciones**:
- **Cloudinary** ($89+/mes) - recomendado
- **AWS CloudFront** ($0.085/GB)
- **Bunny CDN** ($0.03/GB) - más barato

**Tareas con Cloudinary**:
- [ ] Crear cuenta Cloudinary (gratuita para dev)
- [ ] Cambiar upload:
  ```typescript
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    
    const data = await response.json()
    return data.secure_url // CDN URL
  }
  ```

- [ ] Cambiar display para usar Cloudinary transformation:
  ```typescript
  // Antes: https://res.supabase.co/...
  // Después: https://res.cloudinary.com/.../w_400,q_auto/...
  // Esto: automáticamente resize, optimiza, cachea en CDN global
  ```

- [ ] Test: imagen carga rápido desde cualquier país (puedes test con VPN)
- [ ] Commit & deploy

---

#### **4.3 - Monitoreo & Alertas (2 días)**

**Tareas**:
- [ ] Instalar Sentry (error tracking)
  ```typescript
  import * as Sentry from "@sentry/nextjs"
  
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  })
  ```

- [ ] Instalar DataDog o similar para monitoring
  - Tiempo de respuesta de API
  - Errores
  - Uso de BD
  - Uso de storage

- [ ] Crear alertas:
  - Error rate > 1%
  - API response time > 1s
  - DB connections > 50
  - Storage > 80% capacity

- [ ] Dashboard público de status (https://status.beliving.com)
- [ ] Test: simula un error → ves en Sentry
- [ ] Commit & deploy

---

#### **4.4 - Database Read Replicas (2 días)**

**Problema**: A 100K usuarios, lectura de BD se vuelve cuello de botella

**Tareas** (solo si presupuesto lo permite):
- [ ] En Supabase dashboard: Create read replica en región diferente
- [ ] Crear clientes Supabase separados:
  ```typescript
  const supabaseRead = createClient(URL, ANON_KEY, {
    realtime: { params: { eventsPerSecond: 2 } },
  })
  ```

- [ ] Dirigir lecturas a read replica:
  ```typescript
  // Lectura: hacia replica
  const { data } = await supabaseRead
    .from('properties')
    .select('*')
  
  // Escritura: hacia primary
  await supabase
    .from('properties')
    .insert(newProperty)
  ```

- [ ] Test: queries de lectura son más rápidas
- [ ] Nota: Esta es una optimización avanzada, skip si no lo necesitas aún

---

#### **4.5 - Validación de Performance (1 día)**

**Tareas**:
- [ ] Load testing con 1000 usuarios simultáneos usando K6:
  ```javascript
  import http from 'k6/http'
  import { check } from 'k6'
  
  export let options = {
    vus: 1000,
    duration: '5m',
  }
  
  export default () => {
    const res = http.get('https://beliving.com/properties')
    check(res, {
      'status is 200': r => r.status === 200,
      'response time < 1s': r => r.timings.duration < 1000,
    })
  }
  ```

- [ ] Ejecutar: `k6 run load-test.js`
- [ ] Documentar resultados (response time, error rate, etc.)
- [ ] Identificar bottlenecks y optimizar
- [ ] Commit & deploy

---

**HITO FIN FASE 4**: ✅ Infraestructura lista para 100K usuarios

---

### **FASE 5: FUNCIONALIDADES AVANZADAS (2-3 Semanas)**

Features que diferencian tu plataforma.

#### **5.1 - Sistema de Pagos (Stripe) (4 días)**

**Tareas**:
- [ ] Instalar `@stripe/react-stripe-js`
- [ ] Crear checkout en booking:
  ```typescript
  const handlePayment = async () => {
    const { data: session } = await supabase.functions.invoke('create-payment', {
      body: { bookingId, amount: totalPrice }
    })
    
    const { error } = await stripe.redirectToCheckout({ sessionId: session.id })
  }
  ```

- [ ] Crear edge function en Supabase:
  ```typescript
  // supabase/functions/create-payment/index.ts
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'))
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Booking' },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${origin}/bookings/${bookingId}?success=true`,
    cancel_url: `${origin}/bookings/${bookingId}?canceled=true`,
  })
  
  return { sessionId: session.id }
  ```

- [ ] Webhook en `/api/webhooks/stripe` para confirmar pago
- [ ] Test: hace booking → redirecciona a Stripe → pago confirma reserva
- [ ] Commit & deploy

---

#### **5.2 - Notificaciones por Email (2 días)**

**Tareas**:
- [ ] Instalar `nodemailer` o usar SendGrid
- [ ] Crear templates para:
  - Bienvenida (signup)
  - Confirmación de reserva
  - Nueva mensaje
  - Cancelación de reserva

- [ ] Enviar emails en eventos:
  ```typescript
  const sendBookingConfirmation = async (booking) => {
    await sendEmail({
      to: booking.guest_email,
      subject: `Reserva confirmada - ${booking.property_name}`,
      html: renderTemplate('booking-confirmation', { booking })
    })
  }
  ```

- [ ] Test: haz booking → recibes email de confirmación
- [ ] Commit & deploy

---

#### **5.3 - Push Notifications (2 días)**

**Tareas**:
- [ ] Instalar FCM (Firebase Cloud Messaging) o OneSignal
- [ ] Pedir permiso en primer load:
  ```typescript
  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      // registrar token
    }
  }
  ```

- [ ] Enviar notificaciones cuando:
  - Nueva mensage
  - Reserva confirmada
  - Host canceló reserva

- [ ] Test: recibe push en teléfono cuando algo importante pasa
- [ ] Commit & deploy

---

#### **5.4 - Dashboard Analytics para Hosts (3 días)**

**Tareas**:
- [ ] Instalar chart library (ya existe en código)
- [ ] Agregar más gráficos:
  - Ingresos por mes (ya existe)
  - Tasa de ocupación por mes
  - Calificación promedio por mes
  - Palabras clave en reviews (sentiment analysis)

- [ ] Agregar filtros:
  - Por propiedad
  - Por rango de fechas
  - Exportar a PDF/CSV

- [ ] Test: host ve analytics detallados de sus propiedades
- [ ] Commit & deploy

---

**HITO FIN FASE 5**: ✅ Plataforma diferenciada con pagos, notificaciones, analytics

---

## 📊 PLAN ESPECÍFICO PARA 100K USUARIOS GUESTS

### **Arquitectura para 100K Usuarios**

```
┌─────────────────────────────────────────────────────┐
│                    USUARIOS (100K)                  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌────▼────┐
    │VERCEL  │          │Cloudflare│
    │ (Web)  │          │  (DNS)   │
    └───┬────┘          └──────────┘
        │
        ├─ NextJS App (edge functions)
        ├─ Realtime: 10,000 conexiones simultáneas
        └─ ISR: revalidate propiedades cada 5 min
        │
    ┌───▼──────────────────────┐
    │   SUPABASE (Pro Plan)    │
    ├──────────────────────────┤
    │ PostgreSQL (50GB+)       │
    │ - 7 tablas optimizadas   │
    │ - Read replicas en 3     │
    │   regiones               │
    │ - Connection pooling     │
    │ - Backups diarios        │
    └───┬──────────────────────┘
        │
        ├─ Storage: imágenes + backups
        ├─ Auth: Supabase Auth native
        ├─ Realtime: hasta 100K conexiones
        └─ Edge Functions: webhooks, pagos
        │
    ┌───▼──────────────────────┐
    │   CLOUDINARY (CDN)       │
    ├──────────────────────────┤
    │ - Imágenes optimizadas   │
    │ - Global CDN (200 POP)   │
    │ - Compression automático │
    └──────────────────────────┘
```

---

### **Requisitos de Infraestructura**

#### **1. Base de Datos (Supabase Pro)**

**Capacidad**:
- 100K usuarios × 5KB promedio = 500MB (bien dentro de límites)
- 100K usuarios × 5 propiedades = 500K propiedades (también OK)
- 100K usuarios × 50 bookings promedio = 5M bookings (cabe)
- Total estimado: 30-50GB (Supabase Pro ofrece 200GB)

**Optimizaciones**:
```sql
-- Índices críticos para 100K usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_host_id ON properties(host_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_host_id ON bookings(host_id);
CREATE INDEX idx_bookings_property_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_messages_conversation_date ON messages(conversation_id, created_at);
CREATE INDEX idx_ratings_property ON ratings(property_id);

-- Partición de bookings por año (opcional, avanzado)
CREATE TABLE bookings_2024 PARTITION OF bookings
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE bookings_2025 PARTITION OF bookings
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

**Costo**: $25-50/mes (Supabase Pro)

---

#### **2. API & Servidor (Vercel + Edge Functions)**

**Capacidad**:
- 100K usuarios × 1 request/min promedio = 1.6M requests/min
- Vercel puede manejar 10K+ requests/segundo ✅

**Optimizaciones**:
```typescript
// Usar Edge Functions para latencia baja
// supabase/functions/get-properties/index.ts

export async function GET(req: Request) {
  const url = new URL(req.url)
  const city = url.searchParams.get('city')
  
  // Edge function (corres en edge, ~50ms latencia global)
  const response = await supabase
    .from('properties')
    .select('*')
    .eq('city', city)
    .limit(50)
  
  return new Response(JSON.stringify(response), {
    headers: {
      'Cache-Control': 'max-age=300', // 5 min caché
      'CDN-Cache-Control': 'max-age=3600', // 1h en CDN
    },
  })
}
```

**Costo**: $0-100/mes (Vercel Pro + Edge Functions)

---

#### **3. Storage (CDN + Backup)**

**Capacidad**:
- 100K usuarios × 3 imágenes promedio × 2MB = 600GB

**Solución**:
- Cloudinary: automatic resize, crop, format conversion
  - 100GB/mes gratis para transformations
  - Después: $89+/mes

**Costo**: $0-100/mes (Cloudinary Pro)

---

#### **4. Analytics & Monitoring**

**Herramientas**:
- Sentry: error tracking (hasta 5000 eventos/mes gratis)
- PostHog: product analytics (gratis)
- Supabase monitoring: built-in

**Costo**: $0-50/mes (early stage)

---

#### **5. Pagos (Stripe)**

**Costo**: 2.9% + $0.30 por transacción

---

### **COSTO TOTAL MENSUAL PARA 100K USUARIOS**

| Servicio | Costo |
|----------|-------|
| Supabase Pro | $25-50 |
| Vercel Pro | $20 |
| Cloudinary | $89-200 |
| Stripe (2.9% + $0.30) | Variable |
| Sentry/PostHog | $0-50 |
| Domain + SSL | $12 |
| Backups & redundancy | $50-100 |
| **Total estimado** | **$200-450/mes** |

---

### **Escala de Usuarios Soportadas**

| Usuarios | Capacidad | Costo | Tiempo de respuesta |
|----------|-----------|-------|-------------------|
| 1K | ✅ ✅ | $50 | <100ms |
| 10K | ✅ ✅ | $100 | <200ms |
| 100K | ✅ ✅ | $300-500 | <500ms |
| 1M | ✅ (con upgrades) | $1500-3000/mes | <1s |
| 10M | ⚠️ Requiere arquitectura microservicios | $10K+/mes | Variable |

---

### **Checklist para 100K Usuarios**

```
DATABASE:
- [ ] Supabase Plan "Pro" o "Team"
- [ ] Read replicas en 3 regiones (US, EU, APAC)
- [ ] Todos los índices del plan anterior
- [ ] Backups automáticos (diarios)
- [ ] Connection pooling configurado
- [ ] Monitoring de query time

API:
- [ ] Todas las queries optimizadas
- [ ] Paginación en listas grandes
- [ ] Caché agresivo (HTTP cache headers)
- [ ] Rate limiting: 100 req/min por usuario
- [ ] CORS configurado correctamente

STORAGE:
- [ ] Imágenes en CDN global (Cloudinary)
- [ ] Compression automático
- [ ] Resize automático según device

FRONTEND:
- [ ] next/image con lazy loading
- [ ] Code splitting automático
- [ ] Service Worker para offline
- [ ] ISR: revalidate cada 5 min

PAYMENTS:
- [ ] Stripe integrado
- [ ] Webhooks para confirmación
- [ ] Manejo de fallos de pago

NOTIFICATIONS:
- [ ] Email (SendGrid o similar)
- [ ] Push notifications (FCM)
- [ ] SMS (Twilio, opcional)

MONITORING:
- [ ] Sentry para errores
- [ ] Analytics (PostHog, Segment)
- [ ] Uptime monitoring (StatusPage)
- [ ] Performance monitoring (DataDog, New Relic)

SECURITY:
- [ ] RLS habilitado en BD
- [ ] HTTPS en todo
- [ ] Rate limiting en auth
- [ ] 2FA (opcional)
- [ ] DDoS protection (Cloudflare)
```

---

## 🚀 CRONOGRAMA RECOMENDADO

```
SEMANA 1-2:  FASE 0 (Vulnerabilidades) + FASE 1 (Core)
SEMANA 3:    FASE 2 (Validación)
SEMANA 4-5:  FASE 3 (Performance)
SEMANA 6:    FASE 4 (Infraestructura)
SEMANA 7-8:  FASE 5 (Avanzadas)
─────────────────────────────────
SEMANA 9:    Testing, QA, optimizaciones finales
SEMANA 10:   Lanzamiento

Total: 10 semanas (2.5 meses)
```

---

## 📋 DEFINICIÓN DE "LISTO 100%"

Tu proyecto está 100% listo cuando:

```
✅ Seguridad
  - RLS habilitado
  - No hay credenciales expuestas
  - Rate limiting en auth
  - Validación server-side

✅ Funcionalidad
  - Todas las características funcionan
  - Magic link funciona
  - Propiedades de hosts reservables
  - Imágenes cargan

✅ UX
  - Error handling consistente
  - Validación clara
  - No hay errores silenciosos
  - Mobile responsive

✅ Performance
  - <500ms respuesta en 95% de requests
  - Carga con 1000 usuarios simultáneos
  - Mensajes cargan paginados

✅ Escalabilidad
  - Infraestructura para 100K usuarios
  - CDN configurado
  - Backups automáticos
  - Monitoring activo

✅ Calidad de Código
  - Cero `any` en tipos
  - Código no usado removido
  - Schemas SQL sincronizados
  - Tests de carga pasados

✅ Documentación
  - README completo
  - API documentada
  - Schema BD documentado
  - Guía de deployment
```

---

## 🎯 PRIORIDADES POR DÍA

### **SEMANA 1 (Lunes-Viernes)**

**LUNES**: Fix credenciales & RLS
**MARTES**: Sincronizar schemas + Rate limiting
**MIÉRCOLES**: Magic link real
**JUEVES**: Propiedades de hosts reservables
**VIERNES**: Carga de imágenes

---

## 💡 TIPS FINALES

1. **Testa cada cambio localmente primero** - no directamente en producción
2. **Haz commits pequeños** - cada tarea = 1 commit
3. **Crea PR para cada fase** - review antes de merge
4. **Documenta cambios grandes** - suma 30 min por tarea pero ahorra horas después
5. **Haz load testing early** - descubre problemas en FASE 3, no en producción
6. **Mantén un log de issues** - al encontrar bugs, anota el patrón

---

**¿Listo para comenzar con FASE 0?** Te recomiendo empezar HOYS con remover las credenciales expuestas. Es lo más crítico.

