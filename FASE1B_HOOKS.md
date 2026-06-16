# FASE 1B - React Hooks para API

✅ **6 Hooks Personalizados Creados**

---

## 📦 Hooks Disponibles

### 1. **useProperties** - Gestionar Propiedades
```typescript
const { properties, loading, error, fetchProperties, getProperty, createProperty, updateProperty } = useProperties();
```
- `fetchProperties(city?, limit?)` - Listar propiedades
- `getProperty(id)` - Obtener una propiedad
- `createProperty(data)` - Crear propiedad (host)
- `updateProperty(id, updates)` - Actualizar propiedad

---

### 2. **useBookings** - Gestionar Reservas
```typescript
const { bookings, loading, error, fetchBookings, getBooking, createBooking, updateBookingStatus } = useBookings();
```
- `fetchBookings(userId, role)` - Listar reservas (guest o host)
- `getBooking(id)` - Obtener detalles de reserva
- `createBooking(data)` - Crear nueva reserva
- `updateBookingStatus(bookingId, status, userId)` - Cambiar estado (pending/confirmed/cancelled)

---

### 3. **useMessages** - Conversaciones y Mensajes
```typescript
const { messages, conversations, loading, error, fetchConversations, createConversation, fetchMessages, sendMessage } = useMessages();
```
- `fetchConversations(userId)` - Listar conversaciones
- `createConversation(data)` - Crear conversación desde booking
- `fetchMessages(conversationId)` - Obtener mensajes
- `sendMessage(conversationId, senderId, senderName, content)` - Enviar mensaje

---

### 4. **useMagicLink** - Registro sin Contraseña
```typescript
const { loading, error, sentEmail, sendMagicLink, verifyToken } = useMagicLink();
```
- `sendMagicLink(email)` - Enviar enlace mágico
- `verifyToken(token, userType, firstName?, lastName?)` - Verificar y crear usuario
- Guarda sesión automáticamente con expiración de 24h

---

### 5. **useUpload** - Subir Imágenes
```typescript
const { loading, error, progress, uploadFile, uploadMultiple } = useUpload();
```
- `uploadFile(file, userId, bucket?)` - Subir un archivo
- `uploadMultiple(files[], userId, bucket?)` - Subir múltiples archivos
- Valida: tipos (JPEG/PNG/WebP), tamaño máx 5MB
- Retorna: URL pública, path, bucket

---

### 6. **useRatings** - Reseñas y Calificaciones
```typescript
const { ratings, loading, error, fetchPropertyRatings, createRating, getAverageRating, getRatingDistribution } = useRatings();
```
- `fetchPropertyRatings(propertyId)` - Obtener reseñas
- `createRating(data)` - Crear reseña (1-5 estrellas)
- `getAverageRating()` - Calificación promedio
- `getRatingDistribution()` - Distribución de estrellas

---

## 🚀 Uso Rápido

### En cualquier componente client:

```tsx
'use client';

import { useProperties, useBookings, useMessages } from '@/lib/hooks';
import { useSession } from '@/lib/useSession';

export function MyComponent() {
  const { session } = useSession();
  const { properties, fetchProperties } = useProperties();
  const { bookings, createBooking } = useBookings();

  useEffect(() => {
    if (session) {
      fetchProperties('Madrid');
    }
  }, [session, fetchProperties]);

  return (
    // tu UI aquí
  );
}
```

---

## 📋 Características

✅ **Type-safe** - TypeScript con interfaces completas
✅ **Error handling** - Manejo de errores automático
✅ **Loading states** - Estado de carga para cada operación
✅ **Session integration** - Integración con sistema de sesiones
✅ **Progress tracking** - Para subidas de archivos
✅ **Validación** - Validación de archivos y datos
✅ **Caching** - Estado local en el componente
✅ **Memory efficient** - No hace polling innecesario

---

## 📁 Archivos Creados

```
lib/hooks/
├── index.ts                 # Exporta todos los hooks
├── useProperties.ts         # Gestión de propiedades
├── useBookings.ts          # Gestión de reservas
├── useMessages.ts          # Conversaciones y mensajes
├── useMagicLink.ts         # Registro sin contraseña
├── useUpload.ts            # Subidas de archivos
├── useRatings.ts           # Reseñas y calificaciones
└── USAGE_EXAMPLES.md       # Ejemplos detallados de uso
```

---

## ✅ Integración con Seguridad

✅ Hooks usan **useSession** automáticamente (magic links)
✅ Endpoints validan **autorización** (ownership, roles)
✅ **Rate limiting** en auth endpoints
✅ **RLS en BD** protege datos a nivel fila
✅ Sesiones expiran automáticamente (24h)

---

## 🔄 Flujo de Datos

```
Componente Client
    ↓
Hook (useProperties, useBookings, etc.)
    ↓
fetch() → /api/[endpoint]
    ↓
Endpoint (validación, autorización)
    ↓
Supabase (RLS, BD)
    ↓
Respuesta → Hook → Componente
```

---

## 📈 Próximos Pasos

Con estos hooks, el frontend puede:
- ✅ Listar y crear propiedades
- ✅ Hacer y gestionar reservas
- ✅ Enviar mensajes en tiempo real
- ✅ Registrarse sin contraseña
- ✅ Subir imágenes
- ✅ Crear reseñas

**FASE 1 está 100% lista para conectar el frontend con la API.**
