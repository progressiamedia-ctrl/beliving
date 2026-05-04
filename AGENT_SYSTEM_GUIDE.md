# 🚀 Sistema de Comisiones y Tiers para Agentes - GUÍA DE USO

## 📋 Resumen General

Be Living ahora tiene un sistema completo de comisiones, tiers escalonados, desafíos mensuales, y sub-afiliados para agentes. Este sistema está diseñado para ser escalable, automatizado y motivador.

---

## 🎯 Componentes Clave

### 1. **Tiers de Agentes (6 Niveles)**

```
Tier 0 (Iniciante)   → 3% suscripciones, 0.5% reservas
Tier 1 (Especialista) → 5% suscripciones, 1.0% reservas
Tier 2 (Profesional)  → 6% suscripciones, 1.5% reservas
Tier 3 (Experto)      → 7% suscripciones, 2.0% reservas
Tier 4 (Elite)        → 8% suscripciones, 2.5% reservas + Sub-afiliados (2%)
Tier 5 (Supremo)      → 10% suscripciones, 3.0% reservas + Sub-afiliados (2%)
```

### 2. **Comisiones Congeladas (Período de Cancelación)**

- **Suscripción MES**: 7 días congelada → Día 8 desbloqueada
- **Suscripción AÑO**: 15 días congelada → Día 16 desbloqueada

Después del período de congelación, la comisión se acredita automáticamente.

### 3. **Requisitos de Tier (Auto-upgrade)**

| Tier | Suscripciones | Reservas/mes |
|------|---------------|-------------|
| 1    | 15            | 10          |
| 2    | 40            | 40          |
| 3    | 100           | 80          |
| 4    | 200           | 150         |
| 5    | 400           | 300         |

Los agentes suben automáticamente cuando alcanzan estos requisitos.

---

## 🔧 Configuración Inicial

### 1. **Desafíos Mensuales**

Cada mes debes crear desafíos para mantener a los agentes motivados. Usa:

```bash
POST /api/agent/challenges
```

Body:
```json
{
  "challenges": [
    {
      "type": "triple_threat",
      "name": "Triple Threat - Mayo 2026",
      "description": "Suscripciones + Reservas + Actividad"
    },
    {
      "type": "host_magnet",
      "name": "Host Magnet - Mayo 2026",
      "description": "Enfocado en nuevas suscripciones"
    },
    {
      "type": "booking_blitz",
      "name": "Booking Blitz - Mayo 2026",
      "description": "Enfocado en nuevas reservas"
    }
  ]
}
```

### 2. **Cron Jobs (Automación)**

#### a. Descongelar Comisiones (Cada 1 hora)

```bash
POST /api/cron/unfreeze-commissions
```

Descongelará automáticamente cualquier comisión cuyo período de cancelación haya terminado.

#### b. Verificar Tier Eligibility (Cada 24 horas)

```bash
POST /api/cron/check-tier-eligibility
```

Verificará automáticamente si los agentes cumplen requisitos de tier y los ascenderá.

**Para configurar estos cron jobs:**

- **Opción 1**: Usar Vercel Crons (recomendado)
- **Opción 2**: Usar externa como EasyCron, LaunchDarkly, o tu propio backend

En `vercel.json` o `vercel.ts` (próximamente):
```json
{
  "crons": [
    { "path": "/api/cron/unfreeze-commissions", "schedule": "0 * * * *" },
    { "path": "/api/cron/check-tier-eligibility", "schedule": "0 2 * * *" }
  ]
}
```

---

## 💰 Flujo de Comisiones

### 1. **Cuando un Host Compra Suscripción**

```
Host compra $19.99 (mensual)
  ↓
Agente comisión = $19.99 × % tier (ej: 5% = $0.99)
  ↓
Comisión se CONGELA por 7 días
  ↓
Llamada a: POST /api/agent/commission-subscription
  ↓
Día 8: Cron job descongelada automáticamente
  ↓
Agente ve en dashboard como GANADO
```

### 2. **Cuando se Confirma una Reserva**

```
Guest reserva por $200, Service Fee = $20 (10%)
  ↓
Sistema verifica: ¿Guest fue referido por algún agente?
  ↓
SI: Crear comisión = $20 × % tier (ej: 1.5% = $0.30)
  ↓
Llamada a: POST /api/agent/commission-reservation
  ↓
Comisión aparece INMEDIATAMENTE como GANADO
  ↓
Si agente es Tier 4+:
  - Calcular 2% para cada sub-afiliado
  - Crear comisión_sub_afiliado
```

### 3. **Sub-Afiliados (Tier 4+)**

```
Agent Elite refiere a nuevo Agent
  ↓
Llamada a: POST /api/agent/sub-affiliates
  ↓
Agent nuevo comienza a generar comisiones
  ↓
Agent Elite recibe 2% de todas las comisiones del nuevo
  ↓
Aparece en dashboard como ingreso PASIVO
```

---

## 📊 Dashboard del Agente

**URL**: `/agent`

