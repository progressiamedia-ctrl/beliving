# 🔐 GUÍA DE ACCESO - BE LIVING

## ✅ PROBLEMA SOLUCIONADO

Se agregaron las opciones de **Agent** y **Admin** al login. Ahora tienes 4 opciones de rol:
- ✅ Viajero (Guest)
- ✅ Anfitrión (Host)
- ✅ Agente (Agent) - **NUEVO**
- ✅ Admin (Admin) - **NUEVO**

---

## 🌐 CÓMO ACCEDER A CADA PERFIL

### En https://beliving-alpha.vercel.app

Al entrar, verás la pantalla de selección de rol con 4 opciones:

```
┌─────────────────────────────────────┐
│           Be Living                 │
│     ¿Cuál es tu rol?               │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ ✈️  Viajero                  │   │
│ │ Buscar hospedajes            │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ 🔑  Anfitrión                │   │
│ │ Listar propiedades           │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ 💰  Agente                   │   │
│ │ Referir y ganar comisiones   │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ 👨‍💼 Admin                     │   │
│ │ Gestionar plataforma         │   │
│ └──────────────────────────────┘   │
│                                     │
│      ¿Ya tienes cuenta?             │
│         [Ingresar]                  │
└─────────────────────────────────────┘
```

---

## 📋 OPCIÓN 1: CREAR CUENTA NUEVA

### Para Viajero (Guest)
1. Click en "✈️ Viajero"
2. Ingresar email y contraseña
3. Confirmar contraseña
4. Click "Crear cuenta"
5. **Te lleva a:** `/onboarding/guest` → Dashboard de búsqueda

### Para Anfitrión (Host)
1. Click en "🔑 Anfitrión"
2. Ingresar email y contraseña
3. Confirmar contraseña
4. Click "Crear cuenta"
5. **Te lleva a:** `/onboarding/host` → Subir propiedades

### Para Agente (Agent) ⭐ NUEVO
1. Click en "💰 Agente"
2. Ingresar email y contraseña
3. Confirmar contraseña
4. Click "Crear cuenta"
5. **Te lleva a:** `/onboarding/agent` → Setup del agente
6. **Dashboard final:** `/agent` → Dashboard profesional con 5 tabs

### Para Admin (Admin) ⭐ NUEVO
1. Click en "👨‍💼 Admin"
2. Ingresar email y contraseña
3. Confirmar contraseña
4. Click "Crear cuenta"
5. **Te lleva a:** `/onboarding/admin` → Setup del admin
6. **Dashboard final:** `/admin` → Panel de administración

---

## 🔑 OPCIÓN 2: INICIAR SESIÓN

### Si ya tienes una cuenta

1. Click en **"¿Ya tienes cuenta?"**
2. Click en **"Ingresar"**
3. Ingresar tu email y contraseña
4. **Te lleva automáticamente a:**
   - **Guest:** `/properties` (Búsqueda de hospedajes)
   - **Host:** `/host/dashboard` (Dashboard de anfitrión)
   - **Agent:** `/agent` (Dashboard de agente)
   - **Admin:** `/admin` (Panel administrativo)

---

## 📊 QUÉ VES EN CADA DASHBOARD

### 👤 GUEST - `/properties`
- Búsqueda y filtrado de propiedades
- Historial de reservas
- Ratings y comentarios
- Mensajes con anfitriones

### 🏠 HOST - `/host/dashboard`
- Dashboard de propiedades
- Reservas pendientes/confirmadas
- Calendario de disponibilidad
- Estadísticas de ingresos

### 💰 AGENT - `/agent`
**5 Tabs principales:**
1. **Resumen**
   - Tier actual (0-5)
   - KPIs: Este mes, Total vida, Comisión actual
   - Progreso hacia siguiente tier
   - Gráfico de comisiones

2. **Desafíos**
   - Challenges mensuales
   - Triple Threat, Host Magnet, Booking Blitz
   - Progreso y premios

3. **Sub-Afiliados** (Tier 4+)
   - Tu red de agentes referidos
   - Comisiones pasivas
   - Performance del equipo

