# FASE 1 - Endpoints API Completados

✅ **9 Endpoints Creados y Funcionales**

---

## 📍 Properties (Propiedades)

### `GET /api/properties`
- **Función**: Listar todas las propiedades disponibles
- **Parámetros**: `city` (opcional), `limit` (default 50)
- **Respuesta**: Array de propiedades

```bash
GET /api/properties?city=Madrid&limit=10
```

### `POST /api/properties`
- **Función**: Crear una nueva propiedad
- **Requerido**: host_id, title, location, city, price
- **Respuesta**: Propiedad creada (status 201)

```bash
POST /api/properties
{
  "host_id": "uuid",
  "title": "Apartamento moderno",
  "description": "...",
  "location": "Calle Principal 123",
  "city": "Madrid",
  "price": 150.00,
  "amenities": ["WiFi", "AC"],
  "max_guests": 4,
  "bedrooms": 2,
  "bathrooms": 1
}
```

### `GET /api/properties/[id]`
- **Función**: Obtener detalles de una propiedad específica
- **Respuesta**: Objeto de propiedad

### `POST /api/properties/[id]`
- **Función**: Actualizar propiedad (solo host)
- **Validación**: Verifica que host_id sea dueño de la propiedad
- **Respuesta**: Propiedad actualizada

---

## 📅 Bookings (Reservas)

### `GET /api/bookings`
- **Función**: Listar bookings del usuario
- **Parámetros**: `user_id` (requerido), `role` ('guest' o 'host')
- **Respuesta**: Array de bookings ordenados por fecha

```bash
GET /api/bookings?user_id=uuid&role=guest
```

### `POST /api/bookings`
- **Función**: Crear una nueva reserva
- **Requerido**: property_id, guest_id, host_id, check_in, check_out, total_price
- **Validación**: Verifica fechas (check_out > check_in)
- **Respuesta**: Booking creado (status 201)

```bash
POST /api/bookings
{
  "property_id": "varchar",
  "guest_id": "uuid",
  "host_id": "uuid",
  "check_in": "2026-05-10",
  "check_out": "2026-05-15",
  "total_price": 750.00,
  "guest_name": "Juan Pérez",
  "guest_email": "juan@example.com",
  "notes": "Llegada tarde"
}
```

### `GET /api/bookings/[id]`
- **Función**: Obtener detalles de una reserva
- **Respuesta**: Objeto de booking

### `POST /api/bookings/[id]`
- **Función**: Actualizar estado de reserva
- **Parámetros**: `status` (pending/confirmed/cancelled), `user_id`
- **Validación**: Solo guest o host pueden actualizar
- **Respuesta**: Booking actualizado

---

## 🔗 Magic Links (Registración sin contraseña)

### `POST /api/magic-links/send`
- **Función**: Enviar magic link para registro
- **Parámetro**: `email`
- **Respuesta**: Enlace de verificación (dev mode solo)

```bash
POST /api/magic-links/send
{ "email": "user@example.com" }
```

### `POST /api/magic-links/verify`
- **Función**: Verificar token y crear/actualizar usuario
- **Requerido**: `token`, `user_type`, `first_name` (opcional), `last_name` (opcional)
- **Lógica**: 
  - Si el usuario existe → actualiza
  - Si es nuevo → crea usuario
- **Respuesta**: Datos de usuario

```bash
POST /api/magic-links/verify
{
  "token": "...",
  "user_type": "guest",
  "first_name": "Juan",
  "last_name": "Pérez"
}
```

---

## 💬 Conversations & Messages (Mensajes)

### `GET /api/conversations`
- **Función**: Listar conversaciones del usuario
- **Parámetro**: `user_id` (requerido)
- **Respuesta**: Array de conversaciones

### `POST /api/conversations`
- **Función**: Crear conversación (desde booking)
- **Requerido**: booking_id, guest_id, host_id, guest_name, host_name, guest_email, host_email, property_id, property_title
- **Respuesta**: Conversación creada

### `GET /api/messages`
- **Función**: Obtener mensajes de una conversación
- **Parámetro**: `conversation_id` (requerido)
- **Respuesta**: Array de mensajes ordenados por fecha

### `POST /api/messages`
- **Función**: Enviar mensaje
- **Requerido**: conversation_id, sender_id, sender_name, content
- **Validación**: 
  - Verifica que sender sea parte de la conversación
  - Valida que el mensaje no esté vacío
- **Respuesta**: Mensaje creado
- **Side effect**: Actualiza `updated_at` de la conversación

---

## ⭐ Ratings (Reseñas)

### `GET /api/ratings`
- **Función**: Obtener reseñas de una propiedad
- **Parámetro**: `property_id` (requerido)
- **Respuesta**: Array de ratings ordenados por fecha descendente

### `POST /api/ratings`
- **Función**: Crear reseña para una reserva
- **Requerido**: booking_id, property_id, guest_id, rating (1-5), comment
- **Validación**: 
  - Rating debe estar entre 1 y 5
  - No puede haber dos reseñas del mismo booking
- **Respuesta**: Rating creado (status 201)

---

## 📤 Upload (Cargar imágenes)

### `POST /api/upload`
- **Función**: Subir imagen a Supabase Storage
- **Form Data**: 
  - `file` (requerido): imagen JPEG, PNG o WebP
  - `bucket` (default: 'properties'): dónde guardar
  - `user_id` (requerido): ID del usuario
- **Validación**:
  - Tipos: JPEG, PNG, WebP solo
  - Máximo: 5MB
- **Respuesta**: URL pública, path, bucket

```bash
POST /api/upload
Content-Type: multipart/form-data

file: [binary]
bucket: properties
user_id: uuid
```

---

## 🔒 Seguridad Implementada

✅ **Rate Limiting** (5 intentos/15 min en auth endpoints)
✅ **RLS en BD** (Políticas de seguridad nivel fila)
✅ **Validación de entrada** (Tipos, tamaños, rangos)
✅ **Autorización** (Verifica ownership de recursos)
✅ **Session expiry** (24 horas automáticamente)
✅ **Sanitización de archivos** (Tipos, tamaños)

---

## 📋 Estados HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Recurso ya existe (ej: rating duplicado) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

---

## ✅ FASE 1 - Completada

Todos los endpoints están listos para ser consumidos por el frontend.
El siguiente paso es crear los componentes/hooks para usarlos.