Muestra:
- **Tier Actual** con progreso visual hacia siguiente tier
- **KPI Cards**: Este mes, Total de vida, Comisión actual
- **Barras de Progreso**: Suscripciones y reservas hacia siguiente tier
- **5 Tabs**:
  1. **Resumen**: KPIs + Desglose de ingresos
  2. **Desafíos**: Desafíos mensuales y progreso
  3. **Sub-Afiliados** (Tier 4+): Tu equipo y ganancias
  4. **Earnings**: Historial detallado de ingresos
  5. **Configuración**: Código de referido y links

---

## 🔌 Integraciones Necesarias

### 1. **Cuando Host Compra Suscripción**

En tu endpoint de suscripción, después de crear la suscripción:

```typescript
// POST /api/subscriptions
if (subscription.created) {
  // Procesar comisión del agente
  const commissionRes = await fetch('/api/agent/commission-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: subscription.referrer_agent_id, // Si existe
      hostId: subscription.host_id,
      subscriptionId: subscription.id,
      subscriptionType: subscription.subscription_type, // 'monthly' | 'annual'
      amount: subscription.amount // $19.99 o $254.88
    })
  })
}
```

### 2. **Cuando se Confirma una Reserva**

En tu endpoint de actualizar booking status:

```typescript
// POST /api/bookings/[id]
if (body.status === 'confirmed') {
  // Procesar comisiones de reserva
  const commissionRes = await fetch('/api/agent/commission-reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: booking.id,
      guestId: booking.guest_id,
      hostId: booking.host_id,
      propertyId: booking.property_id,
      totalPrice: booking.total_price,
      serviceFee: booking.service_fee_amount || (booking.total_price * 10 / 100), // 10% máximo
      checkIn: booking.check_in,
      checkOut: booking.check_out
    })
  })
}
```

### 3. **Crear Desafío Mensual**

Al inicio de cada mes, crea los 3 desafíos:

```typescript
// En tu backend o admin panel
const challengesRes = await fetch('/api/agent/challenges', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challenges: [
      {
        type: 'triple_threat',
        name: `Triple Threat - ${monthName}`,
        description: 'Suscripciones + Reservas + Actividad'
      },
      {
        type: 'host_magnet',
        name: `Host Magnet - ${monthName}`,
        description: 'Nuevas suscripciones'
      },
      {
        type: 'booking_blitz',
        name: `Booking Blitz - ${monthName}`,
        description: 'Nuevas reservas'
      }
    ]
  })
})
```

---

## 📈 Endpoints Disponibles

### Dashboard
- **GET** `/api/agent/dashboard?agent_id=UUID` - Datos completos del dashboard

### Comisiones
- **POST** `/api/agent/commission-subscription` - Crear comisión de suscripción
- **POST** `/api/agent/commission-reservation` - Crear comisión de reserva

### Desafíos
- **GET** `/api/agent/challenges?agent_id=UUID` - Obtener desafíos del mes
- **POST** `/api/agent/challenges` - Crear desafíos (admin)

### Sub-Afiliados
- **GET** `/api/agent/sub-affiliates?agent_id=UUID` - Ver sub-afiliados
- **POST** `/api/agent/sub-affiliates` - Crear referral

### Earnings
- **GET** `/api/agent/earnings?agent_id=UUID&period=month` - Histórico detallado

### Cron Jobs
- **POST** `/api/cron/unfreeze-commissions` - Descongelar comisiones (cada hora)
- **POST** `/api/cron/check-tier-eligibility` - Verificar tier ups (cada día)

---

## 🎮 Gamificación

Cada mes hay **3 desafíos** con premios:

1. **Triple Threat**: Suscripciones + Reservas + Actividad
   - Premio: +1.5% comisión en reservas por 30 días

2. **Host Magnet**: Solo nuevas suscripciones
   - Premio: $50-200 CASH + Featured profile

3. **Booking Blitz**: Solo nuevas reservas
   - Premio: +1% comisión suscripciones por 60 días

**Bonus**: Si completa los 3 desafíos en un mes
- +$100 CASH
- +0.5% ambas comisiones por 90 días
- "Overachiever" badge

---

## 📌 Próximas Mejoras Opcionales

- [ ] Leaderboard global (top 10 agentes del mes)
- [ ] Notificaciones de tier up
- [ ] Reportes mensuales por email
- [ ] Analytics avanzadas para agentes Elite
- [ ] API para CRM integrado (Tier 5)
- [ ] Programa de incentivos anuales
- [ ] Tier downgrade automático (si cae requisitos)

---

## ⚠️ Notas Importantes

1. **Service Fee debe estar en bookings.service_fee_amount** - Sin esto no funciona comisión de reservas
2. **Cron jobs deben ejecutarse regularmente** - Sin ellos, comisiones no se descongelan
3. **Backup de BD regular** - Usa Supabase backups automáticos
4. **Monitorea frozen_commissions** - Si hay comisiones viejas sin descongelar, investiga

---

## 🚨 Debugging

Si algo no funciona:

1. **Comisión congelada no se desbloquea**: Verifica que cron unfreeze-commissions esté configurado
2. **Agent no sube de tier**: Verifica `agent_subs_active` y `agent_reservations_this_month` en DB
3. **Sub-afiliados no ven comisiones**: Verifica que agente referrer sea Tier 4+
4. **Service fee no se calcula**: Asegúrate que `service_fee_amount` se guarde en bookings

---

**Última actualización**: Mayo 2026
**Versión**: 1.0 - Sistema Completo
