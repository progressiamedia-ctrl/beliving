# Admin Dashboard — Guía de Setup

## 📋 Resumen de Cambios

Se ha creado un Dashboard Admin completo con 4 tabs para gestionar la plataforma:

**Archivos creados:**
- `app/admin/page.tsx` - Dashboard principal (1,300 líneas)
- `app/api/admin/stats/route.ts` - Endpoint de estadísticas
- `app/api/admin/users/route.ts` - Endpoint de usuarios (GET + PATCH)
- `app/api/admin/properties/route.ts` - Endpoint de propiedades (GET + PATCH)
- `app/api/admin/bookings/route.ts` - Endpoint de reservas (GET)
- `lib/admin-setup.sql` - Script SQL para setup en Supabase

---

## 🚀 Pasos de Setup

### Paso 1: Ejecutar SQL en Supabase

⚠️ **IMPORTANTE**: Esto debe hacerse ANTES de acceder a `/admin`

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Lee el archivo `lib/admin-setup.sql` en tu repo
3. **Cambia la línea:**
   ```sql
   UPDATE users SET user_type = 'admin' WHERE email = 'developer1@invertox.com';
   ```
   por tu email:
   ```sql
   UPDATE users SET user_type = 'admin' WHERE email = 'TU_EMAIL@ejemplo.com';
   ```
4. **Copia y pega TODO el script en Supabase**
5. **Ejecuta** (botón ▶️)
6. Verifica que veas: `UPDATE 1` (significa que tu usuario fue actualizado a admin)

**Lo que hace el SQL:**
- Agrega columna `is_banned` a la tabla `users`
- Extiende el CHECK para aceptar `'admin'` en `user_type`
- Te asigna el rol de admin

---

### Paso 2: Login y Acceso

1. **Login** con tu email en `/auth/register` o `/properties`
   - Asegúrate que `localStorage.userRole` sea `'admin'`
   
2. **Navega a** `http://localhost:3000/admin`
   - Se carga el dashboard automáticamente
   - Si no eres admin, redirige a `/` (home)

---

## 📊 Dashboard Tabs

### 1. Resumen (Overview)
- **4 KPI Cards:**
  - Total Usuarios
  - Total Propiedades
  - Total Reservas
  - Ingresos Totales (suma de reservas confirmadas)
- **Tabla Reciente:** Últimas 10 reservas

### 2. Usuarios
- **Filtros:** [Todos] [Hosts] [Guests] [Sin verificar] [Baneados]
- **Tabla con columnas:**
  - Email | Tipo | Verificado | Baneado | Registro
- **Acciones por usuario:**
  - `[Verificar]` - Marca usuario como verificado
  - `[Banear/Desbanear]` - Activa/desactiva ban (impide login si está baneado)

### 3. Propiedades
- **Filtros:** [Todas] [Verificadas] [Pendientes] [Ocultas]
- **Tabla con columnas:**
  - Título | Ciudad | Precio | Verificada | Disponible
- **Acciones por propiedad:**
  - `[Verificar]` - Marca propiedad como verificada (visible)
  - `[Ocultar/Mostrar]` - Controla visibilidad para guests

### 4. Reservas
- **Filtros:** [Todas] [Confirmadas] [Pendientes] [Canceladas]
- **Tabla de solo lectura:**
  - Propiedad | Huésped | Fechas | Precio | Status
- **Sin acciones** (reservas no se modifican desde admin)

---

## 🔗 API Endpoints (para desarrollo)

Todos usan `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS.

```bash
# Stats
GET /api/admin/stats
→ { totalUsers, totalProperties, totalBookings, totalRevenue }

# Users
GET /api/admin/users?role=host&unverified=true
PATCH /api/admin/users
  { userId, verified: true, is_banned: false }

# Properties
GET /api/admin/properties?verified=false&city=Madrid
PATCH /api/admin/properties
  { propertyId, verified: true, available: true }

