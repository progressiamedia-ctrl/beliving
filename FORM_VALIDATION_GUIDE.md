# 📝 Guía de Validación de Formularios — Be Living

**Estado:** ✅ Implementado  
**Última actualización:** 2026-05-01

---

## Overview

Todos los formularios en Be Living incluyen validación robusta con mensajes de error específicos y accesibles.

---

## 🔐 AuthForm (Login / Registro)

### Email Validation
```javascript
// Patrón
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Casos validados
✓ usuario@ejemplo.com — válido
✓ nombre.apellido@dominio.co.uk — válido
✗ usuario@ejemplo — inválido (sin TLD)
✗ usuario @ ejemplo.com — inválido (espacios)
✗ @ejemplo.com — inválido (sin local part)
✗ usuario@.com — inválido (sin dominio)
```

**Mensajes de error:**
- Campo vacío: "El email es requerido"
- Formato inválido: "Por favor ingresa un email válido (ej: usuario@ejemplo.com)"

### Password Validation (Registro)
```javascript
// Requisitos
- Mínimo 6 caracteres ✓
- Máximo 128 caracteres ✓
- No hay restricción de caracteres (permite !@#$%^&*)

// Casos validados
✓ Password123 — válido
✓ p@ssw0rd! — válido (caracteres especiales)
✓ 123456 — válido (números solos)
✗ 12345 — inválido (< 6 caracteres)
✗ (empty) — inválido (requerido)
```

**Mensajes de error:**
- Campo vacío: "La contraseña es requerida"
- Muy corta: "La contraseña debe tener al menos 6 caracteres"
- Muy larga: "La contraseña no puede exceder 128 caracteres"

### Password Confirmation
```javascript
// Debe coincidir exactamente con password

// Casos validados
✓ password = "test123", confirmPassword = "test123" — válido
✗ password = "test123", confirmPassword = "test124" — inválido
✗ confirmPassword = "" mientras password tiene valor — inválido
```

**Mensaje de error:**
- No coinciden: "Las contraseñas no coinciden"

### Role Selection
```javascript
// Debe seleccionar antes de submit
- 'guest' (Viajero)
- 'host' (Anfitrión)

// Validación
✗ Sin seleccionar: "Debes seleccionar un tipo de cuenta"
```

---

## 🏠 PropertyForm (Crear / Editar Propiedad)

### Title Validation
```javascript
// Requisitos
- Mínimo 5 caracteres ✓
- Máximo 100 caracteres ✓
- Requerido ✓
- Trimmed (sin espacios al inicio/final) ✓

// Casos validados
✓ "Apartamento Moderno en Madrid" (32 caracteres)
✓ "Villa de Lujo" (12 caracteres)
✗ "" — inválido (vacío)
✗ "Casa" — inválido (< 5 caracteres)
✗ "Este es un título muy largo que excede el límite de 100 caracteres establecido para las propiedades en el sistema" — inválido (> 100)
```

**Mensajes de error:**
- Vacío: "El título de la propiedad es requerido"
- Muy corto: "El título debe tener al menos 5 caracteres"
- Muy largo: "El título no puede exceder 100 caracteres"

### Description Validation
```javascript
// Requisitos
- Máximo 2000 caracteres ✓
- Opcional ✓
- Trimmed ✓

// Casos validados
✓ "" — válido (opcional)
✓ "Hermosa casa con vistas al mar, ideal para familias" — válido
✗ "Texto super largo que supera los 2000 caracteres..." — inválido
```

**Mensaje de error:**
- Muy largo: "La descripción no puede exceder 2000 caracteres"

### Price Validation
```javascript
// Requisitos
- Mínimo 1 USD ✓
- Máximo 99999 USD ✓
- Debe ser número ✓
- Requerido ✓

// Casos validados
✓ 50 — válido
✓ 150.99 — válido (decimales)
✓ 1 — válido (mínimo)
✓ 99999 — válido (máximo)
✗ "" — inválido (requerido)
✗ "abc" — inválido (no numérico)
✗ 0 — inválido (< 1)
✗ -50 — inválido (negativo)
✗ 100000 — inválido (> 99999)
```

**Mensajes de error:**
- Vacío: "El precio por noche es requerido"
- No numérico: "El precio debe ser un número válido"
- Menor a 1: "El precio debe ser mayor a 0"
- Mayor a 99999: "El precio es demasiado alto"

### Location Validation
```javascript
// Requisitos
- Mínimo 3 caracteres ✓
- Requerido ✓
- Trimmed ✓

// Casos validados
✓ "Madrid" — válido
✓ "Calle Principal 123, Barcelona, España" — válido
✗ "" — inválido (requerido)
✗ "NY" — inválido (< 3 caracteres)
```

**Mensajes de error:**
- Vacío: "La ubicación es requerida"
- Muy corta: "La ubicación debe tener al menos 3 caracteres"

### Amenities Validation
```javascript
// Requisitos
- Máximo 20 amenidades ✓
- Separadas por comas ✓
- Trimmed ✓
- Opcional ✓

// Casos validados
✓ "WiFi, Piscina, Cocina, Aire acondicionado"
✓ "" — válido (opcional)
✓ "WiFi, Piscina" — válido
✗ "WiFi, Piscina, Cocina, Aire, Gym, Sauna, Balcón, Lavadora, Secadora, Microondas, Horno, Refrigerador, Calefacción, Agua Caliente, Acceso Internet, Estacionamiento, Seguridad 24/7, Limpieza, Toallas, Sábanas, Más de 20" — inválido (> 20 items)
```

**Mensaje de error:**
- Demasiadas amenidades: "No puedes agregar más de 20 amenidades"