4. **Earnings**
   - Historial detallado de comisiones
   - Últimos 6 meses
   - Breakdown por tipo
   - Proyecciones

5. **Configuración**
   - Tu código de agente
   - Links de referral (host/guest)
   - Información de pago

### 👨‍💼 ADMIN - `/admin`
- Dashboard de estadísticas globales
- Gestión de agentes (enable/disable)
- Cambiar tiers manualmente
- Ver analytics del sistema
- Tabla de usuarios

---

## 🎯 FLUJO COMPLETO DE REFERRAL (AGENTE)

### Paso 1: Crear tu cuenta como Agente
```
Login → Agente → Email + Password → Dashboard /agent
```

### Paso 2: Obtener tu código de referral
```
Dashboard Agent → Configuración → Ver tu código único
```

### Paso 3: Compartir links de referral
**Para traer Hosts:**
```
https://beliving-alpha.vercel.app/ref/TU_CODIGO?type=host
```

**Para traer Guests:**
```
https://beliving-alpha.vercel.app/ref/TU_CODIGO?type=guest
```

### Paso 4: Monitorear comisiones
- Guest se registra con tu link → Comisión en reservas (0.5%-3%)
- Host se registra con tu link → Comisión en suscripción (3%-10%)
- Ver todo en tab "Earnings"

---

## ⚠️ POR QUÉ APARECÍA EN NEGRO

El diseño aparecía oscuro porque:
1. **Problema de contraste:** El tema estaba seteado a dark mode
2. **Falta de logo:** `/logo.png` no existía (se mostraba gris)
3. **Estilos de CSS:** Tailwind tenía clases que se veían negras

**Solución aplicada:**
- ✅ Actualizado AuthForm con colores light mode
- ✅ Paleta clara: blanco, gris, amarillo/naranja (guest), azul/púrpura (host), verde/esmeralda (agent), rojo/rosa (admin)
- ✅ Contraste mejorado para legibilidad
- ✅ Efecto glass-morphism en la tarjeta de login

---

## 🧪 CUENTAS DE PRUEBA (Para Testing)

Puedes crear cuentas nuevas con cualquier email de prueba:

```
Email: test-agent@example.com
Password: Password123!

Email: test-admin@example.com
Password: Password123!

Email: test-host@example.com
Password: Password123!

Email: test-guest@example.com
Password: Password123!
```

**Nota:** Las contraseñas deben tener:
- Mínimo 6 caracteres
- Máximo 128 caracteres

---

## 📱 RUTAS CLAVE

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Login / Home | Público |
| `/ref/[code]` | Landing de referral | Público |
| `/properties` | Búsqueda (Guest) | Guest auth |
| `/host/dashboard` | Dashboard Host | Host auth |
| `/agent` | Dashboard Agent | Agent auth |
| `/admin` | Panel Admin | Admin auth |
| `/onboarding/guest` | Setup inicial Guest | After signup |
| `/onboarding/host` | Setup inicial Host | After signup |
| `/onboarding/agent` | Setup inicial Agent | After signup |
| `/onboarding/admin` | Setup inicial Admin | After signup |

---

## 🔒 SEGURIDAD DE ACCESO

- ✅ Bearer token authentication en API
- ✅ localStorage guarda: userId, userRole, userEmail
- ✅ Cada ruta verifica userRole antes de renderizar
- ✅ Redirección automática si no estás autenticado
- ✅ CRON_SECRET protege scheduled jobs

---

## 💡 TIPS

1. **Para testing de agente:**
   - Crea 2 cuentas: 1 agent, 1 guest/host
   - Usa el link de referral del agente
   - Verifica que se cree la comisión

2. **Para testing de admin:**
   - Crea cuenta admin
   - Ve a `/admin`
   - Intenta cambiar tier de otro agente

3. **Para testing de comisiones:**
   - Guest hace booking → Comisión aparece en agent dashboard
   - El agent puede ver en "Earnings" → "Todas las comisiones"

---

**Actualización:** 2026-05-04  
**Status:** ✅ Diseño arreglado + Perfiles de Agente y Admin habilitados