# Bookings
GET /api/admin/bookings?status=pending
```

---

## 🔐 Seguridad

- ✅ **Auth Guard:** Solo usuarios con `userRole === 'admin'` pueden acceder
- ✅ **Service Role:** APIs usan `SUPABASE_SERVICE_ROLE_KEY` (acceso completo)
- ✅ **Optimistic Updates:** Las acciones se ven inmediatamente, rollback si falla

---

## 💾 LocalStorage

El admin dashboard usa:
```javascript
localStorage.userRole  // Debe ser 'admin'
localStorage.userId    // Tu ID de usuario
```

---

## 🧪 Testing

### Scenario 1: Verificar un usuario
1. Ve a **Usuarios** tab
2. Filtra por `[Sin verificar]`
3. Haz clic `[Verificar]`
4. El usuario aparece con ✓ verificado

### Scenario 2: Banear un usuario
1. Ve a **Usuarios** tab
2. Haz clic `[Banear]`
3. El botón se vuelve gris y dice `[Desbanear]`
4. El usuario puede ser desbaneado más tarde

### Scenario 3: Verificar propiedad
1. Ve a **Propiedades** tab
2. Filtra por `[Pendientes]`
3. Haz clic `[Verificar]`
4. Aparece un badge ✓ "Verificada"

### Scenario 4: Ver estadísticas
1. Ve a **Resumen** tab
2. Deberías ver 4 números grandes (stats)
3. La tabla muestra últimas 10 reservas

---

## 📝 Notas de Desarrollo

### Cómo agregar más acciones

En `app/admin/page.tsx`, cada tabla tiene un handler:
```tsx
const handleVerifyUser = async (userId: string) => {
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify({ userId, verified: true })
  });
  // Actualizar state localmente
}
```

Para agregar una nueva acción:
1. Crea un nuevo endpoint en `app/api/admin/[resource]/route.ts`
2. Agrega un handler en `page.tsx`
3. Agrega un botón en la tabla

### Cómo agregar más filtros

En `page.tsx`, los filtros usan `Array.filter()` en el cliente:
```tsx
const filteredUsers = users.filter(u => {
  if (userFilter === 'custom') return u.someField === value;
  return true;
});
```

Para agregar un filtro:
1. Agrega al estado: `const [customFilter, setCustomFilter] = useState('default')`
2. Agrega botón en UI
3. Agrega lógica en el filter

---

## ❓ FAQ

**P: ¿Qué pasa si no ejecuto el SQL?**
- R: Obtendrás error "is_banned column does not exist" en console. Debes ejecutar el SQL.

**P: ¿Puedo agregar más admins?**
- R: Sí, en Supabase directo: `UPDATE users SET user_type = 'admin' WHERE email = '...'`

**P: ¿Las acciones se guardan en BD?**
- R: Sí, todos los PATCH endpoints hacen UPDATE en Supabase inmediatamente.

**P: ¿Cuál es la diferencia entre "baneado" y "no verificado"?**
- R: 
  - **Verificado**: Usuario completo su email, perfil, etc. Puede usar la plataforma.
  - **Baneado**: Usuario está suspendido por violar políticas. No puede login.

**P: ¿Puedo deshacer acciones?**
- R: Sí, todos los botones son reversibles (Verificar → sin verificar, Banear → Desbanear, etc.)

---

## 📊 Próximas Mejoras

- [ ] Agregar más stats (usuarios por mes, revenue por mes)
- [ ] Agregar búsqueda por email en tabla de usuarios
- [ ] Agregar paginación (ahora muestra todos)
- [ ] Agregar logs de acciones de admin
- [ ] Agregar rate limiting por IP en endpoints admin
- [ ] Agregar auditoría (quién cambió qué y cuándo)

---

**Admin Dashboard completamente funcional!** 🎉

Para empezar: Ejecuta el SQL en Supabase, luego accede a `/admin`