---

## 🎫 Register with Magic Link Form

### Email Verification
```javascript
// El email viene verificado del magic link
// Solo mostrar como read-only con ✓
✓ usuario@ejemplo.com (Verificado con Magic Link)
```

### Role Selection
```javascript
// Mismo que en AuthForm
- 'guest' (Huésped)
- 'host' (Anfitrión)
```

---

## 📋 Onboarding Forms (Guest & Host)

### Guest Onboarding Questions
**Q1: Destino (Destination)**
- Required
- Uno de: Dubai, Barcelona, Madrid, Viña del Mar, Bali, Cancun

**Q2: Tipo de Alojamiento (Property Type)**
- Required
- Uno de: Luxury Villa, Modern Apartment, Beachfront, Mountain Retreat, Urban Loft

**Q3: Presupuesto (Budget)**
- Required
- Uno de: < $300, $300-$500, $500-$1000, > $1000

**Q4: Propósito (Purpose)**
- Required
- Uno de: Vacation, Work, Investment Exploration, Family Time

**Q5: Experiencias (Experiences)**
- Múltiple selección permitida
- Uno de: Relax, Party, Explore, Luxury

### Host Onboarding Questions
**Q1: Tipo de Propiedad (Property Type)**
- Required
- Uno de: Villa, Apartment, House, Condo, Resort, Boutique Hotel

**Q2: Ubicación (Location)**
- Required
- Uno de: Dubai, Barcelona, Madrid, Viña del Mar, Bali, Cancun, Other

**Q3: Precio Promedio (Average Price)**
- Required
- Uno de: < $200, $200-$400, $400-$700, > $700

**Q4: Ocupación (Occupancy)**
- Required
- Uno de: < 30%, 30-50%, 50-70%, > 70%

**Q5: Objetivos (Goals)**
- Múltiple selección permitida
- Uno de: More Bookings, Higher Pricing, International Exposure, Brand Building

---

## 📝 Rating Form

### Fields
- **Rating (1-5 stars):** Required
- **Comment:** Optional, máx 1000 caracteres

### Validation
```javascript
// Rating
✓ 1-5 — válido
✗ 0 — inválido (mínimo 1)
✗ 6 — inválido (máximo 5)

// Comment
✓ "" — válido (opcional)
✓ "Excelente lugar, muy recomendado" — válido
✗ (>1000 caracteres) — inválido
```

---

## 🔍 Validación General — Todos los Formularios

### Lado del Cliente
✓ Email format validation  
✓ Required field validation  
✓ Length validation (min/max)  
✓ Number range validation  
✓ Type validation (number vs string)  
✓ Immediate feedback on blur/change  
✓ Error messages are specific and helpful  

### Lado del Servidor
✓ Validación duplicada en API  
✓ Sanitización de inputs  
✓ XSS prevention  
✓ SQL injection prevention (Supabase)  
✓ Rate limiting (si aplica)  

---

## 🎨 Error Message Design

### Visual Indicators
- [ ] Borde rojo en input con error
- [ ] Icon `⚠️` o `✗` junto al error
- [ ] Color de texto rojo/naranja
- [ ] Suficiente contraste (WCAG AA)

### Accesibilidad
- [ ] `role="alert"` en error message
- [ ] `aria-invalid="true"` en input
- [ ] `aria-describedby` linking input to error
- [ ] Error message anunciado a screen reader

### UX
- [ ] Mensaje claro y específico (no "Error")
- [ ] Mensaje en castellano
- [ ] Sugiere qué corregir
- [ ] No culpa al usuario ("Por favor ingresa...")

---

## ✅ Testing Checklist

### AuthForm
- [ ] Email validation con regex
- [ ] Password mín 6, máx 128 caracteres
- [ ] Passwords deben coincidir
- [ ] Role must be selected
- [ ] Success redirect correcto (guest → /properties, host → /host/dashboard)
- [ ] Error messages son específicos

### PropertyForm
- [ ] Title (5-100 caracteres)
- [ ] Price (1-99999 USD)
- [ ] Location (mín 3 caracteres)
- [ ] Amenities (máx 20)
- [ ] Whitespace trimmed
- [ ] Validación en create y update

### Rating Form
- [ ] Rating 1-5 requerido
- [ ] Comment opcional, máx 1000 caracteres

### Onboarding
- [ ] Todos los campos requeridos
- [ ] Navegación forward/backward
- [ ] Progreso actualiza correctamente
- [ ] Final redirect correcto

---

## 🚀 Ejemplos de Uso

### Validar Email
```javascript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Uso
if (!validateEmail(userEmail)) {
  setError('Por favor ingresa un email válido')
}
```

### Validar Número
```javascript
const validatePrice = (price: string): string | null => {
  const num = parseFloat(price)
  if (isNaN(num)) return 'El precio debe ser un número válido'
  if (num < 1) return 'El precio debe ser mayor a 0'
  if (num > 99999) return 'El precio es demasiado alto'
  return null
}

// Uso
const error = validatePrice(formPrice)
if (error) setError(error)
```

### Validar Longitud
```javascript
const validateLength = (text: string, min: number, max: number): string | null => {
  if (!text) return 'Este campo es requerido'
  if (text.length < min) return `Mínimo ${min} caracteres`
  if (text.length > max) return `Máximo ${max} caracteres`
  return null
}

// Uso
const error = validateLength(title, 5, 100)
if (error) setError(error)
```

---

## 📚 Referencias

- Email validation: RFC 5322 (simplified version used)
- Password requirements: NIST guidelines
- Form validation: Web Standards & Accessibility

**Última revisión:** 2026-05-01
